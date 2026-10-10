# Musix — Capabilities

Everything the app can currently do, feature by feature, plus the technical capabilities
behind each feature. Every claim here maps to a file in `src/`.

Legend: **User-facing** = what a learner can click or hear. **Technical** = the code
capability that makes it work.

---

## 1. App shell and navigation

**User-facing**

- Ten tab screens: Song Follower, Instrument Tuner, Guitar Fretboard, Side-by-Side Cards
  (chord studio), Piano Visualizer, Scales & Modes, Intervals, Rhythm & Metronome,
  Contact, and the Beginner Guide.
- URL hash routing: `#workbench`, `#songs`, `#tuner`, `#fretboard`, `#piano`, `#scales`,
  `#intervals`, `#rhythm`, `#contact`, `#guide`. Unknown or missing hashes land on
  `#workbench`.
- Every screen is code-split: the route table in `src/utils/router.ts` loads each screen
  with `React.lazy`, so the initial bundle only carries the shell and the screen you open.
- Browser back/forward navigation moves between tabs (`hashchange` + `popstate`).
- Navigation is a **left rail** grouped by intent (Practice, Fretboard, Harmony, Learn)
  rather than one flat row of tabs. It hides the Piano or Guitar item to match the current
  visualizer choice and becomes a scrollable top strip on small screens.
- A **top bar** above the content names the current screen and owns the instrument control.
- A **hero** opens each visit with a headline, a primary "Follow a song" action, a
  secondary "Start with the basics" action, and key chips for **C, G, D, A, E, F**; the
  selected key is shared with the scales, fretboard, and piano screens.
- A **footer** carries the licence, the source link, and the contact route.

**Technical**

- `src/App.tsx` holds all shared state: `activeTab`, `selectedRoot`,
  `activeChordForFretboard`, `selectedVisualizer`, `activeScaleNotes`, and
  `userOverride` (instrument lock).
- Tab list, titles, rail grouping, and per-screen instrument defaults all live in one
  place: the `ROUTES` table in `src/utils/router.ts`. `App.tsx` reads it instead of keeping
  its own lists, and `getRouteFromHash()` normalizes and whitelists the hash.
- The shell is `Header` (nav rail) plus `.musix-main-column`, which contains `TopBar`, the
  `main.main-content-container` (hero + active tab), and the footer.
- Each tab maps to one component under `src/components/`, wrapped in a `.tab-section`.

---

## 2. Sound engine (real-time synthesis)

**User-facing**

- Six instruments, all synthesized live in the browser (no audio files, no backend):
  Acoustic Guitar, Electric Guitar, Grand Piano, Bass Guitar, Ukulele, and Synth Pad.
- **Auto** mode follows the current page (e.g. Piano on the piano tab, Acoustic Guitar
  elsewhere); picking an instrument **locks** it across tabs.
- Changing the instrument plays a short C4 preview so you can hear the choice.
- Single notes, strummed chords (arpeggiated), and metronome clicks are all generated
  on the fly.

**Technical**

- `src/utils/audio.ts` exports a `SoundEngine` singleton as `soundEngine`.
  - `setInstrument(inst | 'auto')` / `getInstrument()`
  - `playNote(freq, duration = 1.6, overrideInstrument?)`
  - `strumChord(frequencies, arpeggioDelay = 0.05, overrideInstrument?)`
  - `playClick(isHighBeat = false)`
- Instrument resolution order: an explicit user lock wins; otherwise the call's
  `overrideInstrument`; otherwise acoustic guitar.
- Synthesis details:
  - **Acoustic guitar** — 30 ms band-passed noise attack transient, five harmonic
    oscillators (`1,2,3,4,6`), a pitch-drop of +0.8% decaying in 15 ms, a sweeping
    low-pass "pluck" filter, and a 220 Hz peaking "body" resonance.
  - **Electric guitar** — sawtooth → `WaveShaper` distortion curve (amount 18) →
    band-pass cabinet tone at 1400 Hz.
  - **Piano** — five harmonics (sine fundamental + triangle partials) with
    weighted decay per partial.
  - **Bass** — sine + triangle through a 450 Hz low-pass.
  - **Ukulele** — short, bright triangle pluck.
  - **Synth** — sawtooth + slightly detuned square pad with a slow attack.
