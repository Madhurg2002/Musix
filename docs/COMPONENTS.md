# Components & Modules

Reference for every source module: what it renders, its props, its local state, and the
behaviors it owns.

---

## `src/main.tsx`

Entry point. Mounts `<App />` (inside `StrictMode`) into `document.getElementById('app')`
and imports the global stylesheet.

## `index.html`

Document shell. Preconnects and loads the Google Fonts stylesheet (Outfit + Space
Grotesk), then `src/main.tsx` — which imports `src/style.css`, so the stylesheet ships
once. Contains the `#app` mount node.

---

## `src/routes.tsx`

The route table — the single source of truth for the app's screens.

| Export | Purpose |
| --- | --- |
| `ROUTES` | Non-empty tuple of `RouteDefinition`, in display order |
| `ROUTE_IDS` | The ids, derived from `ROUTES` |
| `DEFAULT_ROUTE_ID` | `'workbench'`, where an unknown hash lands |
| `routeFor(id)` | The matching route, or the default |
| `visualizerForRoute(id)` | `'guitar'` for `fretboard`, `'piano'` for `piano`, else `null` |
| `ScreenContext` | Shared state/callbacks handed to a route's `render` |
| `ScreenIntro` | `kicker?` / `headline` / `description` shown under the top bar |

A `RouteDefinition` holds `id`, `title`, `group` (`Practice` / `Fretboard` / `Harmony` /
`Learn` / `Project`), `label`, `instrument` (the Auto-mode voice), an `intro`
(`kicker` / `headline` / `description`, shown under the top bar; the kicker falls back
to the group), an optional `visibleFor` for the Piano/Fretboard pair, an optional
`railHidden`, and `render(context)`.

Every screen is imported with `React.lazy` at the top of the file via
`import('./components/X').then((m) => ({ default: m.X }))`, because the components use named
exports. **Adding a screen means one entry here plus a lazily imported component.**

The Fretboard route owns the chord-picker bar (it needs `COMPREHENSIVE_CHORDS` and
`context.setActiveChord`), which keeps screen-specific markup out of `App`.

`src/routes.test.ts` asserts the table's invariants so a bad entry fails the suite rather
than a screen.

---

## `src/utils/router.ts`

Hash routing, no React and no dependencies.

- `readHashRoute(validIds, fallback)` — strips `#`, tolerates a leading `/`, trims and
  lowercases, and returns the id only when it is in `validIds`.
- `writeHashRoute(id)` — sets the fragment, skipping the write when it is already current so
  history does not fill with duplicates.
- `subscribeToRoute(listener)` — listens to `hashchange` **and** `popstate`, returning the
  unsubscribe function.

Covered by `src/utils/router.test.ts` against a stubbed `window` (6 read cases, 3 write
cases, 2 subscription cases).

---

## `src/utils/links.ts`

The project's own addresses in one place so the footer, the Contact screen, and the readme
agree: `GITHUB_OWNER`, `GITHUB_PROFILE_URL`, `GITHUB_REPO_URL`, `GITHUB_ISSUES_URL`,
`GITHUB_NEW_ISSUE_URL`, `GITHUB_LICENSE_URL`, `GITHUB_ROBOTS_URL`, `GITHUB_SOURCE_URL`, plus
`LICENSE_NAME` and `LICENSE_YEAR`.

---

## `src/components/Footer.tsx` — `Footer`

Props: `onNavigate(routeId)`.

Renders the tagline, a link row (**Contact** as an in-app button, **GitHub**, the licence,
and `robots.txt`), and the legal line. The Contact entry is a button rather than an anchor
because it changes the route instead of leaving the page.

---

## `src/components/Contact.tsx` — `Contact`

Props: none.

Renders the contact lede, a card grid of GitHub destinations — **Open an issue** (marked
primary), existing issues, the profile, the source tree, and the repository — and two
sections: the MIT licence with a link to the full text, and a note that the Song Follower
works from pasted chart text rather than scraping tab sites. The markup is styled with
Tailwind utilities; the `.contact-*` block was deleted from `src/style.css` when it moved.

---

## `src/App.tsx` — `App`

Screen shell and the only owner of cross-screen state.

**State**

- `activeTab: string` — initialized from the URL hash via `readHashRoute`.
- `selectedRoot: NoteName` — default `'C'`.
- `activeChordForFretboard: ChordShape | null` — default `COMPREHENSIVE_CHORDS[0]`.
- `selectedVisualizer: 'piano' | 'guitar'`.
- `activeScaleNotes: NoteName[]`.
- `userOverride: InstrumentType | 'auto'`.

**Behavior**

- `setActiveTab` writes the hash; `subscribeToRoute` reads it back on `hashchange`/
  `popstate` and syncs the visualizer when the route implies one.
- The active screen is `routeFor(activeTab).render(screenContext)` inside a `<Suspense>` whose
  fallback is the `ScreenLoading` pulse.
- `screenContext` is memoized and carries the key, the active chord, the scale notes, the
  visualizer, and the navigation callbacks the screens need.
- An effect applies the screen's default instrument whenever the route changes and the user
  has not locked one.
