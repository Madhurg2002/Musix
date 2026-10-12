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

A `RouteDefinition` holds `id`, `title`, `group` (`Practice` / `Fretboard` / `Harmony` /
`Learn` / `Project`), `label`, `instrument` (the Auto-mode voice), an optional
`visibleFor` for the Piano/Fretboard pair, an optional `railHidden`, and `render(context)`.

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
  screen hero, the active tab, and the footer.

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
- The footer holds the theme `<select>` (from `THEMES`) and the Piano/Guitar visualizer
  toggle as a `role="group"` of two `aria-pressed` buttons. Changing the theme writes
  `data-theme` on `<html>` and persists it through `applyTheme`.
- Below 900px the rail lays out horizontally and becomes a scrollable top strip.

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

## `src/components/ChordWorkbench.tsx` — `ChordWorkbench` + `CardFretboard`

The side-by-side chord studio.

**`ChordWorkbench` props:** `onSelectChordForFretboard?(chord)`, `onOpenTuner?()`.

**State**

- `cards: ChordCardItem[]` — default C Major, A Major, and `COMPREHENSIVE_CHORDS[12]`.
- `selectedRootToAdd`, `selectedTypeToAdd` — the "add card" selectors.
- `draggedCardId`, `dropTargetCardId` — drag-and-drop feedback.

**Handlers**

- `handleAddCard` → `findOrCreateChord(root, type)`.
- `handleRemoveCard`, `handleDuplicateCard` (uses `crypto.randomUUID()`).
- `handleMoveCard(id, ±1)` (keyboard) and `handleReorderCard(source, target)` (drag).
- `handleCardPositionChange(id, position)` — per-card fret position slider.
- `handleTranspose(id, ±1)` — transposes root and all notes by a semitone.
- `handlePlayChord(card)` — strums the card's voicing; falls back to a synthetic voicing
  if no frets are playable.
- `handlePlayProgression()` — plays each unmuted card 1200 ms apart.

**Internal `CardFretboard`** (props: `chord`, `cardId`, `position`, `onPositionChange`)

- Uses `getChordPosition(chord, position)` to compute frets/fingers for a voicing near
  the chosen position.
- Computes the visible fret window: `firstFret` clamps to the highest pressed fret minus
  four when a voicing sits high on the neck; `fretCount` is at least 5.
- Renders a numbers row, then one row per string (high E first) with a marker on the
  pressed fret showing the finger number, plus `×`/`○` state in the string label.
- The Fret position range input shows `Original` at 0 and `Fret N` otherwise.

**Also renders:** the chord picker bar is provided by `App` on the fretboard tab, not
here.

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

Microphone tuner for guitar, bass, ukulele, and violin, with a visual headstock and an
arc gauge. The component owns only the tuning UI — the microphone itself is the shared
`useLivePitch` hook (below), and the preset table lives in `src/utils/tunings.ts`
(next), so this screen and the other two mic paths cannot drift apart.

**Exports**

- `GuitarTuner` — the component.

**State**
- `presetIndex`, `autoDetectMode` (auto vs manual string lock),
  `selectedStringIndex`, `activePegIndex`.

**Refs:** `lastChimeTimeRef` (2 s chime cooldown).

**Behavior**

- `useLivePitch()` supplies `{ midi, cents, frequency, listening, error, start, stop }`;
  the mic error banner and the enable/stop button read straight from it.
- The needle retunes to whichever string the pitch belongs to: auto mode resolves the
  *nearest* string within ~1.8 semitones (first-match would misfire on the ukulele's
  g/A pair), manual mode follows the locked peg. Off-target pitches fall back to cents
  against the nearest chromatic note so the needle still moves.
- **IN TUNE** (≤ 4 cents) requires an actually detected pitch — silence no longer reads
  as "0 cents, in tune". A success chime fires on tune with the 2 s cooldown, and the
  matched peg gets a success ring (applied inline: two competing border utilities would
  resolve by Tailwind's alphabetical compile order, not intent).
- Peg click plays a 2.5 s reference tone in the preset's instrument voice and locks the
  meter to that string; changing the tuning clears any stale lock.
- The center readout shows note + octave, `Hz · ±cents`, and a "Tuning to string N"
  target line naming what the needle compares against.
- Gauge needle angle = `clamp((cents / 50) * 45, −45, 45)`; the arc ticks are degrees
  from straight up and stay signed (masking them with `& 255` used to fling the flat-side
  ticks below the arc).
- The grouped preset picker (one `<optgroup>` per family) and both peg columns re-render
  from `TUNING_PRESETS`; the columns split `ceil(n/2)` strings each, so the headstock
  adapts to 4-, 5-, and 6-string instruments.

---

## `src/utils/tunings.ts` — `TUNING_PRESETS`, `resolveTuning`

The tuner's preset table: eleven tunings across Guitar, Bass, Ukulele, and Violin.

- Each `TuningString` stores only a player-facing string number and the open string's
  MIDI note; `resolveTuning` derives the note, octave, and `midiToFrequency` Hz, so no
  frequency is hand-typed (the old table carried eighteen of them by hand).
- Strings run low to high down each headstock column; the left column takes `ceil(n/2)`
  entries — 3/3 on guitar, 3/2 on five-string bass, 2/2 on ukulele and violin.
- The ukulele's reentrant standard keeps physical order (4 → 1: g, C, E, A) even though
  the g string sits above C and E in pitch.
- Each preset carries the sound-engine voice its reference tone plays with; violin
  falls back to the acoustic guitar voice (no dedicated violin voice exists).
- Exports `TUNING_FAMILIES` (picker group order) and is covered by
  `src/utils/tunings.test.ts`.

---

## `src/utils/useLivePitch.ts` — `useLivePitch`

The one microphone pipeline in the app, behind the tuner, the fretboard's live note
finder, and the Song Follower's play-along.

- Requests `getUserMedia({ audio: true })`, wires an `AnalyserNode` (`fftSize = 2048`),
  and runs the shared `detectPitch` once per animation frame into a buffer allocated once
  per session (not per frame).
- Accepts 55–1400 Hz, converts to MIDI + cents, and returns `{ midi, cents, frequency }`.
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

Stateless. Renders three static guide cards: reading guitar cards, half/whole steps, and
building chords.

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

- `COMPREHENSIVE_CHORDS: ChordShape[]` — 17 chords (C, A, G, E, D, F, B families).
- `findOrCreateChord(root, type)` — case-insensitive lookup, else a generic fallback.
- `asSafeChord(chord)` — returns a guaranteed `SafeChordShape`, defaulting to a C Major
  shape when given null/undefined.

## `src/data/scalesData.ts`

- `COMPREHENSIVE_SCALES: ScaleDefinition[]` — 8 scales/modes.
- `COMPREHENSIVE_INTERVALS: IntervalDefinition[]` — 13 intervals (0–12 semitones).

## `src/types.ts`

`NoteName`, `StringName`, `ChordShape`, `SafeChordShape`, `SafeChordStringInfo`,
`ChordShapeSafe`, `SafeGuitarString`, `ScaleDefinition`, `IntervalDefinition`,
`ChordCardItem`.
