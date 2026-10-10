# Musix — Reimagining Plan & Follow-ups

Status legend: `[x]` done and committed · `[ ]` planned · `[~]` in progress

## Documentation sync policy

Do **not** rewrite every doc on every change. The rule from here on:

- `docs/PLAN.md` (this file) is the only doc updated on every run.
- The rest are refreshed in batches, and the batch is recorded below.
- Anything a reader of the other docs would get *wrong* is listed under "Deferred doc
  edits" so it can be swept up in the next batch rather than forgotten.

| Batch | Commits | Docs refreshed |
| --- | --- | --- |
| 1 | `6073dfb` | `CAPABILITIES.md`, `COMPONENTS.md` (Song Follower) |
| 2 | `f919b4f`, `84ca95f` | `ARCHITECTURE.md`, `COMPONENTS.md`, `DEVELOPMENT.md`, `BUGS.md`, `README.md`, `README-docs.md`, docs index |
| 3 | `938fd47`, `c5ce232`, `07483ff`, `975ae19` | **this file only** |
| 4 | `93d7acc`, `42398c9`, `de04710`, `22954b4`, `d6dcf4a` | `CAPABILITIES.md` (tooltips), `CONTRIBUTING.md` (new), this file |
| 5 | `bebfafe`, `5decd5d`, `9e45dc2`, `cc5ef5a` | this file only (Tailwind migration starts) |

### Deferred doc edits (sweep up in the next batch)

`docs/CAPABILITIES.md`, `docs/COMPONENTS.md`, and `docs/DEVELOPMENT.md` do not yet mention:

- `bun run typecheck` / `bun run test` scripts and the pinned `typescript` devDependency.
- The CI workflow at `.github/workflows/ci.yml`.
- `src/utils/preferences.ts` and the fact that the key, instrument, visualizer, scale, and
  song now persist.
- `public/metronome.js` being gone, the helper aliases being collapsed into `noteNameAt` /
  `stringInfoAt`, and `detectPitch` now living only in `musicTheory.ts`.
- `src/utils/preferences.test.ts` and `src/utils/chordVoicing.test.ts` (test counts are now
  148 across 10 files).
- The live note finder (`src/utils/useLivePitch.ts`, `fretPositionsForMidi`), the Song
  Follower's print stylesheet and button, the final de-emoji pass, and the closed
  class-drift item.
- `src/utils/chordVoicing.ts` — the chord studio's voicing maths moved out of the component,
  and `findChord` was added to `chordsData.ts`.

`docs/BUGS.md` has the statuses updated in the same sweep.

Batch 4 (this run) still owes the other docs:

- The preference-cookie permission flow (`src/utils/consent.ts`, `src/utils/cookies.ts`,
  `src/components/CookieConsent.tsx`, and the `title`/`data-tip` convention).
- The stylesheet truncation regression, its guard (`src/style.test.ts`), and the test count
  (114 across 8 files).
- The issue forms, pull request template, and `CONTRIBUTING.md`.
- The footer no longer links `robots.txt`, and `/LICENSE` is served from `public/LICENSE`.

**Progress:** Phase 1 (design language), Phase 2 (shell), the user-selectable theme system,
the repository bug audit (`docs/BUGS.md`), the mobile audio fixes, the Song Follower, the
route table with lazy loading, the licence/contact work, the CI gate, the dead-code cleanup
(Phase 4), preference persistence, and Phase 3 (screen-level craft plus the tooltip layer)
are implemented, verified, and committed.

One incident and its fix belong in the record: commit `5846cf8` replaced `src/style.css`
with the Phase 3 fragment instead of appending to it, silently dropping 2,750 lines (type
check and tests stayed green because nothing read the stylesheet). `93d7acc` restored it,
and `42398c9` added `src/style.test.ts`, which fails the build if the sheet is ever
truncated again.

## The reimagining in one line

Turn Musix from a **neon cyber dashboard** (glassmorphism, cyan/purple glows, 8 tabs crammed
into a top bar) into a **warm analog studio**: an instrument-craft visual language, a
navigation rail that gives the tools room, and a learning flow a beginner can follow.

## Why change it

The current build works, but it reads as generic:

1. **Generic palette.** Cyan + purple on near-black is the default "tech product" look and
   says nothing about music or instruments.
2. **Crowded navigation.** Eight labelled tabs plus a sound selector and a visualizer toggle
   compete in one horizontal strip that wraps on smaller screens.