- The `AudioContext` is created lazily and resumed on demand; all audio calls are
  wrapped so a blocked/unsupported context fails silently instead of crashing the UI.

---

## 3. Instrument Tuner (GuitarTuna-style)

**User-facing**

- Three tuning presets: **Standard (E A D G B E)**, **Drop D (D A D G B E)**, and
  **Half Step Down (E♭ A♭ D♭ G♭ B♭ E♭)**.
- **Auto String Detection** finds the nearest string automatically; **Manual Lock String**
  pins detection to a chosen string.
- Live microphone pitch detection with a note readout (`E2`, `A4`, …) and Hz value.
- A curved arc gauge with a needle that swings ±45° across ±50 cents.
- Accuracy badges: **IN TUNE** (within 4 cents), **TOO LOW (tune up)**, or
  **TOO HIGH (tune down)**.
- A success chime plays when a string lands in tune (rate-limited to once per 2 s).
- Clicking any tuning peg plays a 2.5 s reference tone for that string.
- Visual headstock with the three low strings (6, 5, 4) on the left and the three high
  strings (3, 2, 1) on the right; the detected string's peg lights up.
- Clear, actionable banner if the microphone is denied or unavailable.

**Technical**

- `src/components/GuitarTuner.tsx`.
- `navigator.mediaDevices.getUserMedia({ audio: true })` → `AudioContext` →
  `AnalyserNode` (`fftSize = 2048`), sampled every animation frame.
- Autocorrelation pitch detection with an RMS gate (`rms < 0.012` returns "no pitch")
  and parabolic interpolation around the correlation peak.
- Frequency → note via `noteNum = 12·log2(f/440) + 69`; cents = `100·(noteNum − round)`.
- Valid pitch range is restricted to 60–1000 Hz; string match tolerance is < 1.8
  semitones of error.
- Cleanup stops all mic tracks and closes the audio context on stop/unmount.

---

## 4. Guitar Fretboard visualizer

**User-facing**

- A 12-fret neck (configurable via `fretsCount`) drawn from **High E (top) to Low E
  (bottom)**, matching how a player looks at the instrument.
- Fret markers on frets 3, 5, 7, 9, 15 (single) and 12 (double).
- Nut indicators for every string showing **✕ Mute**, **○ Open**, or **Fret N
  (Finger N)**.
- Chord press positions highlighted in cyan with the finger number on the badge.
- Root notes and scale notes highlighted in their per-note colors.
- Click any fret to hear it; the footer shows the hovered note, string number and name,
  fret, and exact frequency in Hz.
- A **Strum Chord** button plays the whole chord with a 60 ms arpeggio.
- A chord picker bar above the neck lets you jump between all 17 built-in chords.
- A **Find my note** toggle listens through the microphone and turns the neck into a live
  answer: the note you are playing is named with its octave and cents, and every
  (string, fret) that sounds it pulses on the neck — including a ring around the open
  string's head at the nut when the pitch is an open string.

**Technical**

- `src/components/GuitarFretboard.tsx`.
- Fret notes come from `getFretNote(stringIndex, fret)`; frequencies from
  `getFretMidi` + `midiToFrequency`.
- The live note finder runs on `src/utils/useLivePitch.ts` (mic loop on top of the shared
  `detectPitch`, silence after 700 ms without a usable pitch) plus
  `fretPositionsForMidi(midi, strings, maxFret)` in `src/utils/musicTheory.ts` — the tested
  inverse of `getFretMidi`, so the tuner and this screen stay on one detector.
- A `displayedChordId` state promotes the chord sent from the Chord Studio once, so
  closing the studio never blanks the neck.
- String wire thickness scales with string index for a realistic look.

---

## 5. Side-by-Side Chord Studio (workbench)

**User-facing**

- Independent chord cards you can compare next to each other (start state: C Major,
  A Major, and the chord at index 12 of the data file — currently D Major).
- Add a card by choosing any root (12 notes) and type (Major, Minor, 7th, Major 7th).
- Per-card controls: transpose ±1 semitone, mute/unmute, duplicate, remove, reorder.
- Reorder by dragging the ⠿ handle or with **Alt+↑ / Alt+↓**.
- Each card shows a mini fretboard with a **Fret position** slider (Original → Fret 20)
  that generates a new voicing near that position and shifts the displayed fret window.
