import { NoteName, StringName } from '../types';

export const ALL_NOTES: NoteName[] = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
];

// Pre-populated alias table so strict builds never index with a loose string.
export const NOTE_ALIASES: Readonly<Record<string, NoteName>> = {
  'Db': 'C♯', 'C#': 'C♯',
  'Eb': 'D♯', 'D#': 'D♯',
  'Gb': 'F♯', 'F#': 'F♯',
  'Ab': 'G♯', 'G#': 'G♯',
  'Bb': 'A♯', 'A#': 'A♯',
};

// Standard Guitar Tuning (Low E to High E): E2, A2, D3, G3, B3, E4
export const GUITAR_STRINGS: ReadonlyArray<GuitarStringInfo> = [
  { name: 'E', octave: 2, baseMidi: 40 }, // String 6 (Low E)
  { name: 'A', octave: 2, baseMidi: 45 }, // String 5
  { name: 'D', octave: 3, baseMidi: 50 }, // String 4
  { name: 'G', octave: 3, baseMidi: 55 }, // String 3
  { name: 'B', octave: 3, baseMidi: 59 }, // String 2
  { name: 'E', octave: 4, baseMidi: 64 }, // String 1 (High E)
];

// MIDI note number to Frequency calculation: f = 440 * 2^((midi - 69) / 12)
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/* ---------------------------------------------------------------------------------------
 * Safe lookups for strict noUncheckedIndexedAccess builds.
 *
 * There is one helper per shape rather than a family of aliases: `noteNameAt` for pitch
 * classes and `stringInfoAt` for guitar strings. The old `getNoteByCheckedIndex`,
 * `noteNameFromIndex`, `getGuitarStringInfo`, and `resolveGuitarString` were byte-for-byte
 * duplicates of these two and were removed so call sites have one obvious choice.
 * ------------------------------------------------------------------------------------- */

/** Pitch class at a (possibly out-of-range) index, wrapped into the octave. */
export function noteNameAt(idx: number): NoteName {
  if (!Number.isFinite(idx)) return 'C';
  const normalized = ((Math.trunc(idx) % 12) + 12) % 12;
  return ALL_NOTES[normalized] ?? 'C';
}

export function noteColorFor(note: NoteName | undefined): string {
  if (note == null) return '#555555';
  return NOTE_COLORS[note] ?? '#555555';
}

/** Tuning of a guitar string. Anything out of range clamps to the lowest string. */
export function stringInfoAt(idx: number): GuitarStringInfo {
  if (!Number.isFinite(idx)) return GUITAR_STRINGS[0]!;
  return GUITAR_STRINGS[Math.trunc(idx)] ?? GUITAR_STRINGS[0]!;
}

/** Tuning entry for one of the six strings. */
export type GuitarStringInfo = { name: NoteName; octave: number; baseMidi: number };

export function getNoteIndex(note: string): number {
  if (note == null) return -1;
  const aliasedNote = NOTE_ALIASES[note] ?? (note as NoteName | undefined);
  if (aliasedNote == null) return -1;
  // indexOf already reports unknown notes as -1, so do not mask the result here:
  // a bitmask would turn the "not found" sentinel into 255.
  return ALL_NOTES.indexOf(aliasedNote);
}

// Return the nearest semitone offset for any index-like input, clamped to 0..11.
export function getSemitoneIndexLike(idx: number): number {
  if (!Number.isFinite(idx)) return 0;
  const modded = (((idx % 12) + 12) % 12) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  return modded;
}

// Compact numeric descriptor for a note, tuned for stable sorting/comparison.
export function getNoteDescriptor(note: NoteName): { label: string; semitone: number; color: string } {
  // No bitmask here: `indexOf` reports an unknown note as -1, and masking that sentinel
  // would fabricate semitone 255 (the same trap called out in `getNoteIndex` above).
  const semitone = ALL_NOTES.indexOf(note);
  return {
    label: note,
    semitone,
    color: NOTE_COLORS[note] ?? '#000000',
  };
}

// Color badges for notes so users easily distinguish pitch classes visually
export const NOTE_COLORS: Readonly<Record<NoteName, string>> = {
  'C': '#FF5733',   // Red-Orange
  'C♯': '#FF8D33',  // Orange
  'D': '#FFC300',   // Amber
  'D♯': '#D4AC0D',  // Yellow-Gold
  'E': '#28B463',   // Emerald Green
  'F': '#17A589',   // Teal
  'F♯': '#1ABC9C',  // Cyan-Turquoise
  'G': '#2980B9',   // Ocean Blue
  'G♯': '#5B2C6F',  // Indigo
  'A': '#8E44AD',   // Purple
  'A♯': '#C0392B',  // Crimson
  'B': '#E74C3C',   // Bright Red
};

/**
 * Readable label ink for a chip or pill filled with one of the `NOTE_COLORS` hues.
 *
 * The note hues are theme-independent, so no palette token can track them — instead pick
 * the better of black and white by WCAG contrast. Every hue clears AA (4.5:1) this way:
 * black wins on the bright hues (13.1:1 on D's amber) and white on the dark ones (10.3:1
 * on G♯'s indigo, where black would be an unreadable 2.0:1).
 */