3. **Flat hierarchy.** The hero, the tools, and the chrome all sit at similar visual weight,
   so there is no obvious "start here".
4. **Emoji as iconography.** Emoji are inconsistent across platforms and undermine the
   craft feel.
5. **Inconsistent accents.** Component-level hardcoded colors (metronome cyan, tuner green,
   `#00a8ff` gradients) drift from the token palette.

## Design direction: "Analog Studio"

A warm, tactile identity drawn from instruments and studio hardware.

| Token | Old | New | Role |
| --- | --- | --- | --- |
| canvas | `#0a0d14` | `#0f0c0a` | Page background (deep espresso) |
| surface | `#121824` | `#171310` | Raised panels |
| card | `rgba(20,28,44,.7)` | `rgba(28,22,18,.78)` | Glass panels |
| border | `rgba(255,255,255,.1)` | `rgba(232,200,150,.14)` | Warm hairline |
| accent primary | `#00f0ff` | `#e0a458` | Brass / amber |
| accent secondary | `#9d4edd` | `#b8672f` | Copper |
| accent tertiary | `#ff2a85` | `#c9552f` | Terracotta |
| accent highlight | `#ffb703` | `#e8c07d` | Pale brass |
| success | `#00f5d4` | `#86b06b` | Sage / olive |
| alert | `#ff4d4d` | `#e06c5a` | Warm red |
| text primary | `#f8fafc` | `#f6efe4` | Cream |
| text secondary | `#94a3b8` | `#b8a894` | Warm gray |
| text muted | `#64748b` | `#8c7d6c` | Muted warm gray |

Rules that keep it coherent:

- **No neon glow.** Replace glow shadows with warm, low-opacity elevation.
- **Warm, low-saturation surfaces** with a paper-cream text ramp.
- **Brass is the single accent**; copper/terracotta are supporting, sage means "in tune".
- **Note colors stay as-is.** `NOTE_COLORS` in `src/utils/musicTheory.ts` is asserted by the
  test suite (`#FF5733`, `#FF8D33`, `#E74C3C`), and it is functional data, not decoration.
- **Keep the static, browser-only architecture.** This is a redesign, not a rewrite.

## Phases

### Phase 1 — Design language (theme + tokens) — done

- [ ] Replace the `:root` token block with the Analog Studio palette and add tokens for
      radii, elevation, motion, and focus rings.
- [ ] Remap every hardcoded legacy accent in `src/style.css` (33 × `rgba(0,240,255,…)`,
      10 × `rgba(157,78,221,…)`, `#00a8ff`, `#00f5d4`, `#ffb703`, `#ff2a85`, …) to the new
      palette so no neon remains.
- [ ] Replace glow-based shadows with warm elevation; add visible `:focus-visible` rings.
- [ ] De-neon the inline component colors (metronome `#00f5d4`, tuner arc colors).

**Verify:** `bunx tsc -b --noEmit`, `bun test`, preview renders on every tab with no leftover
cyan/purple.

### Phase 2 — Shell reimagining (navigation + hero) — done

- [ ] Replace the crowded top tab bar with a **left navigation rail** (desktop) that collapses
      to an icon-free, horizontally scrollable bar on small screens.
- [ ] Add a **top bar** that owns the sound/instrument control and the visualizer toggle,
      freeing the nav.
- [ ] Redesign the hero: a real headline, one sentence of orientation, and a clear primary
      action, with the key selector as a secondary control.
- [ ] Give each screen a consistent header pattern (eyebrow, title, one-line purpose).

**Verify:** all 8 tabs reachable, hash routing and back/forward still work, instrument lock
still follows tabs, responsive at ≤720px.

### Cross-cutting — shipped alongside the phases

- [x] **Bug audit** (`docs/BUGS.md`) — systematic pass using the compiler's unused-code
      checks as a probe, plus manual review of logic, config, data, and accessibility.
- [x] **Mobile audio** — one-shot pointer/touch/key unlock plus a `visibilitychange` resume,
      so iOS no longer plays nothing after the tab is backgrounded.
- [x] **Instrument-specific sounds everywhere** — Auto mode no longer pins a concrete voice,
      so per-tool overrides win again (the piano keys on Scales used to play guitar).
- [x] **Selectable themes** — four palettes behind channel tokens, chosen in the rail and
      remembered across reloads.
- [x] **Song Follower** — paste a chord chart and follow it chord by chord, with tempo,
      beats-per-chord, transpose, and sound on/off. Parser is pure and unit tested.