- Play a single card, or **Play Progression** to hear every unmuted card in sequence
  (1.2 s apart).
- **Open Fretboard** sends any card's chord to the full fretboard tab.

**Technical**

- `src/components/ChordWorkbench.tsx` (with an internal `CardFretboard` renderer).
- Transposition uses `transposeNote` on the root and every chord tone.
- `getChordPosition(chord, position)` searches ±2 frets around the target position for
  the best chord-tone fret per string, then derives finger numbers from the sorted
  pressed frets.
- Audio: `soundEngine.strumChord(freqs, 0.07, 'acoustic-guitar')`, with a synthetic
  fallback if the voicing produces no playable notes.
- Cards are ordered by an array of `ChordCardItem`; drag-and-drop uses the HTML5
  `dragstart`/`dragover`/`drop` events with the card id in `text/plain`.

---

## 6. Piano visualizer

**User-facing**

- Two octaves of playable piano starting at C3 (MIDI 48), 24 keys.
- Active chord or scale notes light up in their note color; the root key is tagged
  **ROOT**.
- Click any key to hear it (piano voice).
- Used both as its own tab and as the alternative visualizer on the Scales screen.

**Technical**

- `src/components/PianoKeyboard.tsx`; props `activeNotes`, `rootNote`, `octaves`.
- Black/white keys are derived from whether the note name contains `♯`.

---

## 7. Scales & Modes explorer

**User-facing**

- Eight scales/modes: Major (Ionian), Natural Minor (Aeolian), Minor Pentatonic,
  Blues, Dorian, Mixolydian, Phrygian, and Lydian.
- Pick any of the 12 roots; the title, description, and note cards update live.
- Shows the step pattern (`W - W - H …`), each scale degree label, and the semitone
  offset for every note.
- **Play Scale Ascending** plays the scale note-by-note (350 ms apart) and finishes on
  the octave.
- The chosen scale notes are pushed to the shared visualizer, so the piano or fretboard
  below highlights them.

**Technical**

- `src/components/ScaleExplorer.tsx` + `src/data/scalesData.ts`.
- Scale notes are computed as `intervals.map(semi => transposeNote(root, semi))`, so a
  single root change recomputes the whole scale.
- An effect calls `onScaleNotesChange` whenever the root or scale changes.

---

## 8. Interval explorer

**User-facing**

- Pick any two of the 12 notes and read the exact distance in semitones.
- Shows the interval name, short code (`m3`, `P5`, …), quality tag (perfect / major /
  minor / tritone), and a plain-language description.
- **Play Melodic** plays the two notes one after the other; **Play Harmonic** plays them
  together — beginner ear training.

**Technical**

- `src/components/IntervalExplorer.tsx` + `COMPREHENSIVE_INTERVALS` in
  `src/data/scalesData.ts` (13 entries, 0–12 semitones).
- Distance is `(idx2 − idx1 + 12) % 12`, looked up in the interval table with a safe
  fallback entry.

---

## 9. Rhythm & Metronome

**User-facing**

- Tempo from 40 to 220 BPM with a slider and quick presets (60/80/100/120/140/160).
- Live tempo name (Larghissimo → Prestissimo) and milliseconds per beat.
- An animated pendulum metronome (SVG) whose weight slides higher as the tempo rises,
  plus a pulsing glow ring and beat flash on every click.
- Beat dots for the current measure with the downbeat visually distinct.
- Time signatures: 2/4, 3/4, 4/4, 6/8, 5/4, 7/8, and 1/8.
- **Tap Tempo**: tap the button and the BPM is averaged from your last taps
  (clamped to 40–240).

**Technical**

- `src/components/RhythmMetronome.tsx`.
- Beats are driven by `setInterval` at `(60 / bpm) * 1000` ms; the pendulum swing is a
  `requestAnimationFrame` loop with an in-out-sine easing between two angles.
- Accented (first) beats play a 1200 Hz click, all other beats 800 Hz.

---

## 10. Song Follower

**User-facing**

- Paste any chord chart (the text from Ultimate Guitar, a songbook, or your own notes) and
  press **Follow this chart**. A sample chart is built in for a first look.
- The chart is rendered as sections, chord rows, and lyric lines with the chords sitting
  above the words they land on.
