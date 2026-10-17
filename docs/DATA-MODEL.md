# Data Model

The complete shape of every piece of data in Musix: shared TypeScript interfaces, the TS
data files the app imports, and the bundled JSON copies in `public/data/`.

## Shared types (`src/types.ts`)

### `NoteName`

```ts
type NoteName =
  | 'C' | 'C♯' | 'D' | 'D♯' | 'E' | 'F'
  | 'F♯' | 'G' | 'G♯' | 'A' | 'A♯' | 'B';
```

Note names use the Unicode sharp `♯`, not `#`. Flat spellings (`Db`, `Eb`, …) and ASCII
sharps (`C#`, …) are mapped to these canonical names by `NOTE_ALIASES`.

`StringName` is an alias of `NoteName`.

### `ChordShape`

```ts
interface ChordShape {
  id: string;                 // 'c-major'
  name: string;               // 'C Major'
  root: NoteName;             // 'C'
  type: string;               // 'Major' | 'Minor' | '7th' | 'Major 7th' | ...
  notes: NoteName[];          // ['C', 'E', 'G']
  intervals: string[];        // ['1', '3', '5']
  frets: number[];            // 6 values, low E → high E
  fingers?: (number | string)[];
  capo?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}
```

- `frets`: `-1` = muted (`✕`), `0` = open (`○`), `1..n` = fret number. Order is string 6
  (low E) to string 1 (high E).
- `fingers`: `0` = open/none, `1`–`4` = index→pinky, `'T'` = thumb. May contain `'x'`
  for muted strings in the data.

### Safe variants

`SafeChordShape` mirrors `ChordShape` with `readonly` arrays and non-optional fields;
`SafeChordStringInfo`, `SafeGuitarString`, and `ChordShapeSafe` do the same for string
info. These exist because `noUncheckedIndexedAccess` is on, and `asSafeChord()` narrows a
possibly-missing chord into a guaranteed one.

### `ScaleDefinition`

```ts
interface ScaleDefinition {
  id: string;                          // 'dorian'
  name: string;                        // 'Dorian Mode'
  formula: string;                     // 'W - H - W - W - W - H - W'
  intervals: readonly number[];        // [0, 2, 3, 5, 7, 9, 10]
  shortFormula: readonly string[];     // ['1','2','♭3','4','5','6','♭7']
  description: string;
}
```

`intervals` are semitone offsets from the root, so scale notes are computed as
`intervals.map(semi => transposeNote(root, semi))`.

### `IntervalDefinition`

```ts
interface IntervalDefinition {
  semitones: number;                       // 0..12
  name: string;                            // 'Minor 3rd'
  short: string;                           // 'm3'
  quality: 'perfect' | 'major' | 'minor' | 'tritone';
  description: string;
}
```

### `ChordCardItem`

```ts
interface ChordCardItem {
  id: string;                 // 'card-1' or crypto.randomUUID()
  chord: ChordShape;
  isMuted?: boolean;
  transposeOffset: number;    // semitones shifted from the original chord
  fretPosition?: number;      // 0 = original voicing, 1..20 = generated near that fret
}
```

This is the per-card state held by `ChordWorkbench`.

### Saved progressions (`src/utils/savedProgressions.ts`)

What the studio writes so a set survives a reload. Only the **choices** are stored — never
frets, fingers, note names or difficulty — so a saved progression picks up a corrected shape
from the table when it is reopened.

```ts
interface SavedCardItem {
  root: NoteName;
  type: string;              // 'Major' | 'Minor' | '7th' | 'Major 7th'
  fretPosition?: number;     // omitted at the written position
  isMuted?: boolean;         // omitted when false
}

interface SavedProgression {
  id: string;
  name: string;              // trimmed, 1..40 characters, unique case-insensitively
  key: NoteName;             // the key its chart numerals are read in
  cards: SavedCardItem[];    // order preserved, 1..64
  savedAt: number;           // epoch ms
}

interface StudioBoard { key: NoteName; cards: SavedCardItem[] }  // may be empty
```

Both live in the preference store (`PREFERENCE_KEYS.savedProgressions` and
`.studioBoard`), so they follow the same consent gate as every other preference: nothing is
written before the learner allows storage. A library too big for a cookie moves to
`localStorage` automatically. `saveProgression` overwrites an entry with the same name
(case-insensitively) rather than duplicating it, and the library is capped at
`MAX_SAVED_PROGRESSIONS`.

---

## TypeScript data files (bundled by Vite)

### `src/data/chordsData.ts`

`COMPREHENSIVE_CHORDS` — 22 chords in this order. All twelve major roots are present; the
five added barres (C♯, D♯, F♯, G♯, A♯) are the A-shape or E-shape moved to the root's fret,
which is what makes transposing a card a lookup instead of a guess.

**Ordering rule:** chromatically by root (C, C♯, D … B), and inside a root
Major → Minor → 7th → Major 7th. The Fretboard picker renders this array, so the storage
order *is* what a learner reads; it used to run C Major, C Minor, C♯ Major, C7, A … which
made the picker look shuffled. `chordVoicing.test.ts` pins the order with the expected list
of names, so a new chord has to be inserted in the right place.