- [x] **Route table + lazy loading** — one `ROUTES` entry per screen drives the rail, the
      title, the deep link, and the Auto-mode instrument; each screen is a separate chunk.
- [x] **Licence, robots, and contact** — MIT `LICENSE`, `public/robots.txt`, a Contact screen,
      and a footer that links to both.
- [x] **`.gitignore` reconciled** — the tracked-but-ignored paths were untracked or
      un-ignored, and the stale build cache was purged.
- [~] **Tailwind.** Previously declined ("if not using already"), then explicitly requested
  as a complete migration, so it is now work in progress rather than a no. The approach:
  Tailwind v4 through `@tailwindcss/vite` with **preflight off**, so the existing look does
  not change while markup moves over; design tokens stay in `:root` and are exposed to
  Tailwind as theme colours so the four themes keep working; screens migrate one commit at
  a time, and `src/style.test.ts` guards the stylesheet until each layer has moved.

  Done so far: setup (`5decd5d` — layer order declared so `utilities` beats `components`,
  whole sheet wrapped in `@layer components`, tints exposed as `--color-*`), footer
  (`9e45dc2`), top bar (`cc5ef5a`), the screen hero + key chips (`4e2f6f2`), and the
  navigation rail — so the whole shell is utilities now. Each area's rules are deleted from
  `src/style.css` when its markup moves, and the guard test marker is swapped to a rule that
  still exists.

  Remaining, in order: Chord Studio, Song Follower, Fretboard, Scales, Intervals, Tuner,
  Metronome, Piano, Guide, Contact — and finally the leftovers utilities do not reach (SVG
  internals, fretboard grid, keyframes, print), which stay as CSS.

### Phase 3 — Screen-level craft

- [ ] Chord Studio: clearer card hierarchy, obvious add/compare affordances, better empty state.
- [ ] Fretboard + Piano: shared visual language, legible legend, consistent note badges.
- [ ] Tuner: warmer gauge, clearer in-tune state, calmer meter.
- [ ] Metronome: unify the pendulum and controls on one grid.
- [ ] Scales/Intervals: tighten the degree/card readouts.

**Verify:** each screen checked in the preview, then committed on its own.

### Phase 4 — Consistency, accessibility, and hardening — partly done

- [~] Full pass for `:focus-visible`, keyboard reachability, and `aria-*` on toggles.
      (Focus rings and `aria-pressed` on the toggles are in; the emoji sweep below is not.)
- [ ] Remove emoji-as-iconography in favour of a small, consistent inline icon set.
- [x] Delete or reconcile dead code: the three duplicate pitch detectors collapsed into one
      exported `detectPitch`, the overlapping helper aliases collapsed into `noteNameAt` /
      `stringInfoAt`, and the comment-only `public/metronome.js` stub deleted.
- [x] Extend `bun test` coverage: 82 tests across 5 files (theory, chart parser, router,
      route table, preferences), including synthetic-sine coverage for the pitch detector.
- [x] Add a `test` script and a CI gate (`.github/workflows/ci.yml`) so both checks run on
      every push and pull request.

**Verify:** `bun test` green, `bun run typecheck` green, preview boots on every screen.

## Commit strategy

One commit per working change, pushed after verification:

1. Docs set + typecheck/test repair.
2. This plan.
3. Phase 1 theme.
4. Phase 2 shell.
5. Bug audit fixes and `.gitignore` reconciliation.
6. Selectable themes.
7. Mobile audio and the per-tool instrument fix.
8. Song Follower (parser + screen + tests).
9. Song Follower docs.
10. MIT licence and robots policy.
11. Route table, lazy loading, Contact screen, and footer.
12. The docs this invalidated.

Each was verified with `bunx tsc -b --noEmit` and `bun test` (and a preview check) before
being committed.

Files that are pure build artefacts (`tsconfig.tsbuildinfo`) are intentionally left
uncommitted to keep the history about source changes.

## Follow-ups

Ordered by value; none block the phases above.

- [x] **Test the chord voicing logic** — `chordVoicing.ts` holds `getChordPosition`,
      `fretWindow`, and `transposeChordShape` with 18 tests. Writing those tests surfaced and
      fixed T3 (a transposed card drew and played its original shape), which is exactly the
      failure the plan predicted the tests would catch.
- [x] **Add a `test` script** — `bun run test` and `bun run typecheck`, with `typescript`
      pinned as a devDependency (it was previously downloaded on demand by `bunx`).