- **Follow** plays the song chord by chord: the current chord is highlighted, auto-scrolled
  into view, and sounded with the selected instrument (respecting the TopBar instrument
  choice). **Prev**, **Next**, and **Restart** step through it by hand.
- **Tempo** (40–200 BPM) and **beats per chord** (1, 2, or 4) set the pacing.
- **Transpose** shifts every chord up or down a semitone, with a reset, so a song written
  in an awkward key can be practised in a friendly one.
- **Sound on/off** mutes playback without stopping the highlight.
- **Print chart** sends the chart to the printer: the print stylesheet drops the dark
  chrome for near-black ink on white, keeps every chord line whole across page breaks, and
  hides the app shell so only the chart lands on paper.
- **Play along** listens through the microphone: a coaching strip names the notes you just
  played and checks them against the chord under the playhead — green when they fit, and a
  direct correction ("The chart says Am (A · C · E) — you played F♯, which is not in it")
  when they do not. While the follower is paused, the highlight snaps to the chart
  position your notes actually fit, so the follower works out where you are in the song.
- A progress bar and a large "now playing" chord read at a glance.

**Technical**

- `src/utils/chordChart.ts` — pure, DOM-free parser and music helpers: `parseChordSymbol`
  (root, quality, suffix, slash bass), `parseChordChart` (lines, flattened chord sequence,
  unique chords, section count), `chordTones`, `chordFrequencies` (voiced in ascending order
  with a slash bass an octave below), `transposeChordToken`, and `describeChordSymbol`.
  `SAMPLE_CHART` is the built-in demo.
- `src/components/SongFollower.tsx` — the screen. Playback is a `setInterval` at
  `(60000 / bpm) * beatsPerChord`, and a `useEffect` sounds the chord each time the index
  advances. `activeChordRef` plus `scrollIntoView({ block: 'nearest' })` keeps the current
  chord visible in the scrollable chart.
- Follow-along matching is pure and tested: `chordPitchClasses` (a chord token reduced to
  pitch classes, transposed), `chordFitScore` (overlaps for, clashes against), and
  `findBestChartPosition` (best-fitting chart index, ties won forward from the current
  position) in `src/utils/chordChart.test.ts`, fed by `src/utils/useLivePitch.ts`. Heard
  notes live in a 2-second window, and a better position must hold 1.2 seconds before the
  highlight snaps — silent, because the learner just played it.
- **Ultimate Guitar cannot be fetched.** Their pages are not CORS-enabled and scraping them
  is against their terms, so there is deliberately no URL import. The screen explains this
  and works from pasted text instead.

---

## 11. Beginner theory guide

**User-facing**

- A static starter guide split into three cards: reading guitar cards (strings, frets,
  finger numbers, ○/✕ symbols), half steps vs whole steps, and building chords
  (major triad, minor triad, dominant 7th).

**Technical**

- `src/components/TheoryCheatSheet.tsx` — presentational only, no state.

---

## 12. Music theory data layer

**User-facing**

- 17 named guitar chords with notes, interval formulas, fingerings, and difficulty tags.
- 8 scales/modes with step patterns, interval formulas, and short-form degree names.
- 13 intervals with semitone distance, quality, and descriptions.
- 12-color note badge system so the same note always looks the same everywhere.

**Technical**

- `src/data/chordsData.ts` — `COMPREHENSIVE_CHORDS`, plus `findOrCreateChord(root, type)`
  (falls back to a generic shape for unlisted chords) and `asSafeChord(chord)` (never
  returns null; used to keep strict builds happy).
- `src/data/scalesData.ts` — `COMPREHENSIVE_SCALES`, `COMPREHENSIVE_INTERVALS`.
- `src/utils/musicTheory.ts` — note tables, aliases, colors, transposition, fret math,
  MIDI→Hz, and pitch detection.
- `src/types.ts` — all shared interfaces (`ChordShape`, `ScaleDefinition`,
  `IntervalDefinition`, `ChordCardItem`, safe variants).

---

## 13. Bundled static data

**User-facing**

- The app also ships JSON editions of the theory tables under `public/data/` for anyone
  who wants to consume the same numbers as plain files.

**Technical**

- `public/data/intervals.json` — 13 intervals with just-intonation ratios, 12-TET
  ratios, and cents.
