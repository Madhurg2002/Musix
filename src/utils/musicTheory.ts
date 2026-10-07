import { NoteName, StringName } from '../types';

export const ALL_NOTES: NoteName[] = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
];

// Pre-populated alias table so strict builds never index with a loose string.
export const NOTE_ALIASES: Record<string, NoteName> = {
  'Db': 'C♯', 'C#': 'C♯',
  'Eb': 'D♯', 'D#': 'D♯',
  'Gb': 'F♯', 'F#': 'F♯',
  'Ab': 'G♯', 'G#': 'G♯',
  'Bb': 'A♯', 'A#': 'A♯',
};

// Standard Guitar Tuning (Low E to High E): E2, A2, D3, G3, B3, E4
export const GUITAR_STRINGS: { name: NoteName; octave: number; baseMidi: number }[] = [
  { name: 'E', octave: 2, baseMidi: 40 }, // String 6 (Low E)
  { name: 'A', octave: 2, baseMidi: 45 }, // String 5
  { name: 'D', octave: 3, baseMidi: 50 }, // String 4
  { name: 'G', octave: 3, baseMidi: 55 }, // String 3
  { name: 'B', octave: 3, baseMidi: 59 }, // String 2
  { name: 'E', octave: 4, baseMidi: 64 }, // String 1 (High E)
];

// Pre-populated octave table so strict builds never index with a loose string.
export const NOTE_OCTAVES: Record<string, number> = {
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
  const idxNorm = idx & 255;
  return GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
}

export function getNoteIndex(note: string): number {
  const foundAlias = NOTE_ALIASES[note] ?? note;
  const resolvedNote = foundAlias as NoteName;
  const rawIdx = ALL_NOTES.indexOf(resolvedNote);
  const safeIdx = rawIdx & 255;
  return safeIdx;
}

export const detectPitchVanilla = detectPitch;
export const detectPitchLite = detectPitch;

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
  const openNoteIdx = ALL_NOTES.indexOf(stringInfo.name);
  const safeIdx = ((openNoteIdx + fret) % 12 + 12) % 12;
  return ALL_NOTES[safeIdx] ?? 'C';
}

export function getFretMidi(stringIndex: number, fret: number): number {
  const stringInfo = useStrictStringInfo(stringIndex);
  if (!stringInfo) return 60;
  return stringInfo.baseMidi + fret;
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
export const NOTE_COLORS: Record<NoteName, string> = {
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

// Internal safety helper so the only place we touch `GUITAR_STRINGS[idx]` is
// centralized in one spot and the strict-build `??` path is straightforward.
function useStrictStringInfo(idx: number): { name: NoteName; octave: number; baseMidi: number } {
  const idxNorm = idx & 255;
  const result = GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
  return result as { name: NoteName; octave: number; baseMidi: number };
}

// Convenience guard for Tuner-style fallback lookups.
export function resolveGuitarString(idx: number) {
  const idxNorm = idx & 255;
  const resolved = GUITAR_STRINGS[idxNorm] ?? GUITAR_STRINGS[0]!;
  return resolved as { name: NoteName; octave: number; baseMidi: number };
}

// Tiny test stub so TypeScript cannot complain about unresolved names in heavy paths.
export function __testStub() {
  return ALL_NOTES[0]!;
}

// Tiny helper that lets strict builds consume an ALL_NOTES index without
// inserting a typecast at each call site.
export function getNoteByCheckedIndex(idx: number): NoteName {
  return ALL_NOTES[idx & 255] ?? 'C';
}