**Verification:** every entry was re-checked against its own name — the frets sound the
chord's tones and nothing else, the declared `notes` match the frets, the pressed span is
never more than four frets, finger numbers rise with the frets, ids/root+type pairs are
unique, and the difficulty badge agrees with whether the shape is barred. One shape
intentionally omits a tone: `c-dom7` (`x32310`) drops the fifth, the standard lean C7 grip.

**Naming rule:** every `name` is `chordDisplayName(root, type)` — `C Major`, `C Minor`,
`C7`, `Cmaj7` — and never carries the grip. "Barre" is a property of the fingering, not the
chord, so it is detected from `frets` + `fingers` by `detectBarre` and shown as a chip on the
diagram. Before this, five stored shapes said "(Barre)" and B Major's did not, so the same
chord was titled two ways depending on whether it came from the table or a transpose.

| # | id | name | root | type | frets | difficulty |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | `c-major` | C Major | C | Major | `-1 3 2 0 1 0` | Beginner |
| 1 | `c-minor` | C Minor | C | Minor | `-1 3 5 5 4 3` | Intermediate |
| 2 | `c-dom7` | C7 | C | 7th | `-1 3 2 3 1 0` | Beginner |
| 3 | `c-maj7` | Cmaj7 | C | Major 7th | `-1 3 2 0 0 0` | Beginner |
| 4 | `c-sharp-major` | C♯ Major | C♯ | Major | `-1 4 6 6 6 4` | Intermediate |
| 5 | `d-major` | D Major | D | Major | `-1 -1 0 2 3 2` | Beginner |
| 6 | `d-minor` | D Minor | D | Minor | `-1 -1 0 2 3 1` | Beginner |
| 7 | `d-sharp-major` | D♯ Major | D♯ | Major | `-1 6 8 8 8 6` | Intermediate |
| 8 | `e-major` | E Major | E | Major | `0 2 2 1 0 0` | Beginner |
| 9 | `e-minor` | E Minor | E | Minor | `0 2 2 0 0 0` | Beginner |
| 10 | `f-major` | F Major | F | Major | `1 3 3 2 1 1` | Intermediate |
| 11 | `f-sharp-major` | F♯ Major | F♯ | Major | `2 4 4 3 2 2` | Intermediate |
| 12 | `g-major` | G Major | G | Major | `3 2 0 0 0 3` | Beginner |
| 13 | `g-minor` | G Minor | G | Minor | `3 5 5 3 3 3` | Intermediate |
| 14 | `g-dom7` | G7 | G | 7th | `3 2 0 0 0 1` | Beginner |
| 15 | `g-sharp-major` | G♯ Major | G♯ | Major | `4 6 6 5 4 4` | Intermediate |
| 16 | `a-major` | A Major | A | Major | `-1 0 2 2 2 0` | Beginner |
| 17 | `a-minor` | A Minor | A | Minor | `-1 0 2 2 1 0` | Beginner |
| 18 | `a-dom7` | A7 | A | 7th | `-1 0 2 0 2 0` | Beginner |
| 19 | `a-sharp-major` | A♯ Major | A♯ | Major | `-1 1 3 3 3 1` | Intermediate |
| 20 | `b-major` | B Major | B | Major | `-1 2 4 4 4 2` | Intermediate |
| 21 | `b-minor` | B Minor | B | Minor | `-1 2 4 4 3 2` | Intermediate |

Helpers:

- `chordDisplayName(root, type)` — the single spelling of a chord name, used by the stored
  table, the derived fallback, and `transposeChordShape`, so a chord cannot be titled one way
  in the data and another on a card.
- `findChord(root, type)` — a stored shape, or `undefined` (case-insensitive on `type`).
- `findOrCreateChord(root, type)` — a stored shape when there is one; otherwise a chord whose
  notes and interval labels are derived from the quality stack in `QUALITY_STACKS`
  (Major, Minor, 7th, Major 7th) and whose `frets` stay **empty**, so the fret grid voices
  those notes instead of drawing a grip that belongs to a different chord. An unknown type
  keeps the single-note `[root]` placeholder.
- `asSafeChord(chord)` — normalizes `undefined`/`null` into a C Major shape.

### `src/data/scalesData.ts`

`COMPREHENSIVE_SCALES` — 8 entries:

| id | name | intervals | shortFormula |
| --- | --- | --- | --- |
| `major` | Major (Ionian) | 0,2,4,5,7,9,11 | 1 2 3 4 5 6 7 |
| `minor` | Natural Minor (Aeolian) | 0,2,3,5,7,8,10 | 1 2 ♭3 4 5 ♭6 ♭7 |
| `pentatonic-minor` | Minor Pentatonic | 0,3,5,7,10 | 1 ♭3 4 5 ♭7 |
| `blues` | Blues Scale | 0,3,5,6,7,10 | 1 ♭3 4 ♭5 5 ♭7 |
| `dorian` | Dorian Mode | 0,2,3,5,7,9,10 | 1 2 ♭3 4 5 6 ♭7 |
| `mixolydian` | Mixolydian Mode | 0,2,4,5,7,9,10 | 1 2 3 4 5 6 ♭7 |
| `phrygian` | Phrygian Mode | 0,1,3,5,7,8,10 | 1 ♭2 ♭3 4 5 ♭6 ♭7 |
| `lydian` | Lydian Mode | 0,2,4,6,7,9,11 | 1 2 3 ♯4 5 6 7 |

`COMPREHENSIVE_INTERVALS` — 13 entries from 0 semitones (Perfect Unison) to 12 semitones
(Perfect Octave), each with `short` and `quality`:

`0 P1 perfect · 1 m2 minor · 2 M2 major · 3 m3 minor · 4 M3 major · 5 P4 perfect ·
6 TT/d5 tritone · 7 P5 perfect · 8 m6 minor · 9 M6 major · 10 m7 minor · 11 M7 major ·
12 P8 perfect`

### `src/utils/musicTheory.ts`

Static tables exported to the rest of the app:

- `ALL_NOTES` — the 12 canonical pitch classes in order starting at C.
- `NOTE_ALIASES` — `Db→C♯`, `C#→C♯`, `Eb→D♯`, `D#→D♯`, `Gb→F♯`, `F#→F♯`, `Ab→G♯`,
  `G#→G♯`, `Bb→A♯`, `A#→A♯`.
- `GUITAR_STRINGS` — string 6→1: `E2 (40)`, `A2 (45)`, `D3 (50)`, `G3 (55)`, `B3 (59)`,
  `E4 (64)`.
- `NOTE_COLORS` — one hex color per pitch class (`C #FF5733` … `B #E74C3C`).

---

## Bundled JSON (`public/data/`)

These files mirror `music-theory-reference/04-data/` and are copied by
`scripts/build-pages.ts`. They are not imported by the React app directly.

### `intervals.json`

```json
{ "intervals": [ { "name", "shortCode", "semitones", "quantity",
                   "quality", "frequencyRatioJust", "frequencyRatio12Tet",
                   "cents12Tet" } ] }
```

13 entries. Adds just-intonation ratios (e.g. `3:2`), 12-TET ratios
(e.g. `1.498307077`), and cents (700) beyond what the TS interval data carries.

### `scale-formulas.json`

```json
{ "scales": [ { "id", "name", "formula": ["1","2","3"],
                "semitones": [0,2,4], "stepPattern": ["W","W","H"],
                "parentScale": null, "modeIndex": 0 } ] }
```

12 entries: the 7 modes plus pentatonic and blues variants. `parentScale` and
`modeIndex` record how each mode derives from the major scale.

### `chord-formulas.json`

```json
{
  "chords": [ { "id", "name", "formula", "semitones",
                "stack", "quality", "diatonicInMajor", "diatonicInMinor" } ],
  "notes": { "diatonicStackingLogic", "extensionLogic", "alterationLogic" }
}
```

10 chords built as third-stacks (e.g. `["M3","m3"]` for a major triad) with their
diatonic function in major and minor keys, plus three prose blocks explaining how
extensions and alterations are derived.

### `guitar-fretboard-map.json`

```json
{
  "meta": {
    "version": 1,
    "referencePitch": { "name": "A4", "midi": 69, "frequencyHz": 440.0 },
    "temperament": "12-TET",
    "stringsHighToLow": [ { "string": 1, "tuningToken": "E4" }, ... ],
    "fretRange": { "min": 0, "max": 24 }
  },
  "byString": { "1": [ /* 25 entries, fret 0..24 */ ], ... "6": [...] },
  "coordinateIndex": { "1,0": { ... }, ... }   // 150 entries (6 strings × 25 frets)
}
```

Each coordinate entry:

```json
{ "string": 1, "fret": 0, "note": "E", "scientificPitch": "E4",
  "midi": 64, "frequencyHz": 329.63 }
```

`byString` groups coordinates per string; `coordinateIndex` keys them `"string,fret"` for
direct lookup. Generated by `music-theory-reference/scripts/generate_fretboard_data.py`.

---

## Where to change data

| Goal | Edit |
| --- | --- |
| Add a chord to the picker / studio | `src/data/chordsData.ts` |
| Add a scale or mode | `src/data/scalesData.ts` |
| Add an interval | `src/data/scalesData.ts` |
| Change note colors or aliases | `src/utils/musicTheory.ts` |
| Change tuning presets | `TUNING_PRESETS` in `src/utils/tunings.ts` (saved custom tunings live in `localStorage` under `musix.tuner.customs`; A4/capo under `musix.tuner.settings`) |
| Update the bundled JSON copy | `music-theory-reference/04-data/` then `bun scripts/build-pages.ts` |
| Add prose theory notes | `music-theory-reference/01-foundations/` or `02-harmony-and-analysis/` |
