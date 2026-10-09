# Musix Documentation

Complete documentation for **Musix**, a browser-only interactive music theory reference.
This folder covers every part of the project: what it can do, how it is built, its data,
and how to work on it.

## Contents

| Doc | Read it for |
| --- | --- |
| [CAPABILITIES.md](./CAPABILITIES.md) | **Everything the app can do**, feature by feature, plus known gaps |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Runtime model, layers, state ownership, routing, audio and data flow |
| [COMPONENTS.md](./COMPONENTS.md) | Per-file reference: props, state, behavior for every component and module |
| [DATA-MODEL.md](./DATA-MODEL.md) | Shared types, TS data tables, and the bundled JSON schemas |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Setup, scripts, verification, conventions, and common traps |
| [MUSIC-THEORY.md](./MUSIC-THEORY.md) | The theory reference library and the theory the code implements |
| [BUGS.md](./BUGS.md) | The bug audit: every fault found, its impact, and whether it is fixed |
| [PLAN.md](./PLAN.md) | The reimagining plan, what has landed, and the follow-up backlog |

Related docs outside this folder:

- [`../README.md`](../README.md) — short project readme
- [`../README-docs.md`](../README-docs.md) — longer-form readme
- [`../AGENTS.md`](../AGENTS.md) — agent workflow notes
- [`../LICENSE`](../LICENSE) — MIT licence text
- [`../music-theory-reference/`](../music-theory-reference/) — hand-written theory notes

## What Musix is

A single static Vite + React + TypeScript site that teaches music theory through
interactive tools. A learner can follow a song from its chord chart, compare chords side by
side, see exact guitar finger positions, tune with microphone pitch detection, play a piano
or fretboard, explore scales and intervals, and practice with a visual metronome — with real
synthesized audio for all of it. There is no backend and no database.

Ten screens, each code-split behind a `React.lazy` route in `src/routes.tsx`, and four
selectable themes.

## Quick answers

**How do I run it?**

```bash
bun install
bun dev
```

Then open http://localhost:5173.

**How do I check a change?**

```bash
bunx tsc -b --noEmit   # type check (strict)
bun test               # unit tests (Bun's built-in runner)
bun build              # production build into dist/
```

**Where is the app's entry point?** `src/main.tsx` mounts `src/App.tsx`, which owns the
shared state and renders the active screen from the route table in `src/routes.tsx`. See
[ARCHITECTURE.md](./ARCHITECTURE.md).

**How do I add a screen?** Add one `RouteDefinition` to `ROUTES` in `src/routes.tsx` and
import the component lazily there. The rail, the top-bar title, the deep link, and the
Auto-mode instrument all follow from that entry, and `src/routes.test.ts` checks the table.

**Where do I add a chord, scale, or interval?** `src/data/chordsData.ts` and
`src/data/scalesData.ts`. If the bundled JSON should match, also update
`music-theory-reference/04-data/` and run `bun scripts/build-pages.ts`. See
[DATA-MODEL.md](./DATA-MODEL.md).

**How do I run the tests?** `bun test` runs the suite on Bun's built-in test runner (no
extra dependency): 66 tests covering the theory helpers (`src/utils/musicTheory.ts`), the
chord-chart parser (`src/utils/chordChart.ts`), the hash router (`src/utils/router.ts`), and
the route table (`src/routes.tsx`). See [DEVELOPMENT.md](./DEVELOPMENT.md#tests).

## Tech stack

| Concern | Choice |
| --- | --- |
| Build | Vite 8 |
| UI | React 19 + TypeScript (strict) |
| Styling | One global stylesheet, `src/style.css` (no Tailwind) |
| Routing | Hash-based, dependency-free (`src/routes.tsx` + `src/utils/router.ts`) |
| Audio | Web Audio API, synthesized in the browser |
| Data | Static TS modules + bundled JSON |
| Backend | None |
| Licence | MIT ([`LICENSE`](../LICENSE)) |
