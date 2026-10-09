# Development Guide

Setup, scripts, verification steps, conventions, and the traps that most often break this
project.

## Requirements

- [Bun](https://bun.sh) (used for install and scripts) — `npm`/`pnpm` also work but Bun is
  what the repo and `AGENTS.md` assume.
- A modern browser with the Web Audio API and `getUserMedia` (for the tuner).

## Setup

```bash
bun install
bun dev
```

Open http://localhost:5173.

## Scripts

| Command | What it does |
| --- | --- |
| `bun dev` | Vite dev server on port **5173**, host `0.0.0.0`, `strictPort` |
| `bun build` | Production build into `dist/` |
| `bun preview` | Serves the build on port **4173**, host `0.0.0.0` |
| `bun test` | Runs the unit tests on Bun's built-in test runner |
| `bun scripts/build-pages.ts` | Copies `music-theory-reference/04-data/*.json` → `public/data/` |

There is no `test` script in `package.json`; run `bun test` directly (see "Tests").

## Verification

Type check (strict; `noUncheckedIndexedAccess` is on):

```bash
bunx tsc -b --noEmit
```

Unit tests:

```bash
bun test
```

Production build:

```bash
bun build
```

Manual checks worth doing after UI changes:

1. Load each tab and confirm the preview is styled (a blank page usually means the global
   stylesheet import or the root layout class was changed).
2. Play a note on an instrument in **Auto** mode, then lock a specific instrument and
   confirm it follows across tabs.
3. Confirm the sticky "Locked:" chip matches the actual sound.
4. Change the hero key chip and confirm the scales, fretboard, and piano update.
5. Open a chord in the studio → **Open Fretboard**, and confirm the neck shows that chord.
6. Start the metronome and confirm beats, accents, and the pendulum move together.

## Tests

The suite runs on **Bun's built-in test runner**, so no test dependency is needed:

```bash
bun test
```

`src/utils/musicTheory.test.ts` covers the note tables, aliases, semitone normalization,
fret resolution, transposition, MIDI→frequency math, and the safe lookup helpers in
`src/utils/musicTheory.ts` (24 tests, all passing).

- The globals `describe`, `test`, and `expect` are typed by `src/test-globals.d.ts`, so the
  suite passes the strict type check without pulling in the full Bun typings.
- Component, audio, and tuner behavior are **not** covered by tests yet; verify those in
  the preview.
- Keep `bun test` and `bunx tsc -b --noEmit` green together; both are real gates.

## Project conventions

- **Static, browser-only.** No backend, no API layer, no data fetching at runtime.
- **Vite + React 19 + TypeScript** only. Do not add another bundler, build setup, or a
  second React copy.
- **No Tailwind, no CSS-in-JS.** One global stylesheet, `src/style.css`, with plain class
  names and a dark glass-card theme.
- **Shared types are load-bearing.** `src/types.ts` is used across tabs, so changing a data
  shape touches several components. Prefer additive changes.
- **Theory helpers live in `src/utils/musicTheory.ts`.** Put note/fret/math helpers there
  instead of duplicating them inside a component.
- **New theory data follows the existing shape.** Copy the pattern in
  `src/data/chordsData.ts` or `src/data/scalesData.ts` rather than inventing a new one.
- **Data exists twice.** The TS data files feed the app; `public/data/*.json` is the
  bundled copy. If a feature depends on the JSON, update both (and the reference source
  under `music-theory-reference/04-data/`).
- **Audio goes through the singleton.** Call `soundEngine` rather than building an audio
  graph in a component (the tuner's input analyser is the deliberate exception).
- **Keep changes small and reversible.** Prefer editing existing files over adding new
  top-level folders.

## Common traps

- **Blank or unstyled preview** → check that `src/main.tsx` still imports `./style.css`,
  that `index.html` still links the stylesheet, and that the `musix-app-root` /
  `main-content-container` layout classes are intact.
- **New tab renders nothing** → the id must be in `VALID_TABS`; otherwise the hash
  normalizes back to `workbench`.
- **Sound stops working after an edit** → remember instrument resolution: a header lock
  (`userOverride !== 'auto'`) overrides the per-call `overrideInstrument`, so a locked
  instrument can make a component's intended voice appear ignored.
- **Hash routing quirks** → changing `activeTab` state without writing the hash desyncs
  the URL; always navigate through `setActiveTab`.
- **Strict-null errors** → `noUncheckedIndexedAccess` makes `array[i]` possibly
  `undefined`. Use the safe helpers (`asSafeChord`, `getNoteByCheckedIndex`,
  `resolveGuitarString`) instead of `!` where practical.
- **`tsconfig.json` includes `vite.config.ts`** while the real file is `vite.config.js` —
  harmless today, but do not "fix" it by renaming files unless that is the task.

## Adding things

**A new screen**

1. Add the id to `VALID_TABS` and `TAB_DEFAULT_INSTRUMENT` in `src/App.tsx`.
2. Add a nav button in `src/components/Header.tsx`.
3. Create `src/components/YourScreen.tsx` and render it inside a
   `<section className="tab-section">` in `App.tsx`.
4. Style it in `src/style.css` using the existing `glass-card` pattern.

**A new chord / scale / interval**

1. Add the entry to `src/data/chordsData.ts` or `src/data/scalesData.ts` in the existing
   shape.
2. If the bundled JSON should match, update `music-theory-reference/04-data/` and run
   `bun scripts/build-pages.ts`.
3. Run `bunx tsc -b --noEmit`.

**A new instrument**

1. Add the literal to `InstrumentType` in `src/utils/audio.ts`.
2. Add a synthesis `case` in `playNote`.
3. Add an option (and label) in `src/components/Header.tsx`.

## Repository map

```text
index.html                 Document shell + font/stylesheet links
package.json               Vite + React only
vite.config.js             React plugin; dev 5173, preview 4173, host 0.0.0.0
tsconfig.json              Strict TS, noUncheckedIndexedAccess, noEmit
public/
  data/*.json              Bundled theory data
  favicon.svg              App icon
  metronome.js             Documentation-only stub
src/
  main.tsx                 React entry
  App.tsx                  Shell, tab routing, shared state
  style.css                The only stylesheet
  types.ts                 Shared types
  env.d.ts                 ImportMetaEnv declarations
  components/*.tsx         One tool per file
  data/*.ts                Chords, scales, intervals
  utils/audio.ts           Web Audio synthesis
  utils/musicTheory.ts     Theory math + pitch detection
  utils/musicTheory.test.ts  Bun test suite for the theory helpers
  test-globals.d.ts        Ambient typings for Bun's test globals
scripts/build-pages.ts     Copies reference JSON into public/data/
music-theory-reference/    Hand-written theory source (see docs/MUSIC-THEORY.md)
docs/                      This documentation set
```
