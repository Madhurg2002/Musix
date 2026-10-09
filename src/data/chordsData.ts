import { ChordShape, NoteName, SafeChordShape } from '../types';

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
    name: 'C7 (Dominant 7th)',
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

  // F Chords
  {
    id: 'f-major',
    // Barre shape only — the old "(Barre / Easy)" name promised an easy variant that
    // does not exist in this table.
    name: 'F Major (Barre)',
    root: 'F',
    type: 'Major',
    notes: ['F', 'A', 'C'],
    intervals: ['1', '3', '5'],
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    difficulty: 'Intermediate',
  },

  // B Chords
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
  }
];


export function findOrCreateChord(root: NoteName, type: string): ChordShape {
  const existing = COMPREHENSIVE_CHORDS.find(
    (c) => c.root === root && c.type.toLowerCase() === type.toLowerCase()
  );
  if (existing) return existing;

  // Fallback dynamic note derivation
  return {
    id: `${root.toLowerCase()}-${type.toLowerCase()}`,
    name: `${root} ${type}`,
    root,
    type,
    notes: [root],
    intervals: ['1', '3', '5'],
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: ['x', 0, 1, 2, 3, 0],
    difficulty: 'Beginner',
  };
}
