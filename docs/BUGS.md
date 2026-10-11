# Bug Audit

Findings from a systematic pass over the repository, using the TypeScript compiler's
unused-code checks (`--noUnusedLocals --noUnusedParameters`) as a probe alongside manual
review. Status: **fixed** = corrected and verified in this repo · **open** = documented,
not yet fixed.

## Functional bugs

| # | Issue | Where | Impact | Status |
| --- | --- | --- | --- | --- |
| F1 | `displayedChordId` is written but never read. The "promote the workbench chord" effect therefore does nothing, and `displayedChord` collapses to `activeChord` — the documented "keep it for the rest of the tab" behaviour was never implemented. | `GuitarFretboard.tsx` | Dead logic; misleading comments | **fixed** |
| F2 | `safeBpmIndex` computes a comment-documented "safety clamp" for the SVG maths, but the value is never used, so the clamp it promises does not exist. | `RhythmMetronome.tsx` | Missing guard the comment claims | **fixed** |
| F3 | `getFindIndex(strings, idx)` ignores its `strings` argument and returns `idx & 255` — a no-op with a misleading name. Unused by the app. | `musicTheory.ts` | Dead, confusing API | **fixed** |
| F4 | `getNoteIndex` masked its result with `& 255`, turning the `-1` "not found" sentinel into `255`. | `musicTheory.ts` | Wrong lookup result | **fixed** (earlier) |
| F5 | `transposeNoteSafeAny` ignored `NOTE_ALIASES`, so `'Db'` returned `C` instead of transposing. | `musicTheory.ts` | Wrong transposition | **fixed** (earlier) |
| F6 | `ChordWorkbench` labels the third default card `// B Minor`, but index 12 of `COMPREHENSIVE_CHORDS` is **D Major**. | `ChordWorkbench.tsx` | Wrong comment | **fixed** — the studio resolves its starting cards by name (`findOrCreateChord('B', 'Minor')`) |
| F7 | `public/metronome.js` is a comment-only stub with no implementation and no `<script>` tag loading it. | `public/metronome.js` | Dead asset shipped to production | **fixed** — deleted; the real metronome is the React component |
| F8 | The BPM slider's fill referenced `var(--v, 50)`, but `--v` was never set, so the filled track sat at a fixed 27.8% instead of tracking the thumb. | `style.css`, `RhythmMetronome.tsx` | Slider fill never moved | **fixed** |
| F9 | Auto mode pinned a concrete instrument on the sound engine, and the engine's priority order (`activeInstrument !== 'auto'` wins) then beat every per-call voice. On the Scales tab with the piano visualizer, clicking piano keys played **guitar**, and the engine could never return to `auto` once the tab effect had run. | `App.tsx`, `TopBar.tsx`, `utils/audio.ts` | Wrong instrument played | **fixed** |

## Dead code and unfinished logic

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| D1 | 17 unused locals/imports flagged by the compiler (unused imports, write-only state, unused params). See the full list below. | across `src/`, `scripts/` | **fixed** |
| D2 | Three parallel copies of autocorrelation pitch detection: `detectPitch` (+ `detectPitchVanilla`/`detectPitchLite` aliases) and `autoCorrelate` in the tuner, plus `detectPitch` in `musicTheory.ts`. | `GuitarTuner.tsx`, `musicTheory.ts` | **fixed** — the tuner now runs on the shared `useLivePitch` hook over the one `detectPitch` in `musicTheory.ts`; the tuner's private copies and aliases are gone |
| D3 | Overlapping helper aliases: `noteNameAt` / `getNoteByCheckedIndex` / `noteNameFromIndex`, and `stringInfoAt` / `getGuitarStringInfo` / `resolveGuitarString` are identical behaviours under different names. | `musicTheory.ts` | **fixed** — collapsed into `noteNameAt` / `stringInfoAt` |
| D4 | `scripts/build-pages.ts` walked the whole reference tree into `mdFiles` and then discarded it — wasted I/O on every run. | `scripts/build-pages.ts` | **fixed** |