- `handleVisualizerChange` swaps between the piano and fretboard tabs as the toggle moves.
- Composes the shell: `Header` (nav rail), then `.musix-main-column` holding `TopBar`, the
  the active route's screen intro, the active tab, and the footer. The intro copy comes
  from that route's `intro` field, so every screen orients the learner differently and
  the default route additionally shows the two shortcut buttons.

**Also exports:** `FretboardChordPicker` — the chord bar above the neck, grouped by root so
it reads chromatically (one row per root, quality-order buttons labelled with the quality
only, full names kept as accessible labels). Exported so it can be rendered on its own.

**Renders:** `Header` + `TopBar`, then exactly one of `GuitarTuner`, `ChordWorkbench`,
`GuitarFretboard`, `PianoKeyboard`, `ScaleExplorer`, `IntervalExplorer`,
`RhythmMetronome`, `TheoryCheatSheet`.

---

## `src/components/Header.tsx` — `Header`

The left navigation rail.

**Props**

| Prop | Type | Purpose |
| --- | --- | --- |
| `activeTab` | `string` | Highlights the current rail item |
| `setActiveTab` | `(tab: string) => void` | Navigation |
| `selectedVisualizer` | `'piano' \| 'guitar'` | Which visualizer is exposed |
| `setSelectedVisualizer` | `(v) => void` | Visualizer toggle |

**Behavior**

- Renders `nav.nav-rail`: the brand, then the rail built from `ROUTES`, grouped in
  `GROUP_ORDER` — Practice (Songs, Tuner, Rhythm), Fretboard (Fretboard, Scales, Intervals),
  Harmony (Chord Studio, Piano), Learn (Guide), Project (Contact).
- Filters out the `piano` or `fretboard` item unless the matching visualizer is selected
  (`route.visibleFor`), so only one of that pair is listed.
- Each item is a label-only button, `aria-current="page"` on
  the active entry, and a brass left rule while active.
- The footer holds the theme picker (a `SelectMenu` fed from `THEMES`) and the
  Piano/Guitar visualizer toggle as a `role="group"` of two `aria-pressed` buttons.
  Changing the theme writes `data-theme` on `<html>` and persists it through `applyTheme`.
- Below 900px the rail lays out horizontally and becomes a scrollable top strip.

---

## `src/components/SelectMenu.tsx` — `SelectMenu`

A themed stand-in for the native `<select>` popup.

**Props**

| Prop | Type | Purpose |
| --- | --- | --- |
| `value` | `string` | Selected option id |
| `options` | `readonly SelectMenuOption[]` | `{ id, label }` entries to show |
| `onChange` | `(id: string) => void` | Fires when an option is picked |
| `tip` | `string?` | `data-tip` bubble on the trigger |
| `className` | `string?` | Extra trigger classes (responsive sizing) |
| `ariaLabel` | `string?` | Accessible name when no label wraps the trigger |

**Behavior**

- The trigger reuses `.select-input`, so the closed control looks identical to the native
  select it replaces; a chevron rotates while open.
- The open menu is portalled to `document.body` (rail overflow can never clip it),
  positioned under the trigger — flipping above when there is no room below — and
  re-anchored on scroll/resize.
- Options render in the app's tokens: the selected row uses the shared brass gradient plus
  a check, the keyboard-active row an accent tint. Native option menus are OS chrome that
  author CSS cannot reach, which is why the old theme picker opened in system colours.
- `role="listbox"`/`role="option"` with `aria-activedescendant`; Enter/Space/ArrowDown
  open, arrows move, Home/End jump, Enter picks, Escape closes back to the trigger, and
  click or focus outside dismisses it.
- Used by the Header's theme picker; the other selects still use the native element.

---

## `src/components/TopBar.tsx` — `TopBar`

The control strip above the screen content.

**Props**

| Prop | Type | Purpose |
| --- | --- | --- |
| `activeTab` | `string` | Resolves the screen title via `routeFor(activeTab).title` |
| `userOverride` | `InstrumentType \| 'auto'` | Current instrument lock |
| `setUserOverride` | `(val) => void` | Changes the lock |
| `tabDefaultInstrument` | `InstrumentType` | Voice used while in Auto mode |

**Behavior**

- Shows an eyebrow plus the current screen name.
- Instrument `<select>` with Auto + six instruments. Any change locks the choice, applies
  it to `soundEngine`, and plays a C4 preview so the choice is audible.
- A live chip reads `Auto · <voice>` or `Locked · <voice>` using the effective instrument
  (`tabDefaultInstrument` while in Auto).
- On small screens it stops being sticky, because the rail already owns the top edge.

---

## `src/components/ChordWorkbench.tsx` — `ChordWorkbench` + `ProgressionChart` + `ProgressionPlaybackControls`

The side-by-side chord studio.

**`ChordWorkbench` props:** `onSelectChordForFretboard?(chord)`, `onOpenTuner?()`.

**Views:** `View: Cards · Chart`. The chart is `ProgressionChart` (also exported from this
file) — one `<ol>` row per card with the degree numeral from `romanNumeralFor`, the name,
note pills, `ChordFretGrid compact` (no slider) and a Play button, so a twelve-bar blues
reads on one screen.

