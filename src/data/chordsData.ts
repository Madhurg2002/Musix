import { ChordShape, NoteName, SafeChordShape } from '../types';
import { transposeNote } from '../utils/musicTheory';

/**
 * Interval stacks for the qualities the studio can request. The stored table only holds a
 * handful of roots per quality, so anything the learner asks for that is not in it gets its
 * notes from here instead of the single-note placeholder this used to return.
 */
const QUALITY_STACKS: Readonly<Record<string, { semitones: readonly number[]; labels: readonly string[] }>> = {
  major: { semitones: [0, 4, 7], labels: ['1', '3', '5'] },
  minor: { semitones: [0, 3, 7], labels: ['1', '♭3', '5'] },
  '7th': { semitones: [0, 4, 7, 10], labels: ['1', '3', '5', '♭7'] },
  'major 7th': { semitones: [0, 4, 7, 11], labels: ['1', '3', '5', '7'] },
};

// What the display-name helper appends to a root, leading space included, because chord
// symbols do not space their extensions (C7, Cmaj7) while plain qualities do (C Major).
// Anything not listed falls back to "Root Type", so a quality added later still reads.
const TYPE_SUFFIXES: Readonly<Record<string, string>> = {
  major: ' Major',
  minor: ' Minor',
  '7th': '7',
  'major 7th': 'maj7',
};

/**
 * The one spelling of a chord's name: "C Major", "C Minor", "C7", "Cmaj7".
 *
 * Every stored shape and every derived one goes through here, so the same chord cannot be
 * titled two ways depending on which path produced it — a transposed card used to read
 * "C♯ Major" while the table called the identical shape "C♯ Major (Barre)".
 */
export function chordDisplayName(root: NoteName, type: string): string {
  const suffix = TYPE_SUFFIXES[type.toLowerCase()];
  return suffix ? `${root}${suffix}` : `${root} ${type}`;
}

// Safe helper for strict builds that need non-nullable chord shapes.
export function asSafeChord(chord: ChordShape | undefined | null): SafeChordShape {
  if (!chord) {
    return {
      id: 'unknown',
      name: 'Unknown',
      root: 'C',
      type: 'Major',
      notes: ['C'],
      intervals: ['1', '3', '5'],
      frets: [-1, 0, 2, 2, 1, 0],
      fingers: ['x', 0, 1, 2, 3, 0],
      difficulty: 'Beginner',
    };
  }

  return {
    id: chord.id,
    name: chord.name,
    root: chord.root,
    type: chord.type,
    notes: chord.notes,
    intervals: chord.intervals,
    frets: chord.frets,
    fingers: chord.fingers ?? undefined,
    capo: chord.capo,
    difficulty: chord.difficulty,
  };
}