Full D1 list: `writeFileSync`, `relative`, `mdFiles` (build-pages), `useMemo` (App),
`noteNameAt` + `displayedChordId` (GuitarFretboard), `selectedGuitarStringInfo` +
`handlePegClick` + `currentPitch` + `presetStrings` (GuitarTuner), `noteColorFor`
(IntervalExplorer), `NOTE_COLORS` (PianoKeyboard), `pendulumDir` + `beat` + `safeBpmIndex`
(RhythmMetronome), `NOTE_COLORS` (test), `strings` param (getFindIndex).

## Configuration and build faults

| # | Issue | Where | Impact | Status |
| --- | --- | --- | --- | --- |
| C1 | The stylesheet is loaded **twice**: `<link rel="stylesheet" href="/src/style.css">` in `index.html` **and** `import './style.css'` in `main.tsx`. | `index.html`, `main.tsx` | Duplicate CSS in the build | **fixed** |
| C2 | Google Fonts are declared **twice with different families/weights**: `index.html` loads Outfit 300–700 + JetBrains Mono; `style.css` re-imports Outfit 300–800 + Space Grotesk. | `index.html`, `style.css` | Double font fetch, render-blocking `@import` | **fixed** |
| C3 | `--font-mono` resolves to **Space Grotesk**, which is not a monospace face, while the actually-monospace JetBrains Mono was loaded but never used. | `style.css` | Numeric readouts misalign | **open** (documented; changing it shifts several readouts) |
| C4 | `tsconfig.json` includes `"vite.config.ts"`, but the file is `vite.config.js`, so the config is not type-checked by the include. | `tsconfig.json` | Config never checked | **fixed** |
| C5 | `src/env.d.ts` declares Astro-era `PUBLIC_SITE_URL` / `PUBLIC_API_URL` / `PUBLIC_SITE_NAME` / `PORT` env vars that nothing in the app reads. | `src/env.d.ts` | Stale types | **fixed** |
| C6 | `.gitignore` listed `public/data/*.json` and `scripts/build-pages.ts` as ignored while both are **tracked**, and ignored legacy Astro paths that no longer exist. | `.gitignore` | Misleading; hides real new files | **fixed** |
| C7 | `tsconfig.tsbuildinfo` (a generated build cache) was committed, so every typecheck dirtied the tree. | repo root | Commit churn | **fixed** |
| C8 | The readme said "MIT" but the repo shipped no `LICENSE` file, and a public static site had no `robots.txt`. | repo root, `public/` | Licence claim unverifiable; no crawl policy | **fixed** — `LICENSE` (MIT, 2026) and `public/robots.txt` |
| C9 | The shell kept its own tab list (`VALID_TABS`, `TAB_DEFAULT_INSTRUMENT`), the rail kept `NAV_GROUPS`, and the top bar kept `TAB_TITLES`, so adding a screen meant editing three files that could silently disagree. Every screen was also imported eagerly. | `App.tsx`, `Header.tsx`, `TopBar.tsx` | Duplication; one big first-load bundle | **fixed** — one `ROUTES` table and a `React.lazy` chunk per screen |

## Data and content faults

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| T1 | `f-major` in `chordsData.ts` is named "F Major (Barre / Easy)" but provides only the full barre shape (`[1,3,3,2,1,1]`); there is no easy variant despite the name. | `src/data/chordsData.ts` | **open** |
| T2 | `COMPREHENSIVE_CHORDS` has no slash chords or bass-note variants, although the README describes comparing "a chord, a slash chord, and a bass-note variant". | `src/data/chordsData.ts` | **open** |
| T3 | `handleTranspose` in the chord studio changed the chord's `root`, `name`, and `notes` but left `frets` and `fingers` from the original voicing, so a transposed card showed the wrong shape. | `ChordWorkbench.tsx` | **fixed** — the handler delegates to the tested `transposeChordShape` in `chordVoicing.ts`, so the stored shape moves with the name |

