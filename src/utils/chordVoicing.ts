// Chord voicing maths, pulled out of the chord studio so it can be reasoned about and
// tested without a DOM.
//
// Three separate concerns live here:
//   1. `getChordPosition` — which fret to press on each string for a requested position.
//   2. `fretWindow` — which slice of the neck a voicing should be drawn in.
//   3. `transposeChordShape` — how a card changes when the learner shifts its key.

import type { ChordShape, NoteName, SafeChordShape } from '../types';
import { ALL_NOTES, GUITAR_STRINGS, getFretMidi, transposeNote } from './musicTheory';
import { asSafeChord, findChord } from '../data/chordsData';

export interface ChordPosition {
  frets: number[];
  fingers: (number | string | undefined)[];
}

/**
 * Frets and fingers for a voicing placed around `position`.
 *
 * - `0` means "as written": the shape's own frets are returned untouched.
 * - Anything else searches a five-fret window centred on the requested position for each
 *   string, keeping only notes that belong to the chord. Strings with no chord tone in the
 *   window come back as `-1` (muted) rather than an arbitrary fret.
 */
export function getChordPosition(chord: ChordShape, position: number): ChordPosition {
  const safeChord = asSafeChord(chord);

  if (position === 0) {
    return {
      frets: [...safeChord.frets],
      fingers: safeChord.frets.map((_, index) => safeChord.fingers?.[index]),
    };
  }

  const chordNotes = safeChord.notes
    .map((note) => ALL_NOTES.indexOf(note))
    .filter((note) => note >= 0);
  const chordNoteSet = new Set(chordNotes);
  const minimumFret = Math.max(0, position - 2);
  const maximumFret = Math.min(20, position + 2);

  const frets = GUITAR_STRINGS.map((_, stringIndex) => {
    const preferredNote = chordNotes[stringIndex % chordNotes.length];
    let bestFret = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let fret = minimumFret; fret <= maximumFret; fret += 1) {
      const note = getFretMidi(stringIndex, fret) % 12;
      if (!chordNoteSet.has(note)) continue;

      const score = Math.abs(fret - position) + (note === preferredNote ? 0 : 0.25);
      if (score < bestScore) {
        bestFret = fret;
        bestScore = score;
      }
    }

    return bestFret;
  });

  const pressedFrets = [...new Set(frets.filter((fret) => fret > 0))].sort(
    (left, right) => left - right
  );
  const fingers = frets.map((fret) =>
    fret <= 0 ? 0 : Math.min(pressedFrets.indexOf(fret) + 1, 4)
  );

  return { frets, fingers };
}

export interface FretWindow {
  /** Lowest fret drawn in the diagram. */
  firstFret: number;
  /** How many fret columns to draw. Always at least five. */
  fretCount: number;
  /** The fret numbers, in order, for the column headings. */
  fretNumbers: number[];
}

/**
 * The slice of neck a diagram should show: the open position when everything is within the
 * first five frets, otherwise a five-fret window anchored to the shape.
 */
export function fretWindow(frets: readonly number[]): FretWindow {
  const pressedFrets = frets.filter((fret) => fret > 0);
  const lowestFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 1;
  const highestFret = pressedFrets.length > 0 ? Math.max(...pressedFrets) : 0;

  const firstFret =
    highestFret > 5 ? (highestFret - lowestFret > 4 ? lowestFret : highestFret - 4) : 1;
  const fretCount = Math.max(5, highestFret - firstFret + 1);

  return {
    firstFret,
    fretCount,
    fretNumbers: Array.from({ length: fretCount }, (_, index) => firstFret + index),
  };
}

export interface TransposedChord {
  /** The chord to render on the card. */
  chord: ChordShape;
  /** Semitones still to shift at playback time (0 when a real shape was found). */
  transposeOffset: number;
  /** True when a stored shape for the new root was found and used. */
  usedStoredShape: boolean;
}

/**
 * Shift a chord card by `delta` semitones.
 *
 * The bug this replaces transposed only the name and notes, leaving the original frets in
 * place, so a transposed card showed the wrong shape and played the wrong voicing. When the
 * table has a shape for the new root, that shape is used and the playback offset resets;
 * when it does not, the notes are transposed and the offset is kept so playback still
 * matches what the card says.
 */
export function transposeChordShape(
  chord: ChordShape,
  delta: number,
  currentOffset = 0
): TransposedChord {
  const nextOffset = currentOffset + delta;
  const newRoot: NoteName = transposeNote(chord.root, delta);

  const stored = findChord(newRoot, chord.type);
  if (stored) {
    return { chord: { ...stored }, transposeOffset: 0, usedStoredShape: true };
  }

  const safeChord: SafeChordShape = asSafeChord(chord);
  return {
    chord: {
      ...chord,
      root: newRoot,
      name: `${newRoot} ${chord.type}`,
      notes: safeChord.notes.map((note) => transposeNote(note, delta)),
    },
    transposeOffset: nextOffset,
    usedStoredShape: false,
  };
}