// Stored shapes, ordered so the list reads the way a learner looks for a chord: chromatically
// by root (C, C♯, D … B) and, inside a root, Major → Minor → 7th → Major 7th. The Fretboard
// picker renders this array directly, so the order here *is* the order people see; it used to
// jump around (C♯ Major came before C7, A♯ Major sat between A7 and G).
export const COMPREHENSIVE_CHORDS: ChordShape[] = [
  // C Chords
  {
    id: 'c-major',
    name: 'C Major',
    root: 'C',
    type: 'Major',
    notes: ['C', 'E', 'G'],
    intervals: ['1', '3', '5'],
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: ['x', 3, 2, 0, 1, 0],
    difficulty: 'Beginner',
  },
  {
    id: 'c-minor',
    name: 'C Minor',
    root: 'C',
    type: 'Minor',
    notes: ['C', 'D♯', 'G'],
    intervals: ['1', '♭3', '5'],
    frets: [-1, 3, 5, 5, 4, 3],
    fingers: ['x', 1, 3, 4, 2, 1],
    difficulty: 'Intermediate',
  },
  {
    id: 'c-dom7',
    name: 'C7',
    root: 'C',
    type: '7th',
    notes: ['C', 'E', 'G', 'A♯'],
    intervals: ['1', '3', '5', '♭7'],
    frets: [-1, 3, 2, 3, 1, 0],
    fingers: ['x', 3, 2, 4, 1, 0],
    difficulty: 'Beginner',
  },
  {
    id: 'c-maj7',
    name: 'Cmaj7',
    root: 'C',
    type: 'Major 7th',
    notes: ['C', 'E', 'G', 'B'],
    intervals: ['1', '3', '5', '7'],
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: ['x', 3, 2, 0, 0, 0],
    difficulty: 'Beginner',
  },

  // C♯ Chords
  {
    id: 'c-sharp-major',
    // Barre shape: the A-shape moved to fret 4 (x46664). C♯ used to have no entry at all,
    // so the studio fell back to a stub that drew an A minor grip under this name.
    name: 'C♯ Major',
    root: 'C♯',
    type: 'Major',
    notes: ['C♯', 'F', 'G♯'],
    intervals: ['1', '3', '5'],
    frets: [-1, 4, 6, 6, 6, 4],
    fingers: ['x', 1, 2, 3, 4, 1],
    difficulty: 'Intermediate',
  },

  // D Chords
  {
    id: 'd-major',
    name: 'D Major',
    root: 'D',
    type: 'Major',
    notes: ['D', 'F♯', 'A'],
    intervals: ['1', '3', '5'],
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: ['x', 'x', 0, 1, 3, 2],
    difficulty: 'Beginner',
  },
  {
    id: 'd-minor',
    name: 'D Minor',
    root: 'D',
    type: 'Minor',
    notes: ['D', 'F', 'A'],
    intervals: ['1', '♭3', '5'],
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: ['x', 'x', 0, 2, 3, 1],
    difficulty: 'Beginner',
  },

  // D♯ Chords
  {
    id: 'd-sharp-major',
    // Barre shape: the A-shape moved to fret 6 (x68886), the standard E♭ voicing.
    name: 'D♯ Major',
    root: 'D♯',
    type: 'Major',
    notes: ['D♯', 'G', 'A♯'],
    intervals: ['1', '3', '5'],
    frets: [-1, 6, 8, 8, 8, 6],
    fingers: ['x', 1, 2, 3, 4, 1],
    difficulty: 'Intermediate',
  },

  // E Chords
  {
    id: 'e-major',
    name: 'E Major',
    root: 'E',
    type: 'Major',
    notes: ['E', 'G♯', 'B'],
    intervals: ['1', '3', '5'],
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [0, 2, 3, 1, 0, 0],
    difficulty: 'Beginner',
  },
  {
    id: 'e-minor',
    name: 'E Minor',
    root: 'E',
    type: 'Minor',
    notes: ['E', 'G', 'B'],
    intervals: ['1', '♭3', '5'],
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
    difficulty: 'Beginner',
  },

  // F Chords
  {
    id: 'f-major',
    // Barre shape only — the old "(Barre / Easy)" name promised an easy variant that
    // does not exist in this table. The barre itself is now read off the fingering by
    // `detectBarre`, so no name carries it: one chord, one name, however you reach it.
    name: 'F Major',
    root: 'F',
    type: 'Major',
    notes: ['F', 'A', 'C'],
    intervals: ['1', '3', '5'],
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    difficulty: 'Intermediate',
  },

  // F♯ Chords
  {
    id: 'f-sharp-major',
    // Barre shape: the E-shape moved to fret 2 (244322).
    name: 'F♯ Major',
    root: 'F♯',
    type: 'Major',
    notes: ['F♯', 'A♯', 'C♯'],
    intervals: ['1', '3', '5'],
    frets: [2, 4, 4, 3, 2, 2],
    fingers: [1, 3, 4, 2, 1, 1],
    difficulty: 'Intermediate',
  },

  // G Chords
  {
    id: 'g-major',
    name: 'G Major',
    root: 'G',
    type: 'Major',
    notes: ['G', 'B', 'D'],
    intervals: ['1', '3', '5'],
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, 0, 0, 0, 3],
    difficulty: 'Beginner',
  },
  {
    id: 'g-minor',
    name: 'G Minor',
    root: 'G',
    type: 'Minor',
    notes: ['G', 'A♯', 'D'],
    intervals: ['1', '♭3', '5'],
    frets: [3, 5, 5, 3, 3, 3],
    fingers: [1, 3, 4, 1, 1, 1],
    difficulty: 'Intermediate',
  },
  {
    id: 'g-dom7',
    name: 'G7',
    root: 'G',
    type: '7th',
    notes: ['G', 'B', 'D', 'F'],
    intervals: ['1', '3', '5', '♭7'],
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, 0, 0, 0, 1],
    difficulty: 'Beginner',
  },

  // G♯ Chords
  {
    id: 'g-sharp-major',
    // Barre shape: the E-shape moved to fret 4 (466544).
    name: 'G♯ Major',
    root: 'G♯',
    type: 'Major',
    notes: ['G♯', 'C', 'D♯'],
    intervals: ['1', '3', '5'],
    frets: [4, 6, 6, 5, 4, 4],
    fingers: [1, 3, 4, 2, 1, 1],
    difficulty: 'Intermediate',
  },

  // A Chords
  {
    id: 'a-major',
    name: 'A Major',
    root: 'A',
    type: 'Major',
    notes: ['A', 'C♯', 'E'],
    intervals: ['1', '3', '5'],
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: ['x', 0, 1, 2, 3, 0],
    difficulty: 'Beginner',
  },
  {
    id: 'a-minor',
    name: 'A Minor',
    root: 'A',
    type: 'Minor',
    notes: ['A', 'C', 'E'],
    intervals: ['1', '♭3', '5'],
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: ['x', 0, 2, 3, 1, 0],
    difficulty: 'Beginner',
  },
  {
    id: 'a-dom7',
    name: 'A7',
    root: 'A',
    type: '7th',
    notes: ['A', 'C♯', 'E', 'G'],
    intervals: ['1', '3', '5', '♭7'],
    frets: [-1, 0, 2, 0, 2, 0],
    fingers: ['x', 0, 1, 0, 2, 0],
    difficulty: 'Beginner',
  },

  // A♯ Chords
  {
    id: 'a-sharp-major',
    // Barre shape: the A-shape moved to fret 1 (x13331), the standard B♭ voicing.
    name: 'A♯ Major',
    root: 'A♯',
    type: 'Major',
    notes: ['A♯', 'D', 'F'],
    intervals: ['1', '3', '5'],
    frets: [-1, 1, 3, 3, 3, 1],
    fingers: ['x', 1, 2, 3, 4, 1],
    difficulty: 'Intermediate',
  },

  // B Chords
  {
    id: 'b-major',
    name: 'B Major',
    root: 'B',
    type: 'Major',
    notes: ['B', 'D♯', 'F♯'],
    intervals: ['1', '3', '5'],
    frets: [-1, 2, 4, 4, 4, 2],
    fingers: ['x', 1, 2, 3, 4, 1],
    difficulty: 'Intermediate',
  },
  {
    id: 'b-minor',
    name: 'B Minor',
    root: 'B',
    type: 'Minor',
    notes: ['B', 'D', 'F♯'],
    intervals: ['1', '♭3', '5'],
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: ['x', 1, 3, 4, 2, 1],
    difficulty: 'Intermediate',
  },
];


