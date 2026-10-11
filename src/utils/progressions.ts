// Named chord progressions for the Chord Studio's progression builder.
//
// A preset is a list of scale-degree offsets from a key root; resolving one turns it into
// the chord cards the studio already knows how to draw, transpose, and play. Keeping the
// resolver pure (no component state, no sound) means the presets can be unit tested and
// the component only decides when to load them.

import { ChordCardItem, NoteName } from '../types';
import { findOrCreateChord } from '../data/chordsData';
import { ALL_NOTES } from './musicTheory';

/** One step of a preset: semitones above the key root, and the chord quality on it. */
export interface ProgressionDegree {
  offset: number;
  type: string;
}

export interface ProgressionPreset {
  /** Stable id — used as the React key and in the loaded cards' ids. */
  id: string;
  /** Display name, written with the numerals learners see in theory books. */
  name: string;
  /** Tooltip: says what loading this preset does. */
  tip: string;
  degrees: readonly ProgressionDegree[];
}

/**
 * The three presets the plan named. Offsets follow the major scale
 * (I=0, ii=2, iii=4, IV=5, V=7, vi=9, vii=11), so changing the key re-roots every chord.
 */
export const PROGRESSION_PRESETS: readonly ProgressionPreset[] = [
  {
    id: '1564',
    name: 'I–V–vi–IV',
    tip: 'Load the pop progression — the sound of a thousand songs',
    degrees: [
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
      { offset: 9, type: 'Minor' },
      { offset: 5, type: 'Major' },
    ],
  },
  {
    id: '251',
    name: 'ii–V–I',
    tip: 'Load the jazz turnaround that resolves back home',
    degrees: [
      { offset: 2, type: 'Minor' },
      { offset: 7, type: 'Major' },
      { offset: 0, type: 'Major' },
    ],
  },
  {
    id: '12bar',
    name: '12-bar blues',
    tip: 'Load twelve bars of I, IV and V',
    degrees: [
      // | I  I  I  I | IV IV I  I | V  IV I  V  |
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
    ],
  },
];

/** The note `offset` semitones above `key`, wrapping at the octave. */
export function rotateRoot(key: NoteName, offset: number): NoteName {
  const index = ALL_NOTES.indexOf(key);
  if (index < 0) return key;
  // +144 keeps every realistic negative offset inside one add-and-modulo.
  return ALL_NOTES[(index + offset + 144) % 12]!;
}

/**
 * Turn a preset into the studio's card items, ready to drop into state. Ids are stable
 * per preset step so React reuses the card nodes when the same preset is re-loaded in a
 * different key.
 */
export function resolveProgression(
  preset: ProgressionPreset,
  key: NoteName
): ChordCardItem[] {
  return preset.degrees.map((degree, index) => ({
    id: `prog-${preset.id}-${index}`,
    chord: findOrCreateChord(rotateRoot(key, degree.offset), degree.type),
    transposeOffset: 0,
    fretPosition: 0,
  }));
}
