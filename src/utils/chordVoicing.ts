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
import { asSafeChord, chordDisplayName, findChord } from '../data/chordsData';
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

  // Finger numbers for a searched voicing, worked out the way a player would read it: one
  // finger per fret group, starting at the index, and a new finger for each *adjacent*
  // string at that fret. Keeping the finger across a gap is a partial barre, which is how
  // B Minor's x24432 turns into index on strings 5 and 1 — the same reading the diagram
  // and `detectBarre` then draw and label. Numbering by "which distinct fret" instead put
  // one finger on every string at a fret, so three adjacent strings all claimed finger 1.
  const fingers: number[] = frets.map(() => 0);
  const fretsAscending = [...new Set(frets.filter((fret) => fret > 0))].sort(
    (left, right) => left - right
  );

  let nextFinger = 1;
  for (const fret of fretsAscending) {
    let finger = nextFinger;
    let previousString = -2;

    for (let stringIndex = 0; stringIndex < frets.length; stringIndex += 1) {
      if (frets[stringIndex] !== fret) continue;

      // Two adjacent strings at one fret take two fingers — that is a chord grip, not a
      // barre. The same finger may only serve two strings when it is genuinely lying
      // across them, which means a gap in the strings with everything between stopped at
      // this fret or higher. Otherwise the next string needs another finger.
      const liesAcrossStrings =
        previousString >= 0 &&
        stringIndex - previousString > 1 &&
        frets
          .slice(previousString + 1, stringIndex)
          .every((inner) => inner >= fret);
      if (previousString >= 0 && !liesAcrossStrings) finger += 1;

      // Past the pinky there is no finger left, so the string is drawn unnumbered rather
      // than reusing a number — a repeat reads as a barre the shape does not have, and one
      // finger cannot be at two frets anyway. Such a grip is playable by a rearranged hand;
      // the search does not claim to know how.
      fingers[stringIndex] = finger <= 4 ? finger : 0;
      previousString = stringIndex;
    }

    nextFinger = finger + 1;
  }

  return { frets, fingers, usedStoredShape: false };
}

/** Standard-guitar wrapper kept for existing callers and tests. */
export function getChordPosition(chord: ChordShape, position: number): ChordPosition {
  return chordPositionForStrings(chord, position, GUITAR_STRINGS, 20);
}

export interface Barre {
  /** Fret the index finger lies across. Always 1 or higher. */
  fret: number;
  /** Lowest string index the barre covers (0 = lowest-pitched string). */
  from: number;
  /** Highest string index the barre covers, inclusive. */
  to: number;
  /** Which finger is doing it — almost always the index (1). */
  finger: number;
}

/**
 * Find the barre in a fingering, or `null` when there is not one.
 *
 * A barre cannot be read from frets alone: in F Major (133211) only two strings show
 * fret 1, because the index finger lies *underneath* the fingers that stop 2, 3 and 4. So
 * the rule is the physical one — the same finger stops the same fret on two strings, and
 * every string in between is stopped at that fret or higher. An open or muted string in
 * between means the finger is not lying across it, so that is not a barre (which is why
 * A7's x02020 does not count).
 *
 * The lowest matching fret wins, and among equals the widest span.
 */
export function detectBarre(
  frets: readonly number[],
  fingers?: readonly (number | string | undefined)[]
): Barre | null {
  if (!fingers || fingers.length !== frets.length) return null;

  let found: Barre | null = null;

  for (let from = 0; from < frets.length; from += 1) {
    const fret = frets[from];
    const finger = fingers[from];
    if (fret == null || fret <= 0) continue;
    if (typeof finger !== 'number' || finger <= 0) continue;

    for (let to = from + 1; to < frets.length; to += 1) {
      if (frets[to] !== fret || fingers[to] !== finger) continue;

      let spans = true;
      for (let string = from + 1; string < to; string += 1) {
        const inner = frets[string];
        if (inner == null || inner < fret) {
          spans = false;
          break;
        }
      }
      if (!spans) continue;

      const wider = found ? to - from > found.to - found.from : true;
      if (!found || fret < found.fret || (fret === found.fret && wider)) {
        found = { fret, from, to, finger };
      }
    }
  }

  return found;
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
  /**
   * Semitones still to shift at playback time. Always 0 today: every branch below puts
   * frets for the new chord on the card, so the drawing and the sound can never disagree.
   * Kept in the shape because the studio's card items carry it.
   */
  transposeOffset: number;
  /** True when the card's frets belong to the transposed chord (so no offset is needed). */
  usedStoredShape: boolean;
}

/**
 * Highest fret a movable shape may be shifted to before a searched voicing is used
 * instead — past this the grip is no longer one anyone plays.
 */
const MOVABLE_SHAPE_MAX_FRET = 15;

/**
 * Shift a chord card by `delta` semitones, keeping the drawn shape and the name in step.
 *
 * Two earlier versions got this wrong in the same way. The original transposed only the
 * name and notes and left the frets alone; the follow-up fix looked the new root up in the
 * stored table, which is correct for the roots the table holds but silently kept the old
 * frets for the five major roots (C♯, D♯, F♯, G♯, A♯) it does not — so a card read
 * "D♯ Major" while drawing C Major, and only playback was corrected by an offset. Now:
 *
 * 1. A stored shape for the new root wins (the table's shapes are the idiomatic ones).
 * 2. Otherwise a shape with no open string simply moves with the key — the same grip with
 *    the same finger numbers. This is what a player does, and it keeps the textbook grip
 *    for combinations the table has no entry for (B Minor −1 is exactly the A♯ Minor
 *    barre, x13321).
 * 3. Otherwise an open shape cannot move at all — its open strings are not fingers — so a
 *    voicing for the transposed notes is searched and drawn, instead of leaving the old
 *    chord's frets under the new name. The search runs on standard guitar; other tunings
 *    already search from the transposed notes, so they ignore these frets.
 */
export function transposeChordShape(chord: ChordShape, delta: number): TransposedChord {
  const newRoot: NoteName = transposeNote(chord.root, delta);

  const stored = findChord(newRoot, chord.type);
  if (stored) {
    return { chord: { ...stored }, transposeOffset: 0, usedStoredShape: true };
  }

  const safeChord: SafeChordShape = asSafeChord(chord);
  const transposed: ChordShape = {
    ...chord,
    root: newRoot,
    name: chordDisplayName(newRoot, chord.type),
    notes: safeChord.notes.map((note) => transposeNote(note, delta)),
  };

  const canMove =
    safeChord.frets.length > 0 &&
    safeChord.frets.every((fret) => fret !== 0) &&
    safeChord.frets.every(
      (fret) => fret < 0 || (fret + delta >= 1 && fret + delta <= MOVABLE_SHAPE_MAX_FRET)
    );

  if (canMove) {
    return {
      // Same grip, same finger numbers — only the frets move.
      chord: {
        ...transposed,
        frets: safeChord.frets.map((fret) => (fret < 0 ? -1 : fret + delta)),
      },
      transposeOffset: 0,
      usedStoredShape: true,
    };
  }

  const voicing = chordPositionForStrings(
    { ...transposed, frets: [], fingers: [] },
    0,
    GUITAR_STRINGS,
    20
  );

  return {
    chord: {
      ...transposed,
      frets: voicing.frets,
      fingers: voicing.fingers.map((finger) => finger ?? 0),
    },
    transposeOffset: 0,
    usedStoredShape: true,
  };
}