/** Look up a stored shape by root and type, or `undefined` when the table has none. */
export function findChord(root: NoteName, type: string): ChordShape | undefined {
  return COMPREHENSIVE_CHORDS.find(
    (chord) => chord.root === root && chord.type.toLowerCase() === type.toLowerCase()
  );
}

export function findOrCreateChord(root: NoteName, type: string): ChordShape {
  const existing = findChord(root, type);
  if (existing) return existing;

  // Fallback dynamic note derivation. The old stub was a lie: it claimed `notes: [root]`
  // with a 1-3-5 formula and carried the frets of an A minor shape, so an "Add Card" for a
  // root the table does not hold (D♯ Minor, C♯ 7th…) drew an A minor grip under that name.
  // The notes are derived instead, and the frets stay empty so the fret grid voices the
  // real chord rather than drawing a shape that belongs to a different one.
  const stack = QUALITY_STACKS[type.toLowerCase()];

  return {
    id: `${root.toLowerCase()}-${type.toLowerCase()}`,
    name: chordDisplayName(root, type),
    root,
    type,
    notes: stack ? stack.semitones.map((semitones) => transposeNote(root, semitones)) : [root],
    intervals: stack ? [...stack.labels] : ['1', '3', '5'],
    frets: [],
    fingers: [],
    difficulty: 'Beginner',
  };
}
