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

### Deferred doc edits (sweep up in the next batch)

`docs/CAPABILITIES.md`, `docs/COMPONENTS.md`, and `docs/DEVELOPMENT.md` do not yet mention:

- `bun run typecheck` / `bun run test` scripts and the pinned `typescript` devDependency.
- The CI workflow at `.github/workflows/ci.yml`.
- `src/utils/preferences.ts` and the fact that the key, instrument, visualizer, scale, and
  song now persist.
- `public/metronome.js` being gone, the helper aliases being collapsed into `noteNameAt` /
  `stringInfoAt`, and `detectPitch` now living only in `musicTheory.ts`.
- `src/utils/preferences.test.ts` and `src/utils/chordVoicing.test.ts` (test counts are now
  100 across 6 files).
- `src/utils/chordVoicing.ts` — the chord studio's voicing maths moved out of the component,
  and `findChord` was added to `chordsData.ts`.

`docs/BUGS.md` has the statuses updated in the same sweep.

**Progress:** Phase 1 (design language), Phase 2 (shell), the user-selectable theme system,
the repository bug audit (`docs/BUGS.md`), the mobile audio fixes, the Song Follower, the
route table with lazy loading, the licence/contact work, the CI gate, the dead-code cleanup
(Phase 4), and preference persistence are all implemented, verified, and pushed.
Phase 3 (screen-level craft) and the remaining follow-ups are still open.

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
- **Not done: Tailwind.** The request allowed it "if not using already", and this project
  explicitly does not use it. Adopting it would mean rewriting a 3,200-line hand-tuned
  stylesheet and the token system the four themes depend on. The tokens do the same job.

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
- [ ] **Finish de-emoji-ing the screens.** The rail and top bar are text-only now, but the
      remaining tools still use emoji in headings and buttons.
- [ ] **Close the CSS/component class drift.** Around 30 classes used by components (e.g.
      `interval-header`, `dual-visualizers-grid`, `chord-card-body`, `strum-btn`) have no
      stylesheet rule at all, so those wrappers render unstyled.
- [x] **Resolve `public/metronome.js`** — deleted; the real metronome is the React
      component.
- [x] **Reconcile `.gitignore`** — the tracked-but-ignored paths were reconciled and the
      stale `tsconfig.tsbuildinfo` was purged.
- [x] **Align `tsconfig.json` include** with the real config filename.
- [ ] **Decide on `package-lock.json`.** It is a stale npm lockfile sitting next to
      `bun.lock`; the project installs with bun, so the npm lock is likely drift. Not
      deleted yet because a decision on it belongs in a commit of its own.
- [ ] **Accessibility audit.** Contrast check on the new palette, and keyboard flows for the
      chord card drag-and-drop (which currently has Alt+↑/↓ as the keyboard fallback).
- [ ] **Progressions.** Turn the "Play Progression" feature into a real chord-progression
      builder with named presets (I–V–vi–IV, ii–V–I, 12-bar blues).
- [x] **Save a followed song.** The pasted chart and its practice settings persist; a
      shareable link (encoding the chart in the URL) is still open.
- [ ] **Render a PDF/page export of the follower.** Print stylesheet so a learner can take the
      graded chart away from the screen.
- [ ] **Serve `LICENSE` from the built site.** The footer links to GitHub's copy; a `public/`
      copy would also make `/LICENSE` reachable in production builds (dev already serves it).