## Accessibility and responsive faults

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| A1 | Classes used by components once had **no stylesheet rule at all** (`interval-header`, `chord-card-body`, `strum-btn`, `steel-name` wrappers), so those wrappers rendered unstyled. | `src/style.css` vs `src/components/*` | **fixed** — the named examples no longer appear in any component, `dual-visualizers-grid` gained its rule, and the class-drift scan recorded in `docs/PLAN.md` found no remaining styled class without a rule (plain utilities are Tailwind's) |
| A2 | Chord-card reordering is drag-only apart from an `Alt+↑/↓` fallback on the handle; touch users have no reorder affordance. | `ChordWorkbench.tsx` | **open** |
| A3 | Audio depends on an `AudioContext` created inside a user gesture, and iOS suspends that context whenever the tab is backgrounded. Desktop masked this; on iOS every play button stayed silent. | `src/utils/audio.ts` | **fixed** — one-shot pointer/touch/key listeners unlock on the first interaction and a `visibilitychange` handler resumes on return |
| A4 | Touch targets were sized for a mouse (24–32px rail items) and there was no safe-area padding, so the rail sat under the notch and taps were fiddly. | `src/style.css` | **fixed** — 40px rail items, 44px buttons, `touch-action: manipulation`, `env(safe-area-inset-*)` |
| A5 | Accent-fill controls carried ink that failed WCAG AA once measured against the real tokens: `.btn-accent` kept `color: #fff` over its ramp (3.36:1 on Nocturne's violet), `.btn-primary`'s ramp end stops sat at 4.42:1 (Nocturne) and 4.23:1 (Arcade) under the page-background ink, Studio's terracotta stop was 4.48:1, and the note pills drew uniform black ink that fell to 2.03:1 on G♯'s indigo (white wins on exactly the three dark hues). | `src/style.css`, `NotePicker.tsx`, `ChordWorkbench.tsx`, `musicTheory.ts` | **fixed** — `.btn-accent` ink follows the page background like the other buttons, three accent tokens were nudged within their hue (`--accent-secondary` on Nocturne/Arcade, `--accent-tertiary` on Studio, with their RGB triplets), and the pills pick black or white per hue via the new `inkOnNoteColor`; the audit in `src/style.test.ts` now checks both gradient stops per theme and `musicTheory.test.ts` checks all twelve note hues |

## Performance

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| P1 | `@import url(fonts.googleapis.com…)` at the top of `style.css` blocks CSS parsing on a second network round-trip; the `<link>` in `index.html` is the faster path and was already half-present. | `style.css` | **fixed** (C2) |
| P2 | Every animation frame (~60/s) while a mic path listens, `detectPitch` copies the time-domain window (`buf.slice`) and allocates a fresh correlation `Float32Array`. The session-level analyser buffer is now allocated once in `useLivePitch.ts` (was per-frame in the tuner), but the per-call slice and correlation buffer remain. | `musicTheory.ts`, `useLivePitch.ts` | **open** (narrowed — pooled buffers would remove the remaining per-frame allocation)

## Test coverage gaps

- `bun test` now covers 161 tests across 10 files — music theory and the pitch detector
  (including the note-pill ink helper `inkOnNoteColor`), the chart parser (including the
  follow-along matching maths), the router, the route table, chord voicing, preferences,
  consent, instruments, progressions, and the stylesheet guard with its WCAG contrast
  audit (text tiers on both page backgrounds, plus both accent-gradient buttons per
  theme). Still **no** component, audio, or tuner behaviour is covered, so the audio and
  UI fixes above were verified by inspection and in the preview rather than by assertions.
- `getChordPosition` is covered via `chordVoicing.test.ts`; the transpose handler it
  guards fixed T3.
- The screen components themselves are untested. A DOM test runner would be the next step;
  today the pure logic is pulled out into `utils/` specifically so it can be asserted.