- [x] **Add CI** running the type check and the tests on every push and pull request.
- [x] **De-duplicate pitch detection** — one exported `detectPitch` in `musicTheory.ts`, the
      tuner imports it, and the synthetic-sine tests cover it.
- [x] **Collapse helper aliases** — `noteNameAt` and `stringInfoAt` are the only survivors.
- [x] **Fix the stale card comment** — the studio now resolves its starting cards by name
      (`findOrCreateChord('B', 'Minor')`) instead of by array index, so the copy and the data
      cannot drift again.
- [x] **Persist learner state.** `src/utils/preferences.ts` remembers the key, instrument,
      visualizer, scale, and the Song Follower's chart, tempo, beats-per-chord, transpose,
      and sound setting. Remaining: the chord-studio cards themselves.
- [x] **Finish de-emoji-ing the screens.** The rail and top bar went text-only first; this
      run replaced the last emoji — the guide's 📚🎸🎹🎼 glyphs, the piano heading, and the
      consent bar's ✓ — with `Icon` glyphs. Musical notation (♯ ♭ ♪ ✕) stays as text by
      design (`src/components/Icon.tsx`).
- [x] **Close the CSS/component class drift.** Verified closed: the named examples are gone
      from the markup or keep a rule (`dual-visualizers-grid`), and a scan of every
      `className` token — including classes inside template ternaries — finds no styled
      class without a rule. The bare identifiers without one are element `id`s
      (`bpm-slider`, `tap-tempo-btn`, `song-chart-input`), which never had styling.
- [x] **Live note finder on the fretboard.** The screen listens through the mic
      (`src/utils/useLivePitch.ts` on top of the shared `detectPitch`), names the note with
      octave and cents, and lights up every (string, fret) that sounds it via the tested
      `fretPositionsForMidi` — the inverse of `getFretMidi` — plus an open-string ring at
      the nut. One detector still serves both the tuner and this screen.
- [x] **Resolve `public/metronome.js`** — deleted; the real metronome is the React
      component.
- [x] **Reconcile `.gitignore`** — the tracked-but-ignored paths were reconciled and the
      stale `tsconfig.tsbuildinfo` was purged.
- [x] **Align `tsconfig.json` include** with the real config filename.
- [~] **Migrate to Tailwind.** Set up Tailwind v4 (preflight off) and move the markup off
  hand-written classes screen by screen, keeping `src/style.css` for tokens, keyframes,
  and the pieces utilities do not reach (SVG, fretboard grid, print). Each screen is its own
  commit; the guard test keeps the sheet honest until the last layer moves.
- [x] **Preference-cookie permission.** First-visit bar, writes held until allowed, refusal
  clears everything, and `Cookie settings` in the footer reopens the choice. Cookies are
  first-party, one per preference, with local-storage overflow for pasted charts.
- [x] **Issue forms, PR template, `CONTRIBUTING.md`** — `.github/ISSUE_TEMPLATE/` (bug and
  feature forms, blank issues off) plus `.github/PULL_REQUEST_TEMPLATE.md`.
- [x] **Guard the stylesheet.** `src/style.test.ts` fails if `src/style.css` is truncated,
  loses a layer marker, or ends up with unbalanced braces.- [x] **Decide on `package-lock.json`.** Decided: the project installs with bun, so a
  stale npm lock next to `bun.lock` is drift. Deleted in its own commit and gitignored so
  an accidental `npm install` cannot bring it back.
- [ ] **Accessibility audit.** Contrast check on the new palette, and keyboard flows for the
      chord card drag-and-drop (which currently has Alt+↑/↓ as the keyboard fallback).
- [ ] **Progressions.** Turn the "Play Progression" feature into a real chord-progression
      builder with named presets (I–V–vi–IV, ii–V–I, 12-bar blues).
- [x] **Save a followed song.** The pasted chart and its practice settings persist; a
      shareable link (encoding the chart in the URL) is still open.
- [x] **Render a PDF/page export of the follower.** A `Print chart` button calls
      `window.print()`; `@media print` in `src/style.css` re-themes `.print-sheet` for paper
      (near-black ink, no dark chrome, it runs past the scroll box and keeps each line
      whole) and every piece of shell chrome hides with `print:hidden`.- [x] **Serve `LICENSE` from the built site.** `public/LICENSE` ships with the build, the
  footer links to `/LICENSE`, and `/robots.txt` stays published but is no longer linked from
  the footer — a crawler policy is not a button a learner needs.
