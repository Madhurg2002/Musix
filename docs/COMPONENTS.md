# Components & Modules

Reference for every source module: what it renders, its props, its local state, and the
behaviors it owns.

---

## `src/main.tsx`

Entry point. Mounts `<App />` (inside `StrictMode`) into `document.getElementById('app')`
and imports the global stylesheet.

## `index.html`

Document shell. Loads Google Fonts (Outfit, JetBrains Mono), `src/style.css`, and
`src/main.tsx`. Contains the `#app` mount node.

---

## `src/App.tsx` — `App`

Screen shell and the only owner of cross-tab state.

**State**

- `activeTab: string` — initialized from the URL hash.
- `selectedRoot: NoteName` — default `'C'`.
- `activeChordForFretboard: ChordShape | null` — default `COMPREHENSIVE_CHORDS[0]`.
- `selectedVisualizer: 'piano' | 'guitar'`.
- `activeScaleNotes: NoteName[]`.
- `userOverride: InstrumentType | 'auto'`.

**Constants**

- `TAB_DEFAULT_INSTRUMENT` — the per-tab auto instrument map.
- `VALID_TABS` — the hash whitelist.

**Behavior**

- `setActiveTab` writes the hash; a `hashchange`/`popstate` listener reads it back.
- An effect applies the tab's default instrument whenever the tab changes and the user
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

- Renders `nav.nav-rail`: the brand, then `NAV_GROUPS` — Practice (Tuner, Rhythm),
  Fretboard (Fretboard, Scales, Intervals), Harmony (Chord Studio, Piano), Learn (Guide).
- Filters out the `piano` or `fretboard` item unless the matching visualizer is selected,
  so only one of that pair is listed.
- Each item is a `rail-item` with a label and a one-line hint, `aria-current="page"` on
  the active entry, and a brass left rule while active.
- The footer holds the Piano/Guitar visualizer toggle as a `role="group"` of two
  `aria-pressed` buttons.
- Below 900px the rail lays out horizontally and becomes a scrollable top strip.

---

## `src/components/TopBar.tsx` — `TopBar`

The control strip above the screen content.

**Props**

| Prop | Type | Purpose |
| --- | --- | --- |
| `activeTab` | `string` | Resolves the screen title from `TAB_TITLES` |
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

Microphone pitch tuner with a visual headstock.

**Exports**

- `GuitarTuner` — the component.
- `detectPitch` / `detectPitchVanilla` / `detectPitchLite` — the autocorrelation
  detector (a second copy of the one in `musicTheory.ts`).
- `autoCorrelate` — a near-identical internal detector.
- `TUNING_PRESETS: TuningPreset[]` — Standard, Drop D, Half Step Down.
- Types `StringInfo` and `TuningPreset`.

**State**

- `selectedPresetIndex`, `autoDetectMode`, `selectedStringIndex`, `isMicListening`,
  `detectedPitch`, `detectedNoteName`, `centsOff`, `activePegIndex`, `micError`.

**Refs:** `audioCtxRef`, `analyserRef`, `micStreamRef`, `animFrameRef`,
`lastChimeTimeRef`.

**Behavior**

- `startMic()` requests `getUserMedia`, wires an `AnalyserNode` (fft 2048), and starts
  the `requestAnimationFrame` pitch loop.
- `stopMic()` cancels the loop, stops tracks, closes the context, and resets readouts.
- `updatePitch()` gates on RMS and a 60–1000 Hz range, computes note + cents, matches a
  string (< 1.8 semitone error) in auto mode or the locked string otherwise, and plays a
  chime when within 4 cents (2 s cooldown).
- Peg click plays a 2.5 s reference tone.
- Gauge needle angle = `clamp((cents / 50) * 45, −45, 45)`.
- The preset selector and both peg columns re-render from `TUNING_PRESETS`.
- Unmount cleanup calls `stopMic()`.

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
plus a closing octave, and reports notes upward via an effect. Renders the step pattern,
the degree/note cards, and the root + scale selectors.

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
| `getNoteIndex(note)` | Alias-aware index; `-1` when unknown |
| `noteNameAt` / `getNoteByCheckedIndex` / `noteNameFromIndex` | Safe note lookup (aliases) |
| `stringInfoAt` / `getGuitarStringInfo` / `resolveGuitarString` | Safe string lookup (aliases) |
| `getSemitoneIndexLike(idx)` | Normalizes any number into 0–11 |
| `getNoteDescriptor(note)` | `{ label, semitone, color }` |
| `getFindIndex(strings, idx)` | Argument pass-through (`idx & 255`) |
| `noteColorFor(note)` | Color with a `#555555` fallback |
| `transposeNote` / `transposeNoteSafe` / `transposeNoteSafeAny` | Pitch-class transposition |
| `getFretNote(stringIndex, fret)` | Note at a fret |
| `getFretMidi(stringIndex, fret)` | MIDI at a fret |
| `detectPitch(buf, sampleRate)` (+ `Vanilla`/`Lite` aliases) | Autocorrelation pitch detection |

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
