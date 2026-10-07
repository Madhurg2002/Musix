# Musix — Music Theory, Compressed

A browser-only interactive reference for new music learners. It pairs plain-language
explanations with visual, hands-on tools so a beginner can see *and* hear what a
theory concept looks like before they touch an instrument.

## What's inside

- **Pitch & frequencies** — note names, chromatic staff, and a frequency preview you can
  play with the mouse or keyboard.
- **Intervals** — all 12 interval names, quality, and semitone distance, with a quick
  lookup table.
- **Scales & modes** — build a scale from any root, compare scales side by side, and see
  the formula that generates each mode.
- **Chords** — pick a chord and see it next to the closest three fingerings for guitar.
  Cards can be shown together so you can compare a chord, a slash chord, and a
  bass-note variant.
- **Guitar fretboard** — press a chord shape and watch the exact frets and strings to
  press. Includes standard tuning, alternate tunings, and Caged/3NP shapes.
- **Rhythm studio** — tempo, accents, and a visual beat clock with metronome audio.

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
src/
  main.tsx      # Vite React entry
  App.tsx       # Screen shell and navigation
  style.css     # App theme
public/
  data/         # Bundled data JSON (intervals, scales, chords, guitar maps)
```

## Dev notes

- Framework: Vite + React + TypeScript.
- Styling: one CSS file with a dark theme.
- This repository is a standalone site. It does not include a backend, so all data is
  static JSON and Markdown.
