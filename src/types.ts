export type NoteName = 'C' | 'C♯' | 'D' | 'D♯' | 'E' | 'F' | 'F♯' | 'G' | 'G♯' | 'A' | 'A♯' | 'B';
export type StringName = NoteName;

export interface ChordShape {
  id: string;
  name: string; // e.g. "C Major"
  root: NoteName;
  type: string; // e.g. "Major", "Minor", "Dominant 7th", "Minor 7th", "Major 7th", "Sus4"
  notes: NoteName[]; // ['C', 'E', 'G']
  intervals: string[]; // ['1', '3', '5']
  // Guitar frets from low E (string 6) to high E (string 1): -1 = muted (x), 0 = open (o), 1-12 = fret number
  frets: number[];
  // Finger positions: 0 = none/open, 1 = index, 2 = middle, 3 = ring, 4 = pinky, 'T' = thumb
  fingers?: (number | string)[];
  capo?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface SafeChordStringInfo {
  name: NoteName;
  octave: number;
  baseMidi: number;
}

export interface SafeChordShape {
  id: string;
  name: string;
  root: NoteName;
  type: string;
  notes: readonly NoteName[];
  intervals: readonly string[];
  frets: readonly number[];
  fingers?: readonly (number | string)[];
  capo?: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ChordShapeSafe extends SafeChordShape {}

export interface SafeGuitarString {
  name: NoteName;
  octave: number;
  baseMidi: number;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  formula: string;
  intervals: readonly number[]; // semitone offsets from root [0, 2, 4, 5, 7, 9, 11]
  shortFormula: readonly string[]; // ['1', '2', '3', '4', '5', '6', '7']
  description: string;
}

export interface IntervalDefinition {
  semitones: number;
  name: string;
  short: string;
  quality: 'perfect' | 'major' | 'minor' | 'tritone';
  description: string;
}

export interface ChordCardItem {
  id: string;
  chord: ChordShape;
  isMuted?: boolean;
  transposeOffset: number; // semitones shift
  voicingOffset?: 0 | 12;
}
