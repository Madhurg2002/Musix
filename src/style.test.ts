// The stylesheet *is* the app: without it every screen renders as bare HTML on a white
// page. Commit 5846cf8 once replaced src/style.css with a fragment instead of appending to
// it and silently dropped ~2,750 lines — the build, the type check, and the unit tests all
// stayed green. This file makes that failure loud: it asserts the sheet still carries the
// token block, each layer's marker rule, balanced braces, and roughly its full length.

import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const lineCount = css.split('\n').length;

/**
 * One marker per layer of the sheet. Every entry names a rule that only exists in its own
 * section, so losing any of them means a section (or the whole file) went missing.
 */
const REQUIRED_MARKERS: string[] = [
  ':root {', // the palette every theme derives from
  '--accent-primary',
  'html[data-theme="nocturne"]',
  'html[data-theme="paper"]',
  'html[data-theme="arcade"]',
  '@layer components {', // the sheet stays in the components layer so utilities win
  '.tab-section {', // screen slot (rail, footer, top bar, hero are utilities now)
  '.select-input {', // shared controls (the footer and top bar are utilities now)
  '.btn {',
  '.tuna-arc-gauge {', // tuner screen
  '.metronome-svg {', // metronome screen (the page wrapper moved to utilities)
  '[data-tip]::after {', // tooltip layer
];

// ── WCAG contrast audit (docs/PLAN.md, accessibility pass) ─────────────────────
// A palette regression is invisible to the compiler and easy to miss in a screenshot,
// so the audit parses the token blocks straight out of the sheet and fails the suite if
// any theme's text drops below WCAG 2.1 AA (4.5:1 for small text) on either page
// background. Paper's and Arcade's muted greys were the first to fail this bar and were
// retuned in the same commit that added the audit.

