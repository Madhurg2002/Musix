# Musix — Reimagining Plan & Follow-ups

Status legend: `[x]` done and committed · `[ ]` planned · `[~]` in progress

**Progress:** Phase 1 (design language) and Phase 2 (shell) are implemented, verified,
and pushed. Phases 3–4 and the follow-up list below are open.

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

### Phase 3 — Screen-level craft

- [ ] Chord Studio: clearer card hierarchy, obvious add/compare affordances, better empty state.
- [ ] Fretboard + Piano: shared visual language, legible legend, consistent note badges.
- [ ] Tuner: warmer gauge, clearer in-tune state, calmer meter.
- [ ] Metronome: unify the pendulum and controls on one grid.
- [ ] Scales/Intervals: tighten the degree/card readouts.

**Verify:** each screen checked in the preview, then committed on its own.

### Phase 4 — Consistency, accessibility, and hardening

- [ ] Full pass for `:focus-visible`, keyboard reachability, and `aria-*` on toggles.
- [ ] Remove emoji-as-iconography in favour of a small, consistent inline icon set.
- [ ] Delete or reconcile dead code flagged in `docs/CAPABILITIES.md` (duplicate pitch
      detectors, overlapping helper aliases, stub `public/metronome.js`).
- [ ] Extend `bun test` coverage beyond `musicTheory.ts`.

**Verify:** `bun test` green, `bunx tsc -b --noEmit` green, preview pass on all tabs.

## Commit strategy

One commit per working change, pushed after verification:

1. Docs set + typecheck/test repair (previous change, already verified).
2. This plan.
3. Phase 1 theme.
4. Phase 2 shell.
5. …and so on, each verified with `bunx tsc -b --noEmit` + `bun test` before committing.

Files that are pure build artefacts (`tsconfig.tsbuildinfo`) are intentionally left
uncommitted to keep the history about source changes.

## Follow-ups

Ordered by value; none block the phases above.

- [ ] **Test the chord voicing logic.** `getChordPosition` (fret-window generation, finger
      numbering) and `handleTranspose` are untested.
- [ ] **Add a `test` script** to `package.json` so `bun test` is reachable via `bun run test`
      and CI can call it uniformly.
- [ ] **Add CI** running `bunx tsc -b --noEmit` and `bun test` on every push and pull request.
- [ ] **De-duplicate pitch detection.** Three near-identical autocorrelation implementations
      exist (`musicTheory.ts` and two in `GuitarTuner.tsx`); keep one.
- [ ] **Collapse helper aliases.** `noteNameAt` / `getNoteByCheckedIndex` / `noteNameFromIndex`
      and `stringInfoAt` / `getGuitarStringInfo` / `resolveGuitarString` are duplicates.
- [ ] **Fix the stale card comment** in `ChordWorkbench` that labels `COMPREHENSIVE_CHORDS[12]`
      as "B Minor" when it is D Major.
- [ ] **Persist learner state.** Remember the active key, instrument, scale, and chord cards
      across reloads (localStorage) so practice resumes where it left off.
- [ ] **Finish de-emoji-ing the screens.** The rail and top bar are text-only now, but the
      remaining tools still use emoji in headings and buttons.
- [ ] **Close the CSS/component class drift.** Around 30 classes used by components (e.g.
      `interval-header`, `dual-visualizers-grid`, `chord-card-body`, `strum-btn`) have no
      stylesheet rule at all, so those wrappers render unstyled.
- [ ] **Resolve `public/metronome.js`.** It is a comment-only stub; either implement it or
      remove it and the reference.
- [ ] **Reconcile `.gitignore`.** `public/data/*.json` and `scripts/build-pages.ts` are listed
      as ignored but are tracked in git.
- [ ] **Align `tsconfig.json` include** with the real config filename (`vite.config.js`, not
      `vite.config.ts`).
- [ ] **Accessibility audit.** Contrast check on the new palette, and keyboard flows for the
      chord card drag-and-drop (which currently has Alt+↑/↓ as the keyboard fallback).
- [ ] **Progressions.** Turn the "Play Progression" feature into a real chord-progression
      builder with named presets (I–V–vi–IV, ii–V–I, 12-bar blues).
