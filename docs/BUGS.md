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
| F9 | Auto mode pinned a concrete instrument on the sound engine, and the engine's priority order (`activeInstrument !== 'auto'` wins) then beat every per-call voice. On the Scales tab with the piano visualizer, clicking piano keys played **guitar**, and the engine could never return to `auto` once the tab effect had run. | `App.tsx`, `TopBar.tsx`, `utils/audio.ts` | Wrong instrument played | **fixed** || F10 | `Play Progression` counted the beat over the whole card array and skipped muted cards inside `setTimeout`, so a muted card left 1.2 s of silence instead of closing the gap. The timers were also untracked: pressing Play again layered a second run on top of the first, and a card deleted mid-run still sounded its queued beat. | `ChordWorkbench.tsx` | Silent gaps, doubled playback, stale cards played | **fixed** — muted cards are filtered before scheduling, timers live in a ref and are cleared on replay / preset load / removal / unmount, and the playing card is highlighted |
| F11 | `handleAddCard` built ids from `Date.now()`, so two cards added within the same millisecond collided: duplicate React keys, and a click could act on the wrong card. | `ChordWorkbench.tsx` | Wrong card mutated | **fixed** — ids come from `crypto.randomUUID()` |
| F12 | The card's fret slider labelled position 0 "Original" for every chord, including the ones with no stored grip (D♯ Minor, most sevenths), whose diagram is a searched voicing. | `ChordFretGrid.tsx` | Label claimed a shape that does not exist | **fixed** — the label follows `usedStoredShape`: **As written**, otherwise **Open** with a **Searched voicing** caption |
| F13 | A barre was drawn as one dot per string, so F Major's index finger read as five separate fingertips; the word "Barre" was in some chord names and not others (B Major is a barre too). | `ChordFretGrid.tsx`, `src/data/chordsData.ts` | Diagram and names disagreed | **fixed** — `detectBarre` finds the finger lying across the strings, the bar is drawn once, and names no longer carry the grip || F14 | The Fretboard chord picker rendered `COMPREHENSIVE_CHORDS` in its storage order — C Major, C Minor, **C♯ Major**, C7, Cmaj7, A… — so the bar read as shuffled to anyone looking for a chord, and there was no way to see a whole progression's chords together (a twelve-bar blues was twelve full cards tall). | `src/data/chordsData.ts`, `src/routes.tsx`, `ChordWorkbench.tsx` | Confusing order, no overview | **fixed** — the table is chromatic by root with Major → Minor → 7th → Major 7th inside a root, the picker groups by root and labels buttons with the quality only, and the studio gained a **View: Cards · Chart** option that shows every chord of the set at once with its degree numeral |
| F15 | Adding a chord meant two `<select>`s and an `Add Card` button sitting in the studio header — OS-drawn option popups in the middle of a themed toolbar, no preview of the shape you were about to add, and the toolbar reflowed as the selects changed width. And **Play Progression** could only be started: it queued one timer per beat, so a wrong chord or an interruption meant sitting through the rest of the run or starting the twelve-bar blues over. | `ChordWorkbench.tsx`, `AddChordDialog.tsx` | Clumsy add flow; unstoppable playback | **fixed** — adding moved into a portalled popup (`AddChordDialog`) with a root grid, quality chips and a live preview of the grip; playback walks one beat at a time through a single tracked timer, with **Pause** (keeps the position), **Resume** (replays the chord it stopped on), **Stop**, and a `Playing chord 3 of 8` readout |

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
| T1 | `f-major` in `chordsData.ts` was named "F Major (Barre / Easy)" but provided only the full barre shape (`[1,3,3,2,1,1]`); there was no easy variant despite the name. | `src/data/chordsData.ts` | **fixed** — the name is just "F Major" now; the barre is detected from the fingering instead of the title |
| T2 | `COMPREHENSIVE_CHORDS` has no slash chords or bass-note variants, although the README describes comparing "a chord, a slash chord, and a bass-note variant". | `src/data/chordsData.ts` | **open** |
| T3 | `handleTranspose` in the chord studio changed the chord's `root`, `name`, and `notes` but left `frets` and `fingers` from the original voicing, so a transposed card showed the wrong shape. | `ChordWorkbench.tsx` | **fixed** — the handler delegates to the tested `transposeChordShape` in `chordVoicing.ts`, so the stored shape moves with the name |
| T4 | Only 7 of the 12 major roots had a stored shape. `COMPREHENSIVE_CHORDS` held no C♯, D♯, F♯, G♯ or A♯ major, so `findOrCreateChord` returned the stub — and the stub was itself a lie: `notes: [root]` behind a 1-3-5 formula, `difficulty: 'Beginner'`, and the frets/fingers of an **A minor** shape (`[-1,0,2,2,1,0]`). Adding or progressing to any of those five majors drew an A minor grip labelled after a completely different chord, with one note pill. | `src/data/chordsData.ts` | **fixed** — the five barres are stored (`c-sharp-major`, `d-sharp-major`, `f-sharp-major`, `g-sharp-major`, `a-sharp-major`), and the fallback now derives its notes and interval labels from the quality stack and leaves `frets` empty so the grid voices the real chord |
| T5 | The T3 fix was incomplete: `transposeChordShape` looked the new root up in the stored table and, when there was no entry, kept the previous chord's frets and corrected playback with an offset. That covered the stored roots but not C♯, D♯, F♯, G♯ or A♯ major — so a card read "D♯ Major" while drawing C Major's grip, and only the *sound* was transposed. `chordPositionForStrings` then treated those stale frets as a stored shape at position 0, so the drawing never corrected itself on re-render, and the chord's difficulty badge stayed behind with the old shape too. | `src/utils/chordVoicing.ts`, `ChordWorkbench.tsx` | **fixed** — a shape with no open string now shifts with the key, an open shape gets a searched voicing for the transposed notes, and every transposed card carries frets belonging to its own name with a zero playback offset. Covered by `chordVoicing.test.ts`, which asserts that a card's drawn shape may only sound that chord's notes — for every stored shape, and for every card reached by stepping a chord ±11 semitones || T7 | Verification of the table was ad-hoc: no check re-read every shape against its own name, and nothing pinned the order the picker shows. "Every chord is right" rested on eyeballing. | `src/data/chordsData.ts` | Unverified data | **verified and pinned** — a one-off audit re-checked all 22 entries (tones sounded vs named, no foreign notes, declared notes vs frets, ≤4-fret span, finger order, unique ids and root+type, difficulty vs barre) and found only one intentional omission (`c-dom7` drops the fifth). The naming rule and the order are now asserted in `chordVoicing.test.ts` |
| T6 | One chord had several names: five stored shapes carried "(Barre)" and B Major did not, while a transposed card was named `Root Type` — so stepping F Major up one semitone produced "F♯ Major" for the shape the table called "F♯ Major (Barre)". | `src/data/chordsData.ts`, `src/utils/chordVoicing.ts` | Same chord titled two ways | **fixed** — `chordDisplayName(root, type)` is the only spelling, used by the table, the derived fallback and transposition; the barre is a chip read from the fingering |

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
| P2 | Every animation frame (~60/s) while a mic path listens, `detectPitch` copied the time-domain window (`buf.slice`) and allocated a fresh correlation `Float32Array`. | `musicTheory.ts` | **fixed** — the silence-trimmed window is read in place (index offsets, no slice) and the correlation scratch is a module-level pool; the analysis maths is unchanged and the synthetic-sine detector tests still pass |

## Test coverage gaps

- `bun test` now covers 202 tests across 12 files — music theory and the pitch detector
  (including the note-pill ink helper `inkOnNoteColor`), the chart parser (including the
  follow-along matching maths), the router, the route table, chord voicing, preferences,
  consent, instruments, progressions, the stylesheet guard with its WCAG contrast
  audit (text tiers on both page backgrounds, plus both accent-gradient buttons per
  theme), the tuner's calibration and cutoff invariants (`tunings.test.ts`), and the
  tuner meter maths — smoothing, note hysteresis, colour states, angle mapping
  (`tunerMeter.test.ts`). Component render and audio behaviour are still verified by
  inspection, SSR smoke renders, and the preview rather than by DOM assertions.
- `getChordPosition` is covered via `chordVoicing.test.ts`; the transpose handler it
  guards fixed T3.
- The screen components themselves are untested. A DOM test runner would be the next step;
  today the pure logic is pulled out into `utils/` specifically so it can be asserted.