/** Relative luminance per WCAG 2.1 from an `#rrggbb` hex. */
function luminance(hex: string): number {
  const channel = (index: number): number => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two `#rrggbb` colours; 1 = identical, 21 = black on white. */
function contrastRatio(a: string, b: string): number {
  const light = Math.max(luminance(a), luminance(b));
  const dark = Math.min(luminance(a), luminance(b));
  return (light + 0.05) / (dark + 0.05);
}

/** Every theme, addressed by the selector that scopes its token block. */
const THEME_SELECTORS: Record<string, string> = {
  analog: ':root',
  nocturne: 'html[data-theme="nocturne"]',
  paper: 'html[data-theme="paper"]',
  arcade: 'html[data-theme="arcade"]',
};

const TEXT_TIERS = ['--text-primary', '--text-secondary', '--text-muted'] as const;
const PAGE_BACKGROUNDS = ['--bg-primary', '--bg-secondary'] as const;
const AA_SMALL_TEXT = 4.5;

/** Pull one `#rrggbb` token out of a selector's block (theme blocks hold plain declarations). */
function tokenFrom(selector: string, token: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing block ${selector} in src/style.css`);
  const block = css.slice(start, css.indexOf('}', start));
  const value = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
  if (!value) throw new Error(`missing ${token} in ${selector}`);
  return value;
}

describe('palette contrast (docs/PLAN.md, accessibility audit)', () => {
  test('every theme clears WCAG AA (4.5:1) for all text tiers on both page backgrounds', () => {
    const failures: string[] = [];
    for (const [theme, selector] of Object.entries(THEME_SELECTORS)) {
      for (const tier of TEXT_TIERS) {
        const ink = tokenFrom(selector, tier);
        for (const bgToken of PAGE_BACKGROUNDS) {
          const paper = tokenFrom(selector, bgToken);
          const ratio = contrastRatio(ink, paper);
          if (ratio < AA_SMALL_TEXT) {
            failures.push(
              `${theme}: ${tier} on ${bgToken} is ${ratio.toFixed(2)}:1 (${ink} on ${paper})`
            );
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// The first audit pass only checked text tiers on page backgrounds, so the accent-gradient
// buttons slipped through: they carry their label in the page-background colour across a
// two-stop 135deg ramp, so both stops must clear AA on their own — glyphs sit on both
// extremes. Arcade's purple end stop was at 4.23:1 before this test existed.
const GRADIENT_BUTTONS: Record<string, readonly [string, string]> = {
  '.btn-primary': ['--accent-primary', '--accent-secondary'],
  '.btn-accent': ['--accent-tertiary', '--accent-secondary'],
};

describe('accent-gradient button contrast (docs/PLAN.md, accessibility audit)', () => {
  test('both button rules use the page-background ink the audit assumes', () => {
    const missing = Object.keys(GRADIENT_BUTTONS).filter((button) => {
      const start = css.indexOf(`${button} {`);
      return (
        start === -1 ||
        !css.slice(start, css.indexOf('}', start)).includes('color: var(--bg-primary)')
      );
    });
    expect(missing).toEqual([]);
  });

  test('every theme clears WCAG AA (4.5:1) at both gradient stops with the page-background ink', () => {
    const failures: string[] = [];
    for (const [theme, selector] of Object.entries(THEME_SELECTORS)) {
      const ink = tokenFrom(selector, '--bg-primary');
      for (const [button, stops] of Object.entries(GRADIENT_BUTTONS)) {
        for (const stop of stops) {
          const fill = tokenFrom(selector, stop);
          const ratio = contrastRatio(ink, fill);
          if (ratio < AA_SMALL_TEXT) {
            failures.push(
              `${theme}: ${button} ${stop} ${fill} under ${ink} ink is ${ratio.toFixed(2)}:1`
            );
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

// The palette audit above covers token-driven text. Component-level ink on the
// theme-independent NOTE_COLORS hues is asserted in src/utils/musicTheory.test.ts
// (inkOnNoteColor), since those fills live in the data module, not the sheet.

// The permission bar is the one surface that is deliberately translucent, so its text does
// not sit on a token — it sits on the panel's own fill blended with whatever is behind it.
// The palette audit above only covers opaque pairs, so this composites the bar over both
// page backgrounds (the lightest and darkest things it can float above) and holds every
// text tier inside it to the same AA bar. Making the panel more transparent is then a
// checked colour decision rather than a guess at how it will look.
const CONSENT_TIERS = ['--text-primary', '--text-secondary', '--text-muted'] as const;

/** The channel triplet behind a `rgba(var(--…-rgb), a)` fill. */
function tripletFrom(selector: string, token: string): [number, number, number] {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`missing block ${selector} in src/style.css`);
  const block = css.slice(start, css.indexOf('}', start));
  const value = block.match(new RegExp(`${token}:\\s*(\\d+),\\s*(\\d+),\\s*(\\d+)`));
  if (!value) throw new Error(`missing ${token} in ${selector}`);
  return [Number(value[1]), Number(value[2]), Number(value[3])];
}

const hex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

describe('translucent consent bar (docs/PLAN.md, accessibility audit)', () => {
  const panelStart = css.indexOf('.consent-bar {');
  const panelRule = css.slice(panelStart, css.indexOf('}', panelStart));
  const fill = panelRule.match(/background: rgba\(var\(--bg-secondary-rgb\), ([\d.]+)\)/);

  test('the bar keeps a themed fill with a backdrop blur, not a hardcoded colour', () => {
    // A hardcoded fill would stop tracking the theme, and transparency without a blur is
    // unreadable text over whatever happens to be behind it.
    expect(fill).not.toBeNull();
    expect(panelRule).toContain('backdrop-filter: blur(');
  });

  test('the fill stays translucent without giving up being a surface', () => {
    // The AA check below cannot fail on its own however low the alpha goes: compositing two
    // backdrops that each clear AA against the same ink always clears it, so contrast is
    // monotone and no blend can dip under the endpoints. What can go wrong is drifting so
    // transparent that the panel is no longer a surface — text over unblurred, moving page
    // content — so the design floor is pinned here instead: at least half the panel's own
    // colour, and never fully opaque (this bar is meant to be seen through).
    const alpha = Number(fill![1]);
    expect(alpha).toBeGreaterThanOrEqual(0.5);
    expect(alpha).toBeLessThan(1);
  });

  test('every text tier in the bar clears AA over the page and over a card behind it', () => {
    const alpha = Number(fill![1]);

    const failures: string[] = [];
    for (const [theme, selector] of Object.entries(THEME_SELECTORS)) {
      const panel = tripletFrom(selector, '--bg-secondary-rgb');

      // The card fill is the other surface the bar can float over (every `.glass-card` in
      // the studio), so it is composited too — over both page backgrounds.
      const card: [number, number, number] = tripletFrom(selector, '--card-rgb');
      const backdrops: Array<[string, [number, number, number]]> = [
        ...PAGE_BACKGROUNDS.map((token): [string, [number, number, number]] => {
          const value = tokenFrom(selector, token);
          return [
            token,
            [
              parseInt(value.slice(1, 3), 16),
              parseInt(value.slice(3, 5), 16),
              parseInt(value.slice(5, 7), 16),
            ],
          ];
        }),
        ['--card-rgb', card],
      ];

      for (const [backdropName, backdrop] of backdrops) {
        const blended = hex(
          panel.map((channel, i) => channel * alpha + backdrop[i]! * (1 - alpha)) as [
            number,
            number,
            number,
          ]
        );

        for (const tier of CONSENT_TIERS) {
          const ratio = contrastRatio(tokenFrom(selector, tier), blended);
          if (ratio < AA_SMALL_TEXT) {
            failures.push(
              `${theme}: ${tier} on the bar over ${backdropName} is ${ratio.toFixed(2)}:1 (alpha ${alpha})`
            );
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });
});

describe('src/style.css', () => {
  test('is still a full stylesheet, not a fragment', () => {
    // The intact sheet was ~3,800 lines before the Tailwind migration started deleting
    // sections as each screen moves to utilities, so the length floor is calibrated
    // against the migration's endpoint (tokens + keyframes + SVG + print stay as CSS).
    // What still catches 5846cf8-style truncation: the floor, the trailing brace, and
    // the marker rules below — a fragment drops out of all three at once.
    expect(lineCount).toBeGreaterThan(1000);
    expect(css.trimEnd().endsWith('}')).toBe(true);
  });

  test('keeps every layer reachable', () => {
    const missing = REQUIRED_MARKERS.filter((marker) => !css.includes(marker));
    expect(missing).toEqual([]);
  });

  test('has balanced braces, so one bad edit cannot swallow the rules after it', () => {
    const opens = css.split('{').length - 1;
    const closes = css.split('}').length - 1;
    expect(opens).toBe(closes);
    // Same calibration as the length floor: shrinks with the migration, but a swallowed
    // section unbalances the count long before it gets this low.
    expect(opens).toBeGreaterThan(130);
  });
});
