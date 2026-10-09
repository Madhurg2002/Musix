# Contributing to Musix

Thanks for helping — Musix is a small, browser-only study app and most changes land in a
single sitting.

## Set it up

```bash
bun install
bun dev
```

Open http://localhost:5173. There is no backend: everything runs in the browser.

## Before you push

CI (`.github/workflows/ci.yml`) runs both of these on every push and pull request:

```bash
bun run typecheck   # tsc -b --noEmit
bun test            # Bun's built-in runner, no extra dependency
```

Tests live next to the code they cover as `*.test.ts`. Component and audio behaviour is
not covered by the suite, so also check anything visual in the preview.

## How work is organised

- `docs/PLAN.md` is the running plan: what shipped, what is open, and what the next run
  should pick up. Update it in the same commit as the work it describes.
- Other docs (`docs/CAPABILITIES.md`, `docs/COMPONENTS.md`, …) are refreshed in batches so
  a small change does not cascade into five rewrites. Anything a reader would get *wrong*
  goes under "Deferred doc edits" until that batch happens.
- Read `AGENTS.md` for the traps that bite people (data files are duplicated under
  `public/data/`, the global stylesheet is the app's styling, routes live in
  `src/routes.tsx`).

## Conventions worth knowing

- **Keep the app static.** No backend, no build step beyond Vite, no new bundler.
- **Routing** is one entry per screen in `src/routes.tsx`; the rail, the top bar title, the
  deep link, and the Auto-mode instrument all read from it.
- **Interactive controls carry a tooltip.** Use `data-tip="…"` on buttons, chips, and links
  (the bubble shows on hover and keyboard focus) and a native `title` on `<select>` and
  range inputs. Say what the control *does*, not what it is called.
- **Styling** flows from the design tokens in `:root` of `src/style.css`; themes restate the
  palette in `html[data-theme=…]` blocks. Prefer tokens over hard-coded colours so all four
  themes keep working.
- **Preferences** go through `src/utils/preferences.ts` (validation on read, consent gate on
  write) rather than touching storage directly.

## Reporting or proposing

Use the issue forms: **Bug report** for anything misbehaving, **Feature request** for new
tools or theory content. Both ask for the screen, the reproduction, and your browser — that
is the information that actually narrows a bug down.

## Licence

By contributing you agree your changes are released under the MIT licence that ships with
this repository.
