# Music Theory Reference Map

Musix ships its own hand-written theory notes in `music-theory-reference/`. This doc maps
that content to the app, and records the core theory the code implements.

## The reference library

14 Markdown pages, grouped into three sections plus a template.

### `01-foundations/`

| File | Topic | Relevant app feature |
| --- | --- | --- |
| `01-pitch-and-frequencies.md` | Pitch, note names, frequency, A4 = 440 Hz | Piano keys, fretboard Hz readout, tuner |
| `02-intervals.md` | Interval names, quality, semitone distance | Intervals tab |
| `03-scale-formulas.md` | Step patterns and scale degrees | Scales & Modes tab |
| `04-chord-construction.md` | Triads, seventh chords, stacking thirds | Chord Studio, chord data |
| `05-rhythm-and-meter.md` | Beat, tempo, time signatures | Rhythm & Metronome tab |

### `02-harmony-and-analysis/`

| File | Topic |
| --- | --- |
| `01-circle-of-fifths.md` | Key relationships and the circle |
| `02-diatonic-harmony.md` | Chords within a key and their function |
| `03-voice-leading.md` | Smooth part movement between chords |
| `04-roman-numeral-analysis.md` | Reading and writing chord progressions by degree |

These four are reference prose. They are not yet surfaced as an in-app screen; the
Beginner Guide (`TheoryCheatSheet`) is a shorter, separate set of cards.

### `03-instrument-mappings/guitar/`

| File | Topic | Relevant app feature |
| --- | --- | --- |
| `01-fretboard-layout-and-standard-tuning.md` | Open strings, fret layout | Fretboard visualizer, tuner presets |
| `02-caged-system-and-movable-shapes.md` | CAGED shapes and how they move | Chord cards, fret position slider |
| `03-scale-box-patterns-and-3nps.md` | Box patterns and 3-notes-per-string | Fretboard scale highlighting |
| `04-alternate-tunings.md` | Drop D, half step down, and others | Tuner tuning presets |
| `05-triads-and-drop-chords.md` | Triads, inversions, drop voicings | Chord voicing generation |

### Authoring

- `templates/instrument-mapping-template.md` — the front-matter and heading structure to
  copy when documenting a new instrument (key mappings table, pitch positions, common
  shapes, fingerings, note spelling, beginner tip).
- `04-data/*.json` — the structured data source copied into `public/data/` (see
  `docs/DATA-MODEL.md`).
- `scripts/generate_fretboard_data.py` — the generator that produced
  `guitar-fretboard-map.json`.

## Theory the code implements

### Pitch and frequency

- Reference pitch: A4 = **440 Hz** (MIDI 69).
- Equal temperament (12-TET): `f = 440 · 2^((midi − 69) / 12)`.
- Standard tuning MIDI numbers: E2 = 40, A2 = 45, D3 = 50, G3 = 55, B3 = 59, E4 = 64.
- The fretboard JSON also carries just-intonation ratios and cents for comparison.

### Intervals

All 13 intervals from 0–12 semitones, with quality classes `perfect`, `major`, `minor`,
and `tritone`:

| Semitones | Interval | Short |
| --- | --- | --- |
| 0 | Perfect Unison | P1 |
| 1 | Minor 2nd | m2 |
| 2 | Major 2nd | M2 |
| 3 | Minor 3rd | m3 |
| 4 | Major 3rd | M3 |
| 5 | Perfect 4th | P4 |
| 6 | Tritone / Diminished 5th | TT/d5 |
| 7 | Perfect 5th | P5 |
| 8 | Minor 6th | m6 |
| 9 | Major 6th | M6 |
| 10 | Minor 7th | m7 |
| 11 | Major 7th | M7 |
| 12 | Perfect Octave | P8 |

The Intervals tab computes distance as `(second − first + 12) % 12`, so it is direction
and octave independent.

### Scales and modes

Eight scales are available, with two notations: a step pattern (`W`/`H`) for beginners and
a numeric formula for degrees.

| Scale | Semitones from root |
| --- | --- |
| Major (Ionian) | 0 2 4 5 7 9 11 |
| Natural Minor (Aeolian) | 0 2 3 5 7 8 10 |
| Minor Pentatonic | 0 3 5 7 10 |
| Blues | 0 3 5 6 7 10 |
| Dorian | 0 2 3 5 7 9 10 |
| Mixolydian | 0 2 4 5 7 9 10 |
| Phrygian | 0 1 3 5 7 8 10 |
| Lydian | 0 2 4 6 7 9 11 |

Notes are derived, never stored: `transposeNote(root, offset)` for each offset.

### Chords

Chords are third-stacks. In the bundled chord formulas:

- Major triad = `1 3 5` (stack `M3 + m3`)
- Minor triad = `1 ♭3 5` (stack `m3 + M3`)
- Diminished triad = `1 ♭3 ♭5` (stack `m3 + m3`)
- Augmented triad = `1 3 ♯5` (stack `M3 + M3`)
- Seventh chords add a `♭7` or `7`, with extensions (9, 11, 13) and alterations (♭9,
  ♯9, ♯11, ♭13) described in the JSON `notes` block.

The 17 playable shapes in `chordsData.ts` each carry notes, interval labels, fret
positions, fingerings, and a difficulty tag.

### Guitar fretboard math

- Fretboard is indexed from low E (string 6) to high E (string 1) in code.
- `getFretNote(string, fret)` = `(openStringPitchClass + fret) % 12`.
- `getFretMidi(string, fret)` = `openStringMidi + fret`.
- Nut notation used throughout the UI: `✕` mute, `○` open, `1`–`4` index–pinky, `T` thumb.
- Fret markers mirror real instruments: 3, 5, 7, 9, 15 single, 12 double.

### Rhythm

- Tempo names follow the traditional Italian bands from **Larghissimo** (20 BPM) to
  **Prestissimo** (200–240 BPM).
- Beat interval = `60000 / bpm` ms.
- Time signatures offered: 2/4, 3/4, 4/4, 6/8, 5/4, 7/8, 1/8.
- The first beat of a measure is accented, matching how a metronome stresses beat one.

## Keeping theory and code in sync

- Prose that explains a concept goes in `music-theory-reference/`.
- Numbers the app renders go in `src/data/*.ts` (and, if they should also be downloadable,
  in `music-theory-reference/04-data/*.json` → `public/data/` via
  `bun scripts/build-pages.ts`).
- If a reference page changes a formula, update the matching TS data and re-run the type
  check.
