# Musix — Music Theory, Compressed

A browser-only interactive reference for new music learners. It pairs plain-language
explanations with visual, hands-on tools so a beginner can see *and* hear what a theory
concept looks like before they touch an instrument.

## What's inside

- **Pitch & frequencies** — note names, chromatic staff, and a frequency preview you can
  play with the mouse or keyboard.
- **Intervals** — all 12 interval names, quality, and semitone distance, with a quick lookup
  table.
- **Scales & modes** — build a scale from any root, compare scales side by side, and see the
  formula that generates each mode.
- **Chords** — pick a chord and see it next to the closest three fingerings for guitar. Cards
  can be shown together so you can compare a chord, a slash chord, and a bass-note variant.
- **Guitar fretboard** — press a chord shape and watch the exact frets and strings to press.
  Includes standard tuning, alternate tunings, and Caged/3NP shapes.
- **Rhythm studio** — tempo, accents, and a visual beat clock with metronome audio.
- **GuitarTuna-style tuner** — microphone-based pitch detection with a visual headstock and
  arc meter.

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

## Documentation

The full documentation set lives in [`docs/`](docs/README.md):

- [Capabilities](docs/CAPABILITIES.md) — every feature the app can do, plus known gaps.
- [Architecture](docs/ARCHITECTURE.md) — runtime model, state, routing, audio and data flow.
- [Components](docs/COMPONENTS.md) — per-file reference for components and modules.
- [Data model](docs/DATA-MODEL.md) — shared types, TS data tables, and bundled JSON schemas.
- [Development](docs/DEVELOPMENT.md) — setup, scripts, verification, conventions, traps.
- [Music theory map](docs/MUSIC-THEORY.md) — the reference library and the theory in code.

## Repo map

```text
index.html            # Loads /src/main.tsx
package.json          # Vite + React only
vite.config.js        # React plugin, dev/preview ports
public/
  data/               # Bundled reference data (intervals, scales, chords, guitar maps)
  favicon.svg         # App icon
src/
  main.tsx            # React entry
  App.tsx             # Screen shell, nav, and tab routing
  style.css           # Dark theme and component styles
  types.ts            # Shared types
  components/
    Header.tsx        # Top nav and sound selector
    ChordWorkbench.tsx
    GuitarFretboard.tsx
    GuitarTuner.tsx
    PianoKeyboard.tsx
    ScaleExplorer.tsx
    IntervalExplorer.tsx
    RhythmMetronome.tsx
    TheoryCheatSheet.tsx
  data/
    chordsData.ts     # Chord definitions + helpers
    scalesData.ts     # Scale definitions + intervals
  utils/
    audio.ts          # Web Audio sound engine
    musicTheory.ts    # Note names, guitar strings, helper lookups
scripts/
  build-pages.ts      # Data copy helper for the app (plain Node ESM)
music-theory-reference/
  01-foundations/           # Pitch, intervals, scale formulas, chords, rhythm
  02-harmony-and-analysis/  # Circle of fifths, diatonic harmony, voice leading, roman numerals
  03-instrument-mappings/   # Guitar fretboard, CAGED, 3NPS, tunings, triads
  04-data/                  # Structured source for the bundled JSON in public/data/
  templates/                # Authoring template for new instrument mappings
docs/                       # Full documentation set (see docs/README.md)
README-docs.md              # Longer-form documentation for the same content
```

## Data flow

The app is entirely static. Theory content is authored in `music-theory-reference/` and
copied into `public/data/` by `scripts/build-pages.ts`. The frontend reads the copied JSON
and the local TS data files and renders the pages directly.

If you want to add a new scale, chord, or interval, add the source to the matching
`music-theory-reference/` folder or to the relevant TS data file, then run the data script or
the app's build command so the public copy stays in sync.

## Agent / AI workflow notes

This repo is a simple Vite + React + TypeScript frontend. If you are editing it with an agent,
use these paths first when reading or changing code:

- App routing and shell: `src/App.tsx`
- Shared types: `src/types.ts`
- Music fundamentals: `src/utils/musicTheory.ts`
- Sound engine: `src/utils/audio.ts`
- Chord data and helpers: `src/data/chordsData.ts`
- Scale data and intervals: `src/data/scalesData.ts`
- Main tab components: `src/components/*`

When touching data files, keep the shape used by each component stable. When touching the UI,
preserve the global CSS imports and the existing theme tokens in `src/style.css`; broken or
unstyled previews usually mean the root layout, the global stylesheet import, or a layout
class in `src/App.tsx` was accidentally changed.

To check a change, prefer:

- `bun install` if dependencies changed
- `bunx tsc -b --noEmit` for the strict type check
- `bun test` for the theory helper unit tests
- `bun dev` to confirm the app still boots, plus a visual check of each tab after layout or
  theme changes

## Dev notes

- Framework: Vite + React + TypeScript, no Tailwind, no backend.
- Styling: single `src/style.css` with a dark theme.
- This repository is a standalone site. It does not include a backend, so all data is static
  JSON and TypeScript source.

## Contributing

If you add content:

- Keep computed helpers close to the data they protect.
- Keep the app's visual flow consistent when adding new tabs.
- Update the README or docs if the feature changes how a learner uses the app.

## License

MIT
