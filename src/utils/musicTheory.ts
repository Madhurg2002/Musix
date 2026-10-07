import { NoteName } from '../types';

export const ALL_NOTES: NoteName[] = [
  'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'
];

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

// MIDI note number to Frequency calculation: f = 440 * 2^((midi - 69) / 12)
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getNoteIndex(note: string): number {
  const normalized = NOTE_ALIASES[note] || note;
  return ALL_NOTES.indexOf(normalized as NoteName);
}

export function transposeNote(note: NoteName, semitones: number): NoteName {
  const idx = ALL_NOTES.indexOf(note);
  if (idx === -1) return note;
  const newIdx = (idx + semitones + 1200) % 12;
  return ALL_NOTES[newIdx];
}

// Get Note Name for a specific string and fret on guitar
export function getFretNote(stringIndex: number, fret: number): NoteName {
  const stringInfo = GUITAR_STRINGS[stringIndex];
  if (!stringInfo) return 'C';
  const openNoteIdx = ALL_NOTES.indexOf(stringInfo.name);
  return ALL_NOTES[(openNoteIdx + fret) % 12];
}

export function getFretMidi(stringIndex: number, fret: number): number {
  const stringInfo = GUITAR_STRINGS[stringIndex];
  if (!stringInfo) return 60;
  return stringInfo.baseMidi + fret;
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
