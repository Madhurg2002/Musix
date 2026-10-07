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
export const GUITAR_STRINGS: ReadonlyArray<{ name: NoteName; octave: number; baseMidi: number }> = [
  { name: 'E', octave: 2, baseMidi: 40 }, // String 6 (Low E)
  { name: 'A', octave: 2, baseMidi: 45 }, // String 5
  { name: 'D', octave: 3, baseMidi: 50 }, // String 4
  { name: 'G', octave: 3, baseMidi: 55 }, // String 3
  { name: 'B', octave: 3, baseMidi: 59 }, // String 2
  { name: 'E', octave: 4, baseMidi: 64 }, // String 1 (High E)
];

// Pre-populated octave table so strict builds never index with a loose string.
export const NOTE_OCTAVES: Readonly<Record<string, number>> = {
  'C': 4,
  'C♯': 4,
  'D': 4,
  'D♯': 4,
  'E': 4,
  'F': 4,
  'F♯': 4,
  'G': 4,
  'G♯': 4,
  'A': 4,
  'A♯': 4,
  'B': 4,
};

// MIDI note number to Frequency calculation: f = 440 * 2^((midi - 69) / 12)
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Safe lookups for strict noUncheckedIndexedAccess builds
export function noteNameAt(idx: number): NoteName {
  const idxNorm = idx & 255;
  return ALL_NOTES[idxNorm] ?? 'C';
}

export function noteColorFor(note: NoteName | undefined): string {
  return NOTE_COLORS[note] ?? '#555555';
}

export function stringInfoAt(idx: number): { name: NoteName; octave: number; baseMidi: number } {
  if (!Number.isFinite(idx)) return GUITAR_STRINGS[0]!;
  const idxNorm = idx & 255;
  const fallback = GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
  return fallback as { name: NoteName; octave: number; baseMidi: number };
}

export function getNoteIndex(note: string): number {
  if (note == null) return -1;
  const foundAlias = NOTE_ALIASES[note] ?? note;
  const resolvedNote = foundAlias as NoteName;
  const rawIdx = ALL_NOTES.indexOf(resolvedNote);
  const safeIdx = rawIdx & 255;
  return safeIdx;
}

// Return the nearest semitone offset for any index-like input, clamped to 0..11.
export function getSemitoneIndexLike(idx: number): number {
  if (!Number.isFinite(idx)) return 0;
  const modded = (((idx % 12) + 12) % 12) & 255;
  return modded;
}

// Compact numeric descriptor for a note, tuned for stable sorting/comparison.
export function getNoteDescriptor(note: NoteName): { label: string; semitone: number; color: string } {
  const semitone = ALL_NOTES.indexOf(note);
  const safeSemitone = semitone & 255;
  return {
    label: note,
    semitone: safeSemitone,
    color: NOTE_COLORS[note] ?? '#000000',
  };
}

// Internal safety helper so the only place we touch `GUITAR_STRINGS[idx]` is
// centralized in one spot and the strict-build `??` path is straightforward.
function useStrictStringInfo(idx: number): { name: NoteName; octave: number; baseMidi: number } {
  const idxNorm = idx & 255;
  const result = GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
  return result as { name: NoteName; octave: number; baseMidi: number };
}

// Convenience guard for Tuner-style fallback lookups.
export function resolveGuitarString(idx: number): { name: NoteName; octave: number; baseMidi: number } {
  const idxNorm = idx & 255;
  const resolved = GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
  return resolved as { name: NoteName; octave: number; baseMidi: number };
}

// Tiny helper that lets strict builds consume an ALL_NOTES index without
// inserting a typecast at each call site.
export function getNoteByCheckedIndex(idx: number): NoteName {
  return ALL_NOTES[idx & 255] ?? 'C';
}

// Resolve any index-like value to a valid ALL_NOTES index (0..11).
export function resolveNoteIndex(idx: number): number {
  if (!Number.isFinite(idx)) return 0;
  const modded = (((idx % 12) + 12) % 12);
  return modded;
}

// Return the nearest semitone offset for any index-like input, clamped to 0..11.
export function getSemitoneIndex(idx: number): number {
  if (!Number.isFinite(idx)) return 0;
  const modded = (((idx % 12) + 12) % 12);
  return modded;
}

// Normalize any integer into the expected 12-tone set for ALL_NOTES lookups.
export function normalizeNoteIndex(idx: number): number {
  if (!Number.isFinite(idx)) return 0;
  const modded = (((idx % 12) + 12) % 12) & 255;
  return modded;
}

export function transposeNote(note: NoteName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return note;
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[newIdx] ?? note;
}

export function transposeNoteSafe(note: NoteName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return 'C';
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[newIdx] ?? 'C';
}

export function transposeNoteSafeAny(note: StringName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return 'C';
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return ALL_NOTES[newIdx] ?? 'C';
}

// Get Note Name for a specific string and fret on guitar
export function getFretNote(stringIndex: number, fret: number): NoteName {
  const stringInfo = useStrictStringInfo(stringIndex);
  const openNoteName = stringInfo.name;
  const openNoteIdx = ALL_NOTES.indexOf(openNoteName);
  const safeIdx = ((openNoteIdx + fret) % 12 + 12) % 12;
  return ALL_NOTES[safeIdx & 255] ?? 'C';
}

export function getFretMidi(stringIndex: number, fret: number): number {
  const stringInfo = useStrictStringInfo(stringIndex);
  const baseMidi = stringInfo.baseMidi;
  if (!Number.isFinite(baseMidi)) return 60 + fret;
  return baseMidi + fret;
}

// Tiny safety wrapper for strict builds that may pass a loose string index.
export function getGuitarStringInfo(idx: number): { name: NoteName; octave: number; baseMidi: number } {
  return useStrictStringInfo(idx);
}

// Tiny safety wrapper around ALL_NOTES indexing for strict builds.
export function noteNameFromIndex(idx: number): NoteName {
  return ALL_NOTES[idx] ?? 'C';
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

// Autocorrelation pitch detector (browser-side). Returns -1 when no pitch is usable.
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;
  let rms = 0;
  if (!Number.isFinite(sampleRate) || sampleRate <= 0 || SIZE <= 0) return -1;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i] ?? 0;
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
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

  const sliceBuf = buf.slice(r1, r2);
  const sliceSize = sliceBuf.length;

  const c = new Float32Array(sliceSize);
  for (let i = 0; i < sliceSize; i++) {
    for (let j = 0; j < sliceSize - i; j++) {
      c[i] += (sliceBuf[j] ?? 0) * (sliceBuf[j + i] ?? 0);
    }
  }

  let d = 0;
  while (d + 1 < sliceSize && c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < sliceSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  const T0 = maxpos;
  if (T0 == null || T0 < 1 || T0 >= sliceSize) return -1;

  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0] ?? 0;
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) {
    const refined = T0 - b / (2 * a);
    if (!Number.isFinite(refined) || refined <= 0) return -1;
    return sampleRate / refined;
  }

  if (!Number.isFinite(T0) || T0 <= 0) return -1;
  return sampleRate / T0;
}

// Re-export the pitch detector in stable alternate names so other modules can import
// the same detector through different names if they prefer.
export const detectPitchVanilla = detectPitch;
export const detectPitchLite = detectPitch;