- `public/data/scale-formulas.json` — 12 scale/mode entries with degree formulas,
  semitone maps, step patterns, parent scale, and mode index.
- `public/data/chord-formulas.json` — 10 chord formulas with third-stacks, quality, and
  diatonic function, plus a `notes` block explaining stacking/extension/alteration logic.
- `public/data/guitar-fretboard-map.json` — every string/fret coordinate 0–24 with note
  name, scientific pitch, MIDI number, and exact Hz, indexed both `byString` and
  `coordinateIndex`.
- `scripts/build-pages.ts` copies `music-theory-reference/04-data/*.json` into
  `public/data/`, keeping the app copy in sync with the reference source.

---

## 14. Presentation and platform capabilities

**User-facing**

- **Four selectable themes** — Analog Studio (default, warm), Nocturne (cool dark),
  Sheet Paper (light), and Arcade (the original neon) — chosen from the navigation rail and
  remembered across reloads, with glass-card surfaces, global focus rings, and warm
  scrollbars.
- **Tooltips on every interactive control** — buttons, chips, pegs, dots and links carry a
  `data-tip` bubble (shown on hover and on keyboard focus, positioned above, below, or to the
  side of the anchor), while `select` and range inputs fall back to the native `title`
  attribute because form controls cannot render pseudo-elements. The rules live at the end of
  `src/style.css`.
- Fully static — works as a plain static site with no server or database.
- Responsive layout and hover states across every tool.

**Technical**

- Vite + React 19 + TypeScript (strict, with `noUncheckedIndexedAccess`).
- Single theme file `src/style.css`, imported both from `index.html` and `src/main.tsx`.
- Design tokens live in `:root` as channel triplets (`--accent-rgb`, `--overlay-rgb`, …),
  so each `html[data-theme=…]` block only restates the palette and every translucent tint
  follows it. `src/utils/theme.ts` applies the theme and persists the choice.
- Dev server on port 5173, preview on 4173, both bound to `0.0.0.0`.
- `bun build` produces a static `dist/`.

---

## Known gaps and rough edges

Documented so the docs stay honest about the current state:

- **No component or audio tests.** `bun test` runs 66 tests across four files —
  `musicTheory.ts` (24), `chordChart.ts` (24), `utils/router.ts` (12), and the `routes.tsx`
  table (6) — but every screen component is verified by hand in the preview. There is still
  no `test` script in `package.json`, so `bun test` is run directly.
- **Pitch detection is implemented twice.** `detectPitch` exists in
  `src/utils/musicTheory.ts` and again (as both `detectPitch` and `autoCorrelate`) inside
  `src/components/GuitarTuner.tsx`.
- **Several helper aliases overlap.** `noteNameAt`, `getNoteByCheckedIndex`, and
  `noteNameFromIndex` do the same thing, as do `stringInfoAt`, `getGuitarStringInfo`, and
  `resolveGuitarString`; `getFindIndex` only masks its argument.
- **A default-card comment is stale.** `ChordWorkbench` labels
  `COMPREHENSIVE_CHORDS[12]` as "B Minor", but index 12 in `chordsData.ts` is D Major
  (F6 in `docs/BUGS.md`).
- **The licence is not served by a production build.** The footer links to GitHub's copy; a
  `public/LICENSE` would also expose it at `/LICENSE` on the deployed site.
- **`public/metronome.js` is a stub.** It contains documentation comments only; the real
  metronome lives in `src/components/RhythmMetronome.tsx`.
- **`public/data/*.json` and `scripts/build-pages.ts` are listed in `.gitignore`** yet
  are tracked in git, so ignore rules do not currently exclude them.
- **A new screen means editing the route table.** `src/routes.tsx` is the single source for
  ids, titles, rail groups, and per-screen instrument defaults, so adding a screen is one
  `RouteDefinition` entry plus a lazily imported component — but it does mean that file
  grows with the app.
- **The Song Follower keeps nothing.** A pasted chart, the transpose choice, and the tempo
  are all in memory, so a reload loses the chart. Persisting them is on the follow-up list in
  `docs/PLAN.md`.
- **There is no URL import for songs.** Ultimate Guitar pages are not fetchable from a
  browser and their terms disallow scraping, so chart text is pasted by hand.