**Card diagram:** each card renders `ChordFretGrid`, which reads the voicing from
`chordPositionForStrings`, the window from `fretWindow`, and the barre from `detectBarre`.
A barre is drawn as a single bar over the rows it covers, and the slider's source label says
**As written** only when `usedStoredShape` is true (otherwise **Open** / **Searched voicing**).

**Playback:** `ProgressionPlaybackControls` (exported from this file) owns the toolbar
controls. The run walks **one beat at a time** through a single tracked `setTimeout`: each
beat highlights and strums the current card, then schedules the next one
(`nextPlaybackBeat` returns `null` after the last beat, and the run ends there). Because
there is one pending timer instead of a queue, the run can be **paused** — the timer is
cancelled, the position is kept, and Resume replays the chord it stopped on. **Stop** ends
the run and goes back to the first chord. Muted cards are filtered out before the beat is
counted, so muting one closes the gap. A preset load, a card removal, or unmount stops the
run; the card being played is highlighted via `playingCardId`.

**Add Chord:** the toolbar's `Add Chord` button opens `AddChordDialog` (its own file) — a
portalled popup with a twelve-note root grid, four quality chips, and a live preview of the
chord (name, note pills, and the grip on the studio's instrument). The draft lives in the
popup, so Cancel leaves the board untouched; Add submits the form, closes, and returns
focus to the button.

**State**

- `cards: ChordCardItem[]` — default C Major, A Major and B Minor, resolved by name with
  `findOrCreateChord`, never by a data-file index.
- `addChordOpen`, `selectedRootToAdd`, `selectedTypeToAdd` — the popup's open flag and the
  last chord added, which the popup starts from next time.
- `playback: { index, paused } | null` — which audible beat is sounding, and whether the run
  is held. `null` means idle.
- `savedProgressions`, `activeSavedId`, `saveDialogOpen`, `confirmingDelete` — the learner's
  library, the entry the picker is showing, and the Save/Delete flow. `cards` and
  `progressionKey` start from `PREFERENCE_KEYS.studioBoard`, so the studio reopens on the
  board that was last on screen.
- `draggedCardId`, `dropTargetCardId` — drag-and-drop feedback.

**Handlers**

- `handleAddCard(root, quality)` → `findOrCreateChord(root, quality)`, then closes the popup.
  Refused at `MAX_SAVED_CARDS` (the button is disabled there), because the board is stored
  whole and clipping it on write would lose cards silently.
- `handleSaveProgression(name)`, `handleOpenSaved(id)`, `handleDeleteSaved()` — the library.
  Saving writes `savedProgressions`; opening rebuilds the cards from roots and qualities and
  restores the saved key; delete is two-step (armed for 5 s).
- `markEdited()` — clears `activeSavedId` and `activePresetId` on every hand edit, so the
  picker never claims the board is the saved set once it has changed.
- `handleStartProgression()`, `handleToggleProgressionPause()`, `stopPlayback()` — the run's
  start / pause / resume / stop.
- A `playback` effect plays the current beat and schedules the next one; it is keyed on
  `playback`, `cards` and the instrument, so a card that disappears under the run ends it.
- `handleRemoveCard`, `handleDuplicateCard` (uses `crypto.randomUUID()`).
- `handleMoveCard(id, ±1)` (keyboard) and `handleReorderCard(source, target)` (drag).
- `handleCardPositionChange(id, position)` — per-card fret position slider.
- `handleTranspose(id, ±1)` — delegates to `transposeChordShape`, which moves the drawn
  shape with the name (stored shape → movable shape shifted → searched voicing) and resets
  the card's fret position to 0 (**As written** when the table has the shape).
- `handlePlayChord(card)` — strums the card's voicing; falls back to a synthetic voicing
  if no frets are playable.

---

## `src/components/CookieConsent.tsx` — `CookieConsent`

The permission bar for preference storage.

**Props:** `forceOpen?` (the footer's "Cookie settings" button), `onClose?()`.

**Renders:** `.consent-bar`, a `role="dialog"` panel — a small translucent glass panel at
the bottom of the viewport (min(430px, viewport − 24px), `--radius-md`, a 0.55-alpha
`--bg-secondary-rgb` fill behind a 14px backdrop blur), not a full-width banner. It is a
permission nudge, so it stays out of the way of the screen behind it; the alpha is bounded
by the contrast audit in `src/style.test.ts`.

**Content:** the title, two sentences of copy, `Allow preferences` / `Not now`, and the
footnote pointing at the footer's settings entry. Every claim the app makes about what it
stores has to stay inside those two sentences, which is why the copy is what it is.

**Behaviour:** visible while no choice is stored, or whenever `forceOpen` is set. `Allow`
calls `grantConsent()` and releases the writes made while deciding; declining records the
refusal and calls `clearAllPreferences()` so nothing already stored is left behind.

---

## `src/components/Modal.tsx` — `Modal`

The popup shell both studio dialogs sit in: scrim, panel, dismissal rules, written once.

**Props:** `open`, `onClose()`, `labelledBy`, `widthClassName?`, `children`.

Portals into `document.body` so no card, sticky rail or `overflow: hidden` ancestor can clip
the panel. Escape and a press on the scrim itself close it (a drag that starts inside the
panel does not), page scroll is locked while open and restored on close, and focus moves
into the panel. The close handler is carried in a ref so the effect is keyed on `open`
alone — a re-render while the popup is up must not steal focus back.

---

## `src/components/SaveProgressionDialog.tsx` — `SaveProgressionDialog` + `SaveProgressionPanel`

Naming a progression so it can be reopened later.

**Props:** `open`, `initialName`, `cardCount`, `existingNames`, `onSave(name)`, `onClose()`.

The panel (split out for render checks) is a one-field form: the name, prefilled by
`suggestProgressionName` (`12-bar blues in C`, then `(2)` if that is taken, or
`My progression N`), capped at `MAX_PROGRESSION_NAME`, with a hint that says **Saving
replaces it** once the typed name matches an entry. A blank name cannot be submitted — a
nameless entry would be indistinguishable in the picker. The button reads **Save** or
**Replace** accordingly.

---

## `src/components/AddChordDialog.tsx` — `AddChordDialog` + `AddChordPanel`

The chord picker that used to be two `<select>`s and a button in the studio header.

**Props:** `open`, `initialRoot`, `initialQuality`, `instrument`, `onAdd(root, quality)`,
`onClose()`.

**`AddChordPanel`** is the body, split out so it can be rendered without a portal target
(the SSR render check asserts the root grid, the chips and the preview from it). It holds
no state: `root`/`quality` come in, changes go out. It shows **twelve root buttons**
(`aria-pressed` on the chosen one), the four `ADD_CHORD_QUALITIES` chips, and a preview of
`findOrCreateChord(root, quality)` — name, note pills, and `ChordFretGrid compact` or
`PianoKeyboard` for the studio's instrument, captioned **As written** or **Derived voicing**
so the popup cannot promise a stored grip the card will not draw.

**`AddChordDialog`** owns the draft and renders the panel inside `Modal`, which supplies the
portal, the scrim, Escape/scrim dismissal, the scroll lock and the focus move. The caller
returns focus to the trigger on close.

---

## `src/components/GuitarFretboard.tsx` — `GuitarFretboard`

Interactive fretboard with chord press visualization.

**Props**

| Prop | Type | Default |
| --- | --- | --- |
| `activeChord` | `ChordShape \| null` | — |
| `activeScaleNotes` | `NoteName[]` | `[]` |
| `rootNote` | `NoteName` | `'C'` |
| `fretsCount` | `number` | `12` |
| `activeChordId` | `string \| null` | `null` |

**State**

- `hoveredNote: { stringIdx, fret, note } | null` — drives the footer readout.
- `displayedChordId: string | null` — promotes the workbench's chosen chord once so the
  neck does not reset when the studio closes.

**Behavior**

- Renders strings reversed (High E on top) with thickness by string index.
- Per fret cell: `chord-press-active` (cyan, with `F:N` badge), `root-active`, or
  `scale-active`, each colored via `noteColorFor`.
- Nut indicators row shows Mute / Open / Fret + finger for the shown chord.
- `handleStrum` plays the whole chord (60 ms arpeggio); `handleNoteClick` plays one note.
- Footer shows note, string number + name, fret, and Hz on hover, or a hint otherwise.

**Fret markers:** 3, 5, 7, 9, 15 single dots; 12 double dot.

---

## `src/components/GuitarTuner.tsx` — `GuitarTuner`

Microphone tuner for guitar, bass, ukulele, violin, mandolin, banjo, and cello — plus
user-built custom tunings — with a visual headstock and an arc gauge. The component
owns the tuning UI, the controls row, and the custom-tuning editor; the microphone
itself is the shared `useLivePitch` hook (below), the meter maths is
`src/utils/tunerMeter.ts`, and the preset table lives in `src/utils/tunings.ts` (next),
so this screen and the other two mic paths cannot drift apart.

**Exports**

- `GuitarTuner` — the component.

**State**
- `presetIndex`, `mode` (`'auto' | 'manual' | 'chromatic'`), `selectedStringIndex`,
  `activePegIndex`, `confirmedTune` (dwell-gated in-tune), `a4` (415–466, default 440),
  `capo` (0–7), `customs` (saved `TuningPreset[]`), the editor draft
  (`open` / `editingIndex` / `name` / `midis`), `tourPlaying`, `vibrating`.

**Refs:** `lastChimeTimeRef` (2 s chime cooldown), `vibTimerRef`, `tourTimersRef`.

**Behavior**

- `useLivePitch(frequencyRange, a4)` supplies
  `{ midi, cents, frequency, outOfRange, level, stableRef, centsHistory, listening,
  error, start, stop }`; the mic error banner and the enable/stop button read straight
  from it. `frequencyRange` is `tuningFrequencyRange(preset)` (next section) and both it
  and `a4` are read by the hook through refs — switching instrument or calibration
  retunes everything without restarting the mic. The needle reads
  `stableRef.current` (median+EMA smoothed) at render time; raw `frequency` stays on
  the Hz display.
- **Modes.** `mode` picks Auto (nearest string within ~1.8 semitones), Manual (locked
  peg), or Chromatic (no string matching — cents vs the displayed note, like a handheld
  tuner). The A4 steppers (415–466 Hz) and capo select (frets 0–7) rescale every target
  through `resolveTuning(preset, { a4, capo })`; both persist in `localStorage`
  (`musix.tuner.settings`).
- **Custom tunings** (`musix.tuner.customs`) — a 4–8-string editor with MIDI steppers
  (A0–C7, reentrant order allowed) opens from the picker's “＋ New custom tuning…”
  option (value −1, opens the editor instead of switching) or the pencil on a saved
  custom. Save upserts by name, delete removes, and customs render as their own picker
  group after the static families; the headstock adapts to their string count.
- **“Hear tuning”** tours every open string low→high (750 ms spacing) with a vibration
  flash on the ringing wire; unmount and preset changes cancel the scheduled timers.
- The dwell effect gates `confirmedTune`: `rawInTune` must hold for `IN_TUNE_DWELL_MS`
  (400 ms) before the badge, peg ring, arc glow, and chime commit; leaving the window
  resets it immediately (consecutive-hits semantics, like the reference tuner's sound
  gate).
- **Per-preset detection cutoff.** The meter only accepts pitches inside the band the
  selected instrument can actually produce (one octave below its lowest open string up
  to 24 frets above its highest, 25 Hz rumble floor). A pitched signal outside it holds
  the readout at silence and shows an **OUT OF RANGE · min–max Hz** badge (the preset
  select's tooltip states the same numbers), instead of leaving a dead "play a string"
  meter — "nothing is playing" and "outside this instrument's range" now read
  differently. The global 55–1400 Hz band this replaced cut a bass's low E1 (41.2 Hz)
  and B0 entirely, and clipped a violin's upper half.
- The needle retunes to whichever string the pitch belongs to: auto mode resolves the
  *nearest* string within ~1.8 semitones (first-match would misfire on the ukulele's
  g/A pair), manual mode follows the locked peg. Off-target pitches fall back to cents
  against the nearest chromatic note so the needle still moves.
- **IN TUNE** (≤ 4 cents, dwell-confirmed — see above) requires an actually detected
  pitch — silence no longer reads as "0 cents, in tune". A success chime fires on tune
  with the 2 s cooldown, and the matched peg gets a success ring (applied inline: two
  competing border utilities would resolve by Tailwind's alphabetical compile order,
  not intent).
- Peg click plays a 2.5 s reference tone in the preset's instrument voice, locks the
  meter to that string (switching to Manual), and flashes the wire's vibration;
  changing the tuning clears any stale lock.
- The center readout sits *inside* the arc (above the hub) and shows note + octave,
  `Hz · ±cents` (raw frequency, hysteresis-filtered note), the stability chip, and a
  "Tuning to string N" target line; the status badge, input-level meter (with the
  "signal too low" nudge), cents sparkline, and `sr-only` `aria-live` region (coarse
  5-cent steps) are rows under the gauge so nothing overlaps the track ends.
- Gauge marker angle = `needleAngleFor(centsOff)` — a capsule riding the track plus a
  faint spoke and a ringed hub, not a full-length lever (which swung through the
  readout). `centsOff` itself comes from the hook's smoothed `stableRef` frequency, so
  one noisy frame cannot yank the needle. One `needleColor`
  (`meterColorValue(meterColorState(...))` — silent/flat/sharp/intune) drives marker,
  spoke, hub, arc glow, and sparkline so the states cannot disagree. The track carries a flat→alert zone gradient and the
  ticks warm to their side's colour; ticks are degrees from straight up and stay signed
  (masking them with `& 255` used to fling the flat-side ticks below the arc).
- The grouped preset picker (one `<optgroup>` per family, `Custom` appended when saved
  presets exist, plus a trailing “＋ New custom tuning…” option that opens the editor)
  and both peg columns re-render from `[...TUNING_PRESETS, ...customs]`; the columns
  split `ceil(n/2)` strings each, so the headstock adapts to 4–8 strings.

---

## `src/utils/tunings.ts` — `TUNING_PRESETS`, `resolveTuning`, `tuningFrequencyRange`

The tuner's preset table: fifteen tunings across Guitar, Bass, Ukulele, Violin,
Mandolin, Banjo, and Cello. Custom tunings are runtime-only (the `'Custom'` family,
saved by the component in `localStorage`).

- Each `TuningString` stores only a player-facing string number and the open string's
  MIDI note; `resolveTuning` derives the note, octave, and `midiToFrequency` Hz, so no
  frequency is hand-typed (the old table carried eighteen of them by hand).
- `resolveTuning(preset, { a4, capo })` applies the tuner's two calibration axes: `a4`
  scales every frequency to a non-standard concert pitch (415–466 Hz) and `capo` shifts
  every target up N semitones with its note name. Defaults reproduce the bare table
  exactly, so bare `resolveTuning(preset)` is unchanged.
- Strings run low to high down each headstock column; the left column takes `ceil(n/2)`
  entries — 3/3 on guitar, 3/2 on five-string bass, 2/2 on ukulele and violin.
- The ukulele's reentrant standard keeps physical order (4 → 1: g, C, E, A) even though
  the g string sits above C and E in pitch.
- Each preset carries the sound-engine voice its reference tone plays with; violin
  falls back to the acoustic guitar voice (no dedicated violin voice exists).
- `tuningFrequencyRange(preset)` derives the tuner's detection band `{ min, max }` from
  the preset's own strings: one octave below the lowest open string (floored at 25 Hz so
  a 5-string bass's B0 passes but sub-bass rumble does not) up to four times the highest
  open string (24 frets). The `tuner frequency cutoff` tests in `tunings.test.ts` assert
  the invariants for every preset.
- Exports `TUNING_FAMILIES` (picker group order) and is covered by
  `src/utils/tunings.test.ts`.

---

## `src/utils/tunerMeter.ts` — pure tuner meter maths

The decisions behind what the needle and badges show, extracted from the component so
they can be tested without a microphone or a DOM (`tunerMeter.test.ts`). Shaped after
TomSchimansky/GuitarTuner's rolling-average needle and 15-hit note hysteresis.

- `centsBetween` / `centsLabel` / `noteFrequency` — cents, display formatting, and
  equal-tempered frequency at any A4 reference.
- `needleAngleFor` (±45° over ±50 ¢, clamped), `meterColorState` /
  `meterColorValue` (the silent/flat/sharp/intune colour state machine → theme
  tokens), and the `IN_TUNE_CENTS` / `IN_TUNE_DWELL_MS` / `NOTE_HYSTERESIS_FRAMES`
  constants.
- `createNeedleSmoother` — rolling median (spike rejection: one octave slip cannot yank
  the needle) feeding an EMA (the damping that settles it).
- `createNoteHysteresis` — a new note must hold the full frame streak before the
  displayed label switches; the first note and a return to the committed note commit
  immediately.
- `stabilityLabel` — grades the recent cents trace (steady ≤4 ¢ / moving ≤12 ¢ /
  unsettled) for the hold-still chip.

---

## `src/utils/useLivePitch.ts` — `useLivePitch`

The one microphone pipeline in the app, behind the tuner, the fretboard's live note
finder, and the Song Follower's play-along.

- Requests `getUserMedia({ audio: true })`, wires an `AnalyserNode` (`fftSize = 2048`),
  and runs the shared `detectPitch` once per animation frame into a buffer allocated once
  per session (not per frame).
- Accepts a `FrequencyBand` (`{ min, max }`, defaulting to the original global
  55–1400 Hz that the fretboard note finder and Song Follower still use) and an `a4`
  reference (default 440 — tuner calibration), converts to MIDI + cents, and returns
  `{ midi, cents, frequency, outOfRange, level, stableRef, centsHistory, listening,
  error, start, stop }`. The tuner passes its preset's band; a pitched signal outside it
  holds the readout at silence and raises `outOfRange` (the tuner's OUT OF RANGE badge).
  Band and A4 land through refs, without restarting the mic stream.
- Display shaping lives in the loop: note-label hysteresis and the median+EMA
  `stableRef` / `centsHistory` run per frame and are read at render; `level` is the same
  window's RMS quantised to 15 steps. `computeRms` (musicTheory) is the detector's own
  gate, so the input meter and the detection gate can never disagree.
- State updates are coalesced (note change, or cents moved ≥2) so the 60 fps loop does
  not re-render the screen every frame.
- Falls back to silence after 700 ms without a usable pitch, so a note that stopped
  ringing does not sit on the screen.
- `start` guards insecure origins (no `navigator.mediaDevices`) with a readable error
  instead of throwing; `stop` releases the mic and closes the context, and unmount
  always calls it.

---

## `src/components/PianoKeyboard.tsx` — `PianoKeyboard`

**Props:** `activeNotes?: NoteName[]`, `rootNote?: NoteName`, `octaves?: number` (default
`2`).

Starts at MIDI 48 (C3), renders `octaves * 12` keys, marks black keys by `♯` in the name,
adds `active-key` / `root-key` classes, and plays a piano note on click.

---

## `src/components/ScaleExplorer.tsx` — `ScaleExplorer`

**Props:** `selectedRoot`, `onRootChange`, `onScaleNotesChange?`.

**State:** `selectedScaleId` (default `'major'`).

Computes scale notes with `transposeNote`, plays the scale ascending with 350 ms spacing
plus a closing octave, and reports notes upward via an effect. Renders two standard
dropdowns — key root, and a scale picker grouped Scales then Modes by name — plus the
degree/note cards. The root is a dropdown here; the 12-chip `NotePicker` remains on the
interval explorer.

---

## `src/components/IntervalExplorer.tsx` — `IntervalExplorer`

**State:** `note1` (default `'C'`), `note2` (default `'G'`).

Computes `(idx2 − idx1 + 12) % 12`, looks the value up in `COMPREHENSIVE_INTERVALS`, and
renders the note grids, distance badge, name/short code, quality tag, and description.
`playInterval('melodic' | 'harmonic')` handles playback.

---

## `src/components/RhythmMetronome.tsx` — `RhythmMetronome`

**State:** `bpm` (100), `isPlaying`, `currentBeat`, `beatsPerMeasure` (4),
`pendulumAngle`, `pendulumDir`, `flashBeat`, `accent`.

**Refs:** `tapTimesRef`, `timerRef`, `pendulumAnimRef`, `pendulumStartRef`,
`pendulumFromRef`, `pendulumToRef`.

**Constants:** `TEMPO_NAMES` (10 bands from Larghissimo to Prestissimo) and
`getTempoName(bpm)`.

**Behavior**

- A `setInterval` at `(60/bpm)*1000` ms advances beats; the first beat of each measure is
  accented (1200 Hz click) and others are 800 Hz.
- `animatePendulum` eases between two angles with `0.5 − 0.5·cos(π·progress)` and swaps
  direction on every beat.
- `handleTapTempo` averages up to the last six taps and clamps the result to 40–240 BPM.
- The SVG pendulum's weight position is `85 − ((bpm − 40) / 180) * 65`, i.e. it slides
  closer to the pivot as tempo increases.
- Renders beat dots, BPM slider, presets, time-signature select, tap button, and info
  chips. Accented beats flash the glow ring in cyan.

---

## `src/components/TheoryCheatSheet.tsx` — `TheoryCheatSheet`

Keeps two pieces of local state: the set of ticked syllabus topics and which topic's
summary is open (one at a time). The root is a fragment holding two blocks: the guide
card and, below it, a Quick reference section. The card opens with a progress panel
(accent wash, headline percentage, live topic count, Reset, gradient progress bar),
then the 17 topics in four sections that mirror `music-theory-reference/` — each
section headed by an icon tile and a count pill, its rows in a hairline-divided list
unit. A row pairs a square checkbox (brass gradient + glow when ticked) with a
full-width title/chevron disclosure; the expanded panel takes an accent wash and
carries the topic's `info` lead-in, `details` list of key points, and optional `screen`
deep link. Ticks persist through the preference
store under `PREFERENCE_KEYS.guideProgress`, validated with `isStringList` and
filtered against the live syllabus on load. The Quick reference section holds six
static cards with icon tiles: reading guitar
cards, half/whole steps, building chords, scale formulas, pitch movement (intervals),
and practice links that deep-link to the relevant screens through hash anchors
(`#fretboard`, `#scales`, …), which the router picks up via `hashchange`.

---

## `src/components/SongFollower.tsx` — `SongFollower`

Steps through a pasted chord chart, chord by chord. No props; it owns its own chart and
playback state.

**State**

- `draft` / `source` — the textarea text and the text the loaded chart came from.
- `chart: ParsedChart` — the parsed result, initialized to an empty chart so the screen
  opens on the paste step.
- `bpm` (80), `beatsPerChord` (4), `transpose` (0), `isPlaying`, `position`, `soundOn`.

**Playback**

- `timeline` flattens the parsed lines into `{ lineIndex, chordIndex }` pairs so a global
  chord index can highlight the right chip.
- A `setInterval` at `(60000 / bpm) * beatsPerChord` advances `position` modulo the chord
  count; an effect calls `playChordAt(position)` so the chord sounds on each change.
- `playChordAt` uses `chordFrequencies` + `soundEngine.strumChord(freqs, 0.06)` with **no**
  instrument override, so the TopBar's instrument choice (or the tab default in Auto mode)
  decides the voice.
- `activeChordRef` is attached to the highlighted chip and scrolled into view with
  `{ block: 'nearest', behavior: 'smooth' }` while playing.

**Rendering**

- Note lines render as section badges, blank note lines as spacers, chord lines as chip
  rows, and lyric lines as a chip row above `white-space: pre-wrap` lyrics.
- The transport holds Prev/Follow/Next/Restart, tempo, beats-per-chord, transpose, and
  sound on/off; a progress block shows the current chord and a fill bar.

**Deliberate limitation**

There is no URL import. Ultimate Guitar pages are not CORS-enabled and scraping them is
against their terms, so the screen explains why and works from pasted chart text.

---

## `src/utils/chordChart.ts`

Pure chord-chart parsing and music helpers. No DOM, no React — fully unit tested in
`src/utils/chordChart.test.ts` (24 tests).

| Export | Signature | Notes |
| --- | --- | --- |
| `parseChordSymbol` | `(token) => ChordSymbol \| null` | Root, quality, suffix, slash bass |
| `isChordToken` | `(token) => boolean` | Rejects lyric words |
| `parseChordChart` | `(input) => ParsedChart` | Lines, flat chord sequence, unique chords, section count |
| `chordTones` | `(symbol, semitones?) => NoteName[]` | Adds the 7th when the suffix implies one |
| `chordFrequencies` | `(symbol, semitones?, baseMidi?) => number[]` | Ascending voicing; slash bass an octave below |
| `transposeChordToken` | `(token, semitones) => string` | Keeps the suffix and slash bass |
| `describeChordSymbol` | `(token) => string` | `Am7` → "A minor 7" |
| `SAMPLE_CHART` | `string` | The built-in demo chart |

`ChordQuality` is `'major' | 'minor' | 'diminished' | 'augmented' | 'suspended' | 'other'`,
and each quality maps to a semitone stack in `QUALITY_INTERVALS`.

---

## `src/utils/chordVoicing.ts` — the voicing maths

- `chordPositionForStrings(chord, position, strings, maxFret)` → `{ frets, fingers,
  usedStoredShape }`: the stored shape at position 0 on standard guitar, otherwise a
  voicing searched around the position. Searched fingerings take one finger per adjacent
  string and repeat one only where it genuinely lies across a gap, so the numbers and the
  drawn barre can never disagree; past the pinky a string is left unnumbered.
- `getChordPosition(chord, position)` — standard-guitar wrapper.
- `fretWindow(frets)` → the five-fret slice a diagram draws.
- `detectBarre(frets, fingers)` → `{ fret, from, to, finger }` or `null`. Reads the grip the
  way a hand does: F Major's `133211` is barred under fingers 2–3–4, A7's `x02020` is not.
- `keyboardMidis(chord)`, `chordFrequencies(chord, position, transposeOffset, instrument)`.
- `transposeChordShape(chord, delta)` → `{ chord, transposeOffset, usedStoredShape }`.

## `src/utils/progressions.ts`

- `PROGRESSION_PRESETS` — `I–V–vi–IV`, `ii–V–I`, `12-bar blues` as degree offsets.
- `resolveProgression(preset, key)` → `ChordCardItem[]` with stable ids.
- `rotateRoot(key, offset)`; `romanNumeralFor(root, type, key)` — the chart's degree labels.

## `src/utils/theme.ts`

The selectable-theme registry.

- `THEMES` — the four options (`studio`, `nocturne`, `paper`, `arcade`) with display labels.
- `ThemeId` — union of the ids.
- `readTheme()` — the stored theme, or `studio` when storage is empty or blocked.
- `applyTheme(id)` — sets `data-theme` on `<html>` and persists the choice.

`main.tsx` calls `applyTheme(readTheme())` before the first render so the page never
flashes the default palette.

---

## `src/utils/audio.ts` — `soundEngine`, `InstrumentType`

`InstrumentType = 'acoustic-guitar' | 'electric-guitar' | 'piano' | 'bass' | 'ukulele' | 'synth'`.

Class `SoundEngine` (exported as the singleton `soundEngine`):

| Method | Signature | Notes |
| --- | --- | --- |
| `setInstrument` | `(inst: InstrumentType \| 'auto') => void` | Sets the global voice |
| `getInstrument` | `() => InstrumentType \| 'auto'` | Reads the global voice |
| `playNote` | `(freq, duration = 1.6, overrideInstrument?) => void` | One note |
| `strumChord` | `(frequencies, arpeggioDelay = 0.05, overrideInstrument?) => void` | Arpeggio |
| `playClick` | `(isHighBeat = false) => void` | 1200/800 Hz metronome click |

Private helpers: `init()` (lazy context + resume), `createNoiseBuffer()` (30 ms burst),
`makeDistortionCurve(amount = 20)` (waveshaper curve).

---

## `src/utils/musicTheory.ts`

Note and fret math, plus pitch detection.

**Tables:** `ALL_NOTES` (12 names using `♯`), `NOTE_ALIASES` (flat and `#` spellings),
`GUITAR_STRINGS` (E2/A2/D3/G3/B3/E4 with MIDI 40/45/50/55/59/64), `NOTE_COLORS` (one
color per pitch class).

**Functions**

| Function | Purpose |
| --- | --- |
| `midiToFrequency(midi)` | `440 · 2^((midi − 69)/12)` |
| `getNoteIndex(note)` | Alias-aware index; `-1` when unknown (not masked to 255) |
| `noteNameAt(idx)` | Safe note lookup by pitch-class index |
| `stringInfoAt(idx)` | Safe guitar-string lookup (clamps out of range) |
| `getSemitoneIndexLike(idx)` | Normalizes any number into 0–11 |
| `getNoteDescriptor(note)` | `{ label, semitone, color }` |
| `noteColorFor(note)` | Color with a `#555555` fallback |
| `transposeNote` / `transposeNoteSafe` / `transposeNoteSafeAny` | Pitch-class transposition (alias-aware) |
| `getFretNote(stringIndex, fret)` | Note at a fret |
| `getFretMidi(stringIndex, fret)` | MIDI at a fret |
| `fretPositionsForMidi(midi, strings, maxFret)` | Every (string, fret) that sounds a MIDI note — tested inverse of `getFretMidi` |
| `detectPitch(buf, sampleRate)` | The single autocorrelation detector (shared by every mic path) |

---

## `src/data/chordsData.ts`

- `COMPREHENSIVE_CHORDS: ChordShape[]` — 22 chords (C, A, G, E, D, F, B families plus the
  five sharp-root barres). Names never include the grip.
- `chordDisplayName(root, type)` — the one spelling of a chord name (`C Major`, `C7`,
  `Cmaj7`), shared by the stored table, the fallback and transposition.
- `findOrCreateChord(root, type)` — case-insensitive lookup, else a fallback that derives its
  notes from `QUALITY_STACKS` and leaves `frets` empty for the grid to voice.
- `asSafeChord(chord)` — returns a guaranteed `SafeChordShape`, defaulting to a C Major
  shape when given null/undefined.

## `src/data/scalesData.ts`

- `COMPREHENSIVE_SCALES: ScaleDefinition[]` — 8 scales/modes.
- `COMPREHENSIVE_INTERVALS: IntervalDefinition[]` — 13 intervals (0–12 semitones).

## `src/types.ts`

`NoteName`, `StringName`, `ChordShape`, `SafeChordShape`, `SafeChordStringInfo`,
`ChordShapeSafe`, `SafeGuitarString`, `ScaleDefinition`, `IntervalDefinition`,
`ChordCardItem`.
