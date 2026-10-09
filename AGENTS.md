# Agent notes for Musix

## Project type

Browser-only Vite + React + TypeScript frontend. No backend. No Tailwind. One global CSS file.

## Quick setup

```bash
bun install
bun dev
```

Open http://localhost:5173.

## Where to look first

- App shell and routing: `src/App.tsx`
- Shared types: `src/types.ts`
- Music fundamentals: `src/utils/musicTheory.ts`
- Sound engine: `src/utils/audio.ts`
- Chord data and helpers: `src/data/chordsData.ts`
- Scale data and intervals: `src/data/scalesData.ts`
- Main tab components: `src/components/*`
- Global theme: `src/style.css`

## Common traps for agents

- Do not edit `tsconfig.json`, `vite.config.js`, `package.json`, or `.env.example` unless the
  task explicitly requires it.
- Do not introduce another React build setup, Tailwind, or another bundler.
- Do not change the global CSS imports or the app root styling unless you are deliberately
  changing the theme. A blank or unstyled preview usually means a global import or root layout
  piece was removed.
- Keep component props and data shapes stable when editing a single feature. The app uses
  shared types, so a change in one data file often affects multiple tabs.
- If you add new theory data, keep it in the same shape the app already expects. When in doubt,
  follow the existing pattern in `src/data/chordsData.ts` or `src/data/scalesData.ts` instead of
  inventing a new one.
- If you change data files under `music-theory-reference/` or `src/data/`, remember the app
  reads both the TS data and the public JSON copy. Update both if the feature depends on it.

## Build and check

```bash
bun build
```

For a type check after changes, run:

```bash
bunx tsc -b --noEmit
bun test
```

If you changed dependencies, run `bun install` first.

There is no `test` script; run the unit suite directly with `bun test` (Bun's built-in
runner). It covers the helpers in `src/utils/musicTheory.ts`. Component, audio, and tuner
behavior are not covered yet, so verify those in the preview.

## Docs

- Docs index: `docs/README.md`
- Capabilities (every feature + known gaps): `docs/CAPABILITIES.md`
- Architecture: `docs/ARCHITECTURE.md`
- Component reference: `docs/COMPONENTS.md`
- Data model: `docs/DATA-MODEL.md`
- Development guide: `docs/DEVELOPMENT.md`
- Theory reference map: `docs/MUSIC-THEORY.md`
- Short readme: `README.md`
- Longer docs: `README-docs.md`
- Source theory notes: `music-theory-reference/`
- Bundled public data: `public/data/`
- Data copy helper: `scripts/build-pages.ts`

When you add or rename a feature, update the matching doc so `docs/` stays accurate.

## Good defaults

- Keep changes small and reversible.
- Prefer editing existing files over creating new top-level folders.
- When adding UI, follow the existing dark theme and component styling in `src/style.css`.
- When adding features, preserve the existing tab/routing structure in `src/App.tsx`.
