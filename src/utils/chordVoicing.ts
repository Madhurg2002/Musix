// Chord voicing maths, pulled out of the chord studio so it can be reasoned about and
// tested without a DOM.
//
// Five separate concerns live here:
//   1. `chordPositionForStrings` / `getChordPosition` — which fret to press on each
//      string of any fretted instrument for a requested position.
//   2. `fretWindow` — which slice of the neck a voicing should be drawn in.
//   3. `keyboardMidis` — the close voicing a keyboard instrument plays.
//   4. `chordFrequencies` — the exact frequencies one card plays, per instrument.
//   5. `transposeChordShape` — how a card changes when the learner shifts its key.

import type { ChordShape, NoteName, SafeChordShape } from '../types';
import { ALL_NOTES, GUITAR_STRINGS, midiToFrequency, transposeNote } from './musicTheory';
import { asSafeChord, findChord } from '../data/chordsData';
import type { InstrumentDefinition, InstrumentString } from '../data/instruments';

/** Tuning table — the same shape as the registry's `strings` and as `GUITAR_STRINGS`. */
export type Tuning = readonly InstrumentString[];

export interface ChordPosition {
  frets: number[];
  fingers: (number | string | undefined)[];
  /** True when `frets` are the stored shape played as written, not a searched voicing. */
  usedStoredShape: boolean;
}

/**
 * True when `strings` is standard guitar tuning — the only tuning the stored shapes in
 * `chordsData.ts` were written for. On any other tuning (bass, ukulele) a six-string
 * guitar shape does not exist, so the voicing is always searched. Callers outside this
 * module use it to tell "as written" affordances from searched ones.
 */
export function isStandardGuitarTuning(strings: Tuning): boolean {
  return (
    strings.length === GUITAR_STRINGS.length &&
    strings.every((string, index) => string.baseMidi === GUITAR_STRINGS[index]?.baseMidi)
  );
}

/**
 * Frets and fingers for a voicing placed around `position` on any fretted tuning.
 *
 * - On standard guitar at position `0`, "as written" applies: the stored shape's frets
 *   are returned untouched.
 * - Everything else searches a five-fret window centred on the requested position for
 *   each string, keeping only notes that belong to the chord. Strings with no chord tone
 *   in the window come back as `-1` (muted) rather than an arbitrary fret. Position `0`
 *   on a searched tuning means the open position (frets 0–4), scored against the nut so
 *   open strings win.
 *
 * `usedStoredShape` is what tells playback whether a transpose offset still has to be
 * applied: stored frets have not moved with the key, searched frets already have.
 */
export function chordPositionForStrings(
  chord: ChordShape,
  position: number,
  strings: Tuning,
  maxFret = 20
): ChordPosition {
  const safeChord = asSafeChord(chord);
  const useStored =
    position <= 0 && safeChord.frets.length === strings.length && isStandardGuitarTuning(strings);

  if (useStored) {
    return {
      frets: [...safeChord.frets],
      fingers: safeChord.frets.map((_, index) => safeChord.fingers?.[index]),
      usedStoredShape: true,
    };
  }

  const chordNotes = safeChord.notes
    .map((note) => ALL_NOTES.indexOf(note))
    .filter((note) => note >= 0);
  const chordNoteSet = new Set(chordNotes);
  const anchor = Math.max(0, position);
  const minimumFret = position <= 0 ? 0 : Math.max(0, position - 2);
  const maximumFret = Math.min(position <= 0 ? Math.min(4, maxFret) : position + 2, maxFret);

  const frets = strings.map((string, stringIndex) => {
    const preferredNote = chordNotes[stringIndex % chordNotes.length];
    let bestFret = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let fret = minimumFret; fret <= maximumFret; fret += 1) {
      const note = (string.baseMidi + fret) % 12;
      if (!chordNoteSet.has(note)) continue;

      const score = Math.abs(fret - anchor) + (note === preferredNote ? 0 : 0.25);
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

  return { frets, fingers, usedStoredShape: false };
}

/** Standard-guitar wrapper kept for existing callers and tests. */
export function getChordPosition(chord: ChordShape, position: number): ChordPosition {
  return chordPositionForStrings(chord, position, GUITAR_STRINGS, 20);
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

/**
 * Close-position MIDI voicing for a keyboard instrument: the root sits in the C4
 * octave and every other chord tone stacks above it, each pushed up an octave until it
 * is higher than the previous note. Pitch classes come from the card's own (possibly
 * transposed) notes, so no playback offset is ever needed on top.
 */
export function keyboardMidis(chord: ChordShape): number[] {
  const safeChord = asSafeChord(chord);
  const rootIndex = ALL_NOTES.indexOf(safeChord.root);
  const rootMidi = 60 + (rootIndex >= 0 ? rootIndex : 0);

  const offsets = [
    ...new Set(
      safeChord.notes
        .map((note) => ALL_NOTES.indexOf(note))
        .filter((index) => index >= 0)
        .map((index) => (((index - rootIndex) % 12) + 12) % 12)
    ),
  ].sort((left, right) => left - right);

  const midis: number[] = [];
  let previous = rootMidi - 1;
  for (const offset of offsets) {
    let midi = rootMidi + offset;
    while (midi <= previous) midi += 12;
    midis.push(midi);
    previous = midi;
  }
  return midis;
}

/**
 * The exact frequencies one chord card plays for `instrument`, in strum order.
 *
 * - Fretted instruments voice the card on their own tuning — a bass plays bass-register
 *   frets, a ukulele plays four strings — and a transpose offset is added **only** when
 *   the frets are the stored shape, which has not moved with the key. Searched voicings
 *   were built from the already-transposed notes, so offsetting them would shift them a
 *   second time.
 * - Keyboard instruments play the close voicing from `keyboardMidis`; their notes carry
 *   the transposition themselves.
 * - If a fretted voicing comes back entirely muted (every string off the chord), the
 *   keyboard voicing is used as a pitched fallback so Play never silently does nothing.
 */
export function chordFrequencies(
  chord: ChordShape,
  position: number,
  transposeOffset: number,
  instrument: InstrumentDefinition
): number[] {
  if (instrument.layout === 'keyboard') {
    return keyboardMidis(chord).map((midi) => midiToFrequency(midi));
  }

  const { frets, usedStoredShape } = chordPositionForStrings(
    chord,
    position,
    instrument.strings,
    instrument.maxFret
  );
  const offset = usedStoredShape ? transposeOffset : 0;

  const frequencies: number[] = [];
  frets.forEach((fret, stringIndex) => {
    if (fret < 0) return;
    const string = instrument.strings[stringIndex];
    if (!string) return;
    frequencies.push(midiToFrequency(string.baseMidi + fret + offset));
  });

  return frequencies.length > 0 ? frequencies : keyboardMidis(chord).map(midiToFrequency);
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