export function inkOnNoteColor(hex: string): '#000000' | '#ffffff' {
  const channel = (index: number): number => {
    const c = parseInt(hex.slice(index, index + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return (luminance + 0.05) / 0.05 >= 1.05 / (luminance + 0.05) ? '#000000' : '#ffffff';
}

// Transpose a pitch class by a number of semitones.
export function transposeNote(note: NoteName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return note;
  const newIdx = (((idx + semitones) % 12) + 12) % 12;
  return ALL_NOTES[newIdx] ?? note;
}

export function transposeNoteSafe(note: NoteName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return 'C';
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[newIdx] ?? 'C';
}

export function transposeNoteSafeAny(note: StringName, semitones: number): NoteName {
  // Resolve enharmonic spellings (Db, C#, ...) before transposing so callers can pass
  // either the canonical name or a common alias.
  const resolved = NOTE_ALIASES[note] ?? note;
  const idx = ALL_NOTES.indexOf(resolved);
  if (idx === -1) return 'C';
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[newIdx] ?? 'C';
}

// Get Note Name for a specific string and fret on guitar
export function getFretNote(stringIndex: number, fret: number): NoteName {
  const stringInfo = stringInfoAt(stringIndex);
  const openNoteName = stringInfo.name;
  const openNoteIdx = ALL_NOTES.indexOf(openNoteName);
  const safeIdx = ((openNoteIdx + fret) % 12 + 12) % 12;
  return ALL_NOTES[safeIdx] ?? 'C';
}

export function getFretMidi(stringIndex: number, fret: number): number {
  const stringInfo = stringInfoAt(stringIndex);
  const baseMidi = stringInfo.baseMidi;
  if (!Number.isFinite(baseMidi)) return 60 + fret;
  return baseMidi + fret;
}

/** One place a pitch can be played: a string index (0 = low E) and a fret. */
export interface FretPosition {
  stringIndex: number;
  fret: number;
}

/**
 * Every (string, fret) at or below `maxFret` that sounds `midi` — the inverse of
 * `getFretMidi`. This is what turns a detected pitch into "you are playing fret N":
 * one pitch has several homes on the neck (E4 = open high E, string 2 fret 5,
 * string 3 fret 9), and a live detector cannot know which string was plucked, so
 * callers highlight all of them at once.
 *
 * Results are ordered low string → high string, each entry's fret ascending.
 */
export function fretPositionsForMidi(
  midi: number,
  strings: readonly { baseMidi: number }[] = GUITAR_STRINGS,
  maxFret = 12
): FretPosition[] {
  if (!Number.isFinite(midi)) return [];
  const target = Math.round(midi);
  const hits: FretPosition[] = [];
  strings.forEach((string, stringIndex) => {
    const fret = target - string.baseMidi;
    if (fret >= 0 && fret <= maxFret) hits.push({ stringIndex, fret });
  });
  return hits;
}

/**
 * RMS loudness of a time-domain window — the gate `detectPitch` runs on, exported so the
 * microphone loop can drive an input-level meter from exactly the number detection used.
 */
export function computeRms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) {
    const val = buf[i] ?? 0;
    sum += val * val;
  }
  return Math.sqrt(sum / buf.length);
}

// Pooled correlation scratch buffer (docs/BUGS.md P2): this detector runs ~60×/s while
// a mic path listens, and allocating a fresh Float32Array every call made garbage
// collection the busiest thread on the page. Only entries below `sliceSize` are read,
// so a larger pooled array is safe; analysis order and results are unchanged.
let pooledCorrelation: Float32Array | null = null;

/**
 * Autocorrelation pitch detector (browser-side). Returns -1 when no pitch is usable.
 *
 * This is the **single** detector in the app: the tuner imports it instead of keeping its
 * own copy, so the microphone path and any future consumer cannot drift apart.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || SIZE <= 0) return -1;

  const rms = computeRms(buf);
  if (rms < 0.012) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i] ?? 0) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i] ?? 0) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  // Silence-trimmed window read straight from `buf` (r1..r2) — no slice copy — with the
  // correlation scratch reused across calls.
  const sliceSize = r2 - r1;
  if (sliceSize < 2) return -1;

  if (pooledCorrelation === null || pooledCorrelation.length < sliceSize) {
    pooledCorrelation = new Float32Array(sliceSize);
  }
  const c = pooledCorrelation;
  for (let i = 0; i < sliceSize; i++) {
    let sum = 0;
    const limit = sliceSize - i;
    for (let j = 0; j < limit; j++) {
      sum += (buf[r1 + j] ?? 0) * (buf[r1 + j + i] ?? 0);
    }
    c[i] = sum;
  }

  let d = 0;
  while (d + 1 < sliceSize && (c[d] ?? 0) > (c[d + 1] ?? 0)) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < sliceSize; i++) {
    const cAtI = c[i] ?? 0;
    if (cAtI > maxval) {
      maxval = cAtI;
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (T0 == null || T0 < 1 || T0 >= sliceSize) return -1;

  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0] ?? 0;
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate / T0;
}
