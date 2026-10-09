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
| F6 | `ChordWorkbench` labels the third default card `// B Minor`, but index 12 of `COMPREHENSIVE_CHORDS` is **D Major**. | `ChordWorkbench.tsx` | Wrong comment | **open** |
| F7 | `public/metronome.js` is a comment-only stub with no implementation and no `<script>` tag loading it. The real metronome is the React component. | `public/metronome.js` | Dead asset shipped to production | **open** |

## Dead code and unfinished logic

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| D1 | 17 unused locals/imports flagged by the compiler (unused imports, write-only state, unused params). See the full list below. | across `src/`, `scripts/` | **fixed** |
| D2 | Three parallel copies of autocorrelation pitch detection: `detectPitch` (+ `detectPitchVanilla`/`detectPitchLite` aliases) and `autoCorrelate` in the tuner, plus `detectPitch` in `musicTheory.ts`. Two are unreachable from the running UI. | `GuitarTuner.tsx`, `musicTheory.ts` | **open** |
| D3 | Overlapping helper aliases: `noteNameAt` / `getNoteByCheckedIndex` / `noteNameFromIndex`, and `stringInfoAt` / `getGuitarStringInfo` / `resolveGuitarString` are identical behaviours under different names. | `musicTheory.ts` | **open** |
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

## Data and content faults

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| T1 | `f-major` in `chordsData.ts` is named "F Major (Barre / Easy)" but provides only the full barre shape (`[1,3,3,2,1,1]`); there is no easy variant despite the name. | `src/data/chordsData.ts` | **open** |
| T2 | `COMPREHENSIVE_CHORDS` has no slash chords or bass-note variants, although the README describes comparing "a chord, a slash chord, and a bass-note variant". | `src/data/chordsData.ts` | **open** |
| T3 | `handleTranspose` in the chord studio changes the chord's `root`, `name`, and `notes` but leaves `frets` and `fingers` from the original voicing, so a transposed card shows the wrong shape. | `ChordWorkbench.tsx` | **open** |

## Accessibility and responsive faults

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| A1 | Around 30 classes used by components have **no stylesheet rule at all** (e.g. `interval-header`, `dual-visualizers-grid`, `chord-card-body`, `strum-btn`, `steel-name` wrappers), so those wrappers render unstyled. | `src/style.css` vs `src/components/*` | **open** |
| A2 | Chord-card reordering is drag-only apart from an `Alt+↑/↓` fallback on the handle; touch users have no reorder affordance. | `ChordWorkbench.tsx` | **open** |
| A3 | Audio depends on an `AudioContext` created inside a user gesture. It worked on desktop, but iOS Safari additionally requires an explicit resume on the first touch interaction. | `src/utils/audio.ts` | **fixed** |

## Performance

| # | Issue | Where | Status |
| --- | --- | --- | --- |
| P1 | `@import url(fonts.googleapis.com…)` at the top of `style.css` blocks CSS parsing on a second network round-trip; the `<link>` in `index.html` is the faster path and was already half-present. | `style.css` | **fixed** (C2) |
| P2 | The tuner allocates a new `Float32Array` and rebuilt correlation buffer every animation frame (~60/s) while listening. | `GuitarTuner.tsx` | **open** |

## Test coverage gaps

- `bun test` covers only `src/utils/musicTheory.ts` (24 tests). No component, audio, or
  tuner behaviour is covered, so the audio and UI fixes above were verified by inspection
  and in the preview rather than by assertions.
- `getChordPosition` (fret-window generation and finger numbering) and `handleTranspose`
  are untested — T3 in particular would have been caught by a test.
