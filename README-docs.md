# Musix — Music Theory, Compressed

A browser-only interactive reference for new music learners. It pairs plain-language
explanations with visual, hands-on tools so a beginner can see *and* hear what a theory concept
looks like before they touch an instrument.

## What's inside

- **Pitch & frequencies** — note names, chromatic staff, and a frequency preview you can play
  with the mouse or keyboard.
- **Intervals** — all 12 interval names, quality, and semitone distance, with a quick lookup
  table.
- **Scales & modes** — build a scale from any root, compare scales side by side, and see the
  formula that generates each mode.
- **Chords** — pick a chord and see it next to the closest three fingerings for guitar. Cards can
  be shown together so you can compare a chord, a slash chord, and a bass-note variant.
- **Guitar fretboard** — press a chord shape and watch the exact frets and strings to press.
  Includes standard tuning, alternate tunings, and Caged/3NP shapes.
- **Rhythm studio** — tempo, accents, and a visual beat clock with metronome audio.
- **Tuner** — microphone-based pitch detection with a visual headstock and arc meter.

## Run it locally

```bash
bun install
bun dev
```

Open http://localhost:5173.

## Build it

```bash
bun build
```

Outputs `dist/`.

## Project layout

```text
index.html                # Loads /src/main.tsx
package.json              # Vite + React only
vite.config.js            # React plugin, dev/preview ports
public/
  data/                   # Bundled reference data (intervals, scales, chords, guitar maps)
  favicon.svg             # App icon
src/
  main.tsx                # Vite React entry
  App.tsx                 # Screen shell and navigation
  style.css               # App theme
  types.ts                # Shared types
  components/
    Header.tsx
    ChordWorkbench.tsx
    GuitarFretboard.tsx
    GuitarTuner.tsx
    PianoKeyboard.tsx
    ScaleExplorer.tsx
    IntervalExplorer.tsx
    RhythmMetronome.tsx
    TheoryCheatSheet.tsx
  data/
    chordsData.ts
    scalesData.ts
  utils/
    audio.ts
    musicTheory.ts
scripts/
  build-pages.ts          # Data copy helper for the app (plain Node ESM)
music-theory-reference/
  01-pitch/
  02-intervals/
  03-scales/
  04-data/
README-docs.md            # This file
README.md                 # Short readme
AGENTS.md                 # Agent workflow notes
```

## Reference data and docs

The hand-written theory notes live in `music-theory-reference/`. They are the structured source
for the app's formulas and mappings, and each file includes a short "why it matters" line aimed
at a new learner. `scripts/build-pages.ts` keeps the copied JSON in `public/data/` in sync with
`music-theory-reference/04-data/`.

```bash
bun scripts/build-pages.ts
```

## Dev notes

- Framework: Vite + React + TypeScript.
- Styling: one CSS file with a dark theme; no Tailwind or component CSS.
- This repository is a standalone site. It does not include a backend, so all data is static
  JSON and TypeScript.

## For contributors and agents

When you are making a change and want to reduce the chance of breaking the app:

1. Read `src/App.tsx` first if the change touches navigation or tab behavior.
2. Read `src/types.ts` before changing shared data shapes.
3. Read the relevant component before editing it; the app reuses props and helpers across tabs.
4. Keep the same shape for new theory data as the existing data files.
5. Run `bunx tsc -b --noEmit` after type-related changes.
6. Run `bun build` or `bun dev` after dependency or build-related changes.
7. If the preview looks broken, check that the global CSS file is still imported and that the
   app root layout is intact.

If you want to learn the app quickly, start at these entry points:

- `src/App.tsx` for the overall screen model
- `src/utils/musicTheory.ts` for note and guitar-string fundamentals
- `src/components/ChordWorkbench.tsx` for the chord studio
- `src/components/GuitarFretboard.tsx` for the fretboard press visualizer
- `src/components/ScaleExplorer.tsx` for scales and modes
- `src/components/PianoKeyboard.tsx` for the piano visualizer
- `src/components/IntervalExplorer.tsx` for interval lookup
- `src/components/RhythmMetronome.tsx` for tempo and beat visualization
- `src/components/GuitarTuner.tsx` for the microphone-based tuner
- `src/components/TheoryCheatSheet.tsx` for the beginner guide
