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
