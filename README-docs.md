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
- **Song Follower** — paste a chord chart and step through it: the current chord is
  highlighted, sounded with the instrument you chose, and transposable into another key.
- **Rhythm studio** — tempo, accents, and a visual beat clock with metronome audio.
- **Tuner** — microphone-based pitch detection with a visual headstock and arc meter.
- **Four themes** — Analog Studio, Nocturne, Sheet Paper, and Arcade, chosen in the rail.
- **Contact** — the footer and the `#contact` screen link to the project on GitHub.

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
LICENSE                   # MIT licence
public/
  data/                   # Bundled reference data (intervals, scales, chords, guitar maps)
  favicon.svg             # App icon
  robots.txt              # Crawling policy
src/
  main.tsx                # Vite React entry
  App.tsx                 # Screen shell and shared state
  routes.tsx              # Route table: ids, titles, rail groups, lazy screens
  style.css               # Theme tokens and component styles
  types.ts                # Shared types
  components/
    Header.tsx
    ChordWorkbench.tsx
    TopBar.tsx
    Footer.tsx
    Contact.tsx
    SongFollower.tsx
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
    chordChart.ts
    links.ts
    musicTheory.ts
    router.ts
    theme.ts
scripts/
  build-pages.ts          # Data copy helper for the app (plain Node ESM)
music-theory-reference/
  01-foundations/           # Pitch, intervals, scales, chords, rhythm
  02-harmony-and-analysis/  # Circle of fifths, diatonic harmony, voice leading, roman numerals
  03-instrument-mappings/   # Guitar fretboard, CAGED, 3NPS, tunings, triads
  04-data/                  # Structured source for the bundled JSON in public/data/
  templates/                # Authoring template for new instrument mappings
docs/                       # Full documentation set
docs/CAPABILITIES.md        # Everything the app can do
README-docs.md            # This file
README.md                 # Short readme
AGENTS.md                 # Agent workflow notes
```

## Full documentation set

Start at [`docs/README.md`](docs/README.md). It indexes:

- [`docs/CAPABILITIES.md`](docs/CAPABILITIES.md) — feature-by-feature capabilities and
  known gaps.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — runtime model, state, routing, audio
  and data flow.
- [`docs/COMPONENTS.md`](docs/COMPONENTS.md) — per-module reference.
- [`docs/DATA-MODEL.md`](docs/DATA-MODEL.md) — types and data schemas.
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) — setup, scripts, conventions, traps.
- [`docs/MUSIC-THEORY.md`](docs/MUSIC-THEORY.md) — theory reference map.
- [`docs/BUGS.md`](docs/BUGS.md) — bug audit with status per finding.
- [`docs/PLAN.md`](docs/PLAN.md) — reimagining plan and follow-up backlog.

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

1. Read `src/routes.tsx` first: adding a screen is one entry there plus a lazily imported
   component, and the rail, title, deep link, and instrument all follow from it.
2. Read `src/App.tsx` if the change touches shared state or the shell layout.
3. Read `src/types.ts` before changing shared data shapes.
4. Read the relevant component before editing it; the app reuses props and helpers across screens.
5. Keep the same shape for new theory data as the existing data files.
6. Run `bunx tsc -b --noEmit` and `bun test` after changes.
7. Run `bun dev` after dependency or build-related changes.
8. If the preview looks broken, check that the global CSS file is still imported and that the
   app root layout is intact.

If you want to learn the app quickly, start at these entry points:

- `src/routes.tsx` for the screen table, then `src/App.tsx` for the shared state
- `src/utils/router.ts` for how the URL fragment maps to a screen
- `src/components/SongFollower.tsx` and `src/utils/chordChart.ts` for the song follower
- `src/utils/musicTheory.ts` for note and guitar-string fundamentals
- `src/components/ChordWorkbench.tsx` for the chord studio
- `src/components/GuitarFretboard.tsx` for the fretboard press visualizer
- `src/components/ScaleExplorer.tsx` for scales and modes
- `src/components/PianoKeyboard.tsx` for the piano visualizer
- `src/components/IntervalExplorer.tsx` for interval lookup
- `src/components/RhythmMetronome.tsx` for tempo and beat visualization
- `src/components/GuitarTuner.tsx` for the microphone-based tuner
- `src/components/TheoryCheatSheet.tsx` for the beginner guide
