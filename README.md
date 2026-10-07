# Musix — Music Theory, Compressed

A single-page interactive reference for new music learners. Every concept is visual
before it is verbal: point at a chord, a scale, or a beat and the app shows the exact
notes, fingerings, and timing before your hands do the work.

## What's inside

- **Start / Learn overview** — one-tap entry to every learning grid.
- **Pitch & frequencies** — chromatic staff, note names, and a frequency value you can
  step through and play.
- **Intervals** — all 12 interval names, quality, and semitone distance in a lookup table.
- **Scales & modes** — pick a root and a mode; every formula rebuilds the scale on
  screen, and the cards stay side by side for quick comparison.
- **Chords & comparison cards** — show two or three chord cards together, mute any
  layer, and read every note in the stack. Ideal for `C`, `G7`, and bass variants like
  `C/G`.
- **Guitar fretboard press visualizer** — pick a tuning and shape, then press the
  fretboard to see exactly which strings and frets to use. Supports standard tuning,
  alternate tunings, Caged, and 3NP shapes.
- **Rhythm studio** — a tap-tempo trigger, BPM slider, and a visual 16-beat clock so
  you can feel the pulse and watch the cells light up.

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

Outputs `dist/`. Preview with:

```bash
bun preview
```

## Project layout

```text
index.html                # Loads /src/main.tsx
package.json              # Vite + React only
vite.config.js            # React plugin, dev/preview ports
public/
  data/*.json             # Bundled reference data (pitch, intervals, scales, guitar map)
  favicon.svg             # App icon
src/
  main.tsx                # React entry
  App.tsx                 # Screen shell, nav, and all learning UI
  style.css               # Dark theme and component styles
scripts/
  build-pages.ts          # Data copy helper for the app (plain Node ESM)
```

## Reference data and docs

The hand-written theory notes live in `music-theory-reference/`. They are the structured
source for the app's formulas and mappings, and each file includes a short "why it
matters" line aimed at a new learner. `scripts/build-pages.ts` keeps the copied JSON in
`public/data/` in sync with `music-theory-reference/04-data/`.

```bash
node scripts/build-pages.ts
```

## Dev notes

- Framework: Vite + React (TypeScript), no Astro, no build-page generator in the app.
- Styling: one CSS file with a dark theme; no Tailwind or component CSS.
- Data: all theory data is static JSON and is served as a static asset.
