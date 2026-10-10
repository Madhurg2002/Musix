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
