// Tests for the chord voicing maths that used to live inside ChordWorkbench and had no
// coverage at all — including the transposition bug where a shifted card kept its old shape.

import {
  COMPREHENSIVE_CHORDS,
  chordDisplayName,
  findChord,
  findOrCreateChord,
} from '../data/chordsData';
import {
  chordPositionForStrings,
  detectBarre,
  fretWindow,
  getChordPosition,
  transposeChordShape,
} from './chordVoicing';
import { ALL_NOTES, GUITAR_STRINGS } from './musicTheory';
import { instrumentFor } from '../data/instruments';
import type { ChordShape, NoteName } from '../types';

const cMajor = findOrCreateChord('C', 'Major');
const aMajor = findOrCreateChord('A', 'Major');

/** Every pitch class the drawn shape sounds, with muted strings dropped. */
function soundedNotes(chord: ChordShape): NoteName[] {
  const guitar = instrumentFor('acoustic-guitar');
  const { frets } = chordPositionForStrings(chord, 0, guitar.strings, guitar.maxFret);
  return frets
    .map((fret, stringIndex) =>
      fret < 0 ? null : ALL_NOTES[(GUITAR_STRINGS[stringIndex]!.baseMidi + fret) % 12]!
    )
    .filter((note): note is NoteName => note != null);
}

/** The invariant the studio's cards rest on: a card sounds the chord its name says. */
function expectShapeMatchesName(chord: ChordShape) {
  const sounded = soundedNotes(chord);
  expect(sounded.length).toBeGreaterThan(0);
  for (const note of sounded) {
    expect(chord.notes).toContain(note);
  }
}

describe('chord lookup', () => {
  test('findChord returns a stored shape', () => {
    expect(findChord('C', 'Major')?.id).toBe('c-major');
    expect(findChord('B', 'Minor')?.id).toBe('b-minor');
  });

  test('findChord is case-insensitive about the type', () => {
    expect(findChord('C', 'major')?.id).toBe('c-major');
  });

  test('findChord returns undefined for a chord the table does not hold', () => {
    expect(findChord('C', 'Sus4')).toBe(undefined);
  });

  test('findOrCreateChord still falls back to a stub', () => {
    const stub = findOrCreateChord('C', 'Sus4');
    expect(stub.root).toBe('C');
    expect(stub.type).toBe('Sus4');
    expect(stub.notes).toEqual(['C']);
  });

  test('the table reads chromatically, quality order inside a root', () => {
    // The Fretboard picker renders this array, so its order is what a learner reads. It
    // used to jump: C♯ Major before C7, A♯ Major between A7 and G.
    expect(COMPREHENSIVE_CHORDS.map((chord) => chord.name)).toEqual([
      'C Major', 'C Minor', 'C7', 'Cmaj7',
      'C♯ Major',
      'D Major', 'D Minor',
      'D♯ Major',
      'E Major', 'E Minor',
      'F Major',
      'F♯ Major',
      'G Major', 'G Minor', 'G7',
      'G♯ Major',
      'A Major', 'A Minor', 'A7',
      'A♯ Major',
      'B Major', 'B Minor',
    ]);
  });

  test('every stored shape has six fret positions', () => {
    for (const chord of COMPREHENSIVE_CHORDS) {
      expect(chord.frets.length).toBe(6);
    }
  });

  test('every stored shape actually sounds the chord it is named after', () => {
    for (const chord of COMPREHENSIVE_CHORDS) {
      expectShapeMatchesName(chord);
    }
  });

  test('all twelve major roots have a real shape, not a stub', () => {
    for (const root of ALL_NOTES) {
      const chord = findOrCreateChord(root, 'Major');
      expect(chord.notes.length).toBe(3);
      expect(chord.frets.length).toBe(6);
      expectShapeMatchesName(chord);
    }
  });

  test('a chord the table does not hold derives its notes instead of a one-note lie', () => {
    const chord = findOrCreateChord('D♯', 'Minor');
    expect(chord.notes).toEqual(['D♯', 'F♯', 'A♯']);
    expect(chord.intervals).toEqual(['1', '♭3', '5']);
    // No stored grip for it, so the fret grid voices the derived notes (empty frets).
    expect(chord.frets).toEqual([]);
    expectShapeMatchesName(chord);
  });

  test('one chord has one name, whether stored or derived', () => {
    for (const chord of COMPREHENSIVE_CHORDS) {
      expect(chord.name).toBe(chordDisplayName(chord.root, chord.type));
      // "Barre" describes the grip, not the chord: it used to be in five stored names and
      // missing from B Major, so the same chord was titled two ways.
      expect(/barre/i.test(chord.name)).toBe(false);
    }

    expect(findOrCreateChord('D♯', 'Major 7th').name).toBe('D♯maj7');
    expect(findOrCreateChord('D', '7th').name).toBe('D7');
    expect(findOrCreateChord('A', 'Major').name).toBe('A Major');
  });

  test('transposing keeps the naming convention', () => {
    expect(transposeChordShape(findOrCreateChord('C', '7th'), 2).chord.name).toBe('D7');
    expect(transposeChordShape(findOrCreateChord('C', 'Major 7th'), 2).chord.name).toBe('Dmaj7');
  });
});

describe('detectBarre', () => {
  const barreOf = (root: NoteName) => {
    const chord = findOrCreateChord(root, 'Major');
    return detectBarre(chord.frets, chord.fingers);
  };

  test('finds the index barre under the other fingers (E-shape)', () => {
    // F Major is 133211: only two strings show fret 1, because the index lies underneath.
    expect(barreOf('F')).toEqual({ fret: 1, from: 0, to: 5, finger: 1 });
    expect(barreOf('F♯')).toEqual({ fret: 2, from: 0, to: 5, finger: 1 });
    expect(barreOf('G♯')).toEqual({ fret: 4, from: 0, to: 5, finger: 1 });
  });

  test('finds a partial barre that does not use the lowest string (A-shape)', () => {
    expect(barreOf('C♯')).toEqual({ fret: 4, from: 1, to: 5, finger: 1 });
    expect(barreOf('A♯')).toEqual({ fret: 1, from: 1, to: 5, finger: 1 });
    expect(barreOf('B')).toEqual({ fret: 2, from: 1, to: 5, finger: 1 });
  });

  test('open chords are not barres', () => {
    for (const root of ['C', 'A', 'D', 'E', 'G'] as NoteName[]) {
      expect(barreOf(root)).toBe(null);
    }
  });

  test('a shared finger number is not a barre when an open string sits between', () => {
    // A7 is x02020: the same finger number appears twice, but the open G string means the
    // finger is not lying across the strings.
    const a7 = findOrCreateChord('A', '7th');
    expect(a7.frets).toEqual([-1, 0, 2, 0, 2, 0]);
    expect(detectBarre(a7.frets, a7.fingers)).toBe(null);
  });

  test('a B minor barre survives transposition to the A♯ grip', () => {
    const aSharpMinor = transposeChordShape(findOrCreateChord('B', 'Minor'), -1).chord;
    expect(detectBarre(aSharpMinor.frets, aSharpMinor.fingers)).toEqual({
      fret: 1,
      from: 1,
      to: 5,
      finger: 1,
    });
  });

  test('a searched voicing without fingering data reports no barre', () => {
    expect(detectBarre([-1, 2, 2, 1, 0, 0])).toBe(null);
  });
});

describe('getChordPosition', () => {
  test('position 0 returns the shape untouched', () => {
    const { frets, fingers } = getChordPosition(cMajor, 0);
    expect(frets).toEqual(cMajor.frets);
    expect(fingers.length).toBe(6);
  });

  test('a placed voicing only uses notes that belong to the chord', () => {
    const { frets } = getChordPosition(aMajor, 5);
    for (const fret of frets) {
      expect(fret).toBeGreaterThanOrEqual(-1);
    }
    // At least one string must sound, otherwise the card would draw an empty voicing.
    expect(frets.some((fret) => fret >= 0)).toBe(true);
  });

  test('placed voicings stay inside a five-fret window around the request', () => {
    const position = 7;
    const { frets } = getChordPosition(aMajor, position);
    for (const fret of frets.filter((value) => value > 0)) {
      expect(Math.abs(fret - position)).toBeLessThanOrEqual(2);
    }
  });

  test('sounding strings carry a finger between 1 and 4, or none when the hand runs out', () => {
    // The old contract was "every pressed string has a finger". A searched grip can need
    // more fingers than a hand has (A Major placed at fret 5 stops four different frets on
    // six strings); those extra strings are left unnumbered instead of repeating a number,
    // because a repeat reads as a barre the shape does not have.
    const { frets, fingers } = getChordPosition(aMajor, 5);
    let numbered = 0;
    frets.forEach((fret, index) => {
      const finger = fingers[index];
      expect(finger).toBeGreaterThanOrEqual(0);
      expect(finger).toBeLessThanOrEqual(4);
      if (fret <= 0) {
        expect(finger).toBe(0);
        return;
      }
      if (finger !== 0) numbered += 1;
    });
    expect(numbered).toBeGreaterThan(0);
    expect(numbered).toBeLessThanOrEqual(4);
  });

  test('a searched B Minor placement reads as the barre the diagram will draw', () => {
    // Placed at fret 3 the search finds the E-shape grip (2 2 4 4 3 2), which is a real
    // barre at fret 2. Numbering the fingers by "which distinct fret" used to put finger 1
    // on every string of the lowest fret, which the diagram then drew as separate dots.
    const bMinor = findOrCreateChord('B', 'Minor');
    const { frets, fingers } = chordPositionForStrings(bMinor, 3, GUITAR_STRINGS, 20);

    expect(frets.slice(0, 2)).toEqual([2, 2]);
    expect(fingers[0]).toBe(1);
    // Two adjacent strings at one fret take two fingers, never one.
    expect(fingers[1]).toBe(2);
    expect(detectBarre(frets, fingers)).toEqual({ fret: 2, from: 1, to: 5, finger: 2 });
  });

  test('a searched fingering only repeats a finger where the diagram draws a barre', () => {
    // The invariant that keeps the numbers and the bar in step: two strings may share a
    // finger only when that finger is genuinely lying across them, which is exactly what
    // `detectBarre` reports. Without this the diagram could label a grip as barred while
    // the fingering said two separate fingertips.
    for (const root of ALL_NOTES) {
      for (const type of ['Major', 'Minor', '7th', 'Major 7th']) {
        const chord = findOrCreateChord(root, type);
        for (let position = 1; position <= 12; position += 1) {
          const { frets, fingers } = chordPositionForStrings(chord, position, GUITAR_STRINGS, 20);
          const barre = detectBarre(frets, fingers);

          for (let first = 0; first < frets.length; first += 1) {
            const finger = fingers[first];
            if (!finger) continue;
            for (let second = first + 1; second < frets.length; second += 1) {
              if (fingers[second] !== finger) continue;
              // Adjacent strings must not share a finger at all.
              expect(second - first).toBeGreaterThan(1);
              // A shared finger across a gap must be the drawn barre.
              expect(barre).not.toBe(null);
              expect(barre!.from).toBeLessThanOrEqual(first);
              expect(barre!.to).toBeGreaterThanOrEqual(second);
            }
          }
        }
      }
    }
  });
});

describe('fretWindow', () => {
  test('an open-position shape is drawn in the first five frets', () => {
    expect(fretWindow([-1, 0, 2, 2, 1, 0])).toEqual({
      firstFret: 1,
      fretCount: 5,
      fretNumbers: [1, 2, 3, 4, 5],
    });
  });

  test('a barre shape higher up the neck keeps five columns', () => {
    const window = fretWindow([3, 5, 5, 4, 3, 3]);
    expect(window.firstFret).toBe(1);
    expect(window.fretCount).toBe(5);
  });

  test('a wide shape outside the first five frets shifts the window to fit', () => {
    const window = fretWindow([-1, 8, 10, 10, 9, 8]);
    expect(window.fretCount).toBe(5);
    expect(window.firstFret).toBe(6);
    expect(window.fretNumbers).toEqual([6, 7, 8, 9, 10]);
  });

  test('an all-muted shape still draws a usable five-fret diagram', () => {
    expect(fretWindow([-1, -1, -1, -1, -1, -1])).toEqual({
      firstFret: 1,
      fretCount: 5,
      fretNumbers: [1, 2, 3, 4, 5],
    });
  });
});

describe('transposeChordShape', () => {
  test('uses the stored shape for the new root and resets the playback offset', () => {
    const result = transposeChordShape(cMajor, 2);
    expect(result.usedStoredShape).toBe(true);
    expect(result.chord.root).toBe('D');
    expect(result.chord.name).toBe('D Major');
    expect(result.chord.id).toBe('d-major');
    expect(result.transposeOffset).toBe(0);
  });

  test('this is the bug that was fixed: the shape moves with the name', () => {
    const upTwo = transposeChordShape(cMajor, 2);
    // Before the fix the card kept C Major's frets while claiming to be D Major.
    expect(upTwo.chord.frets).toEqual(findChord('D', 'Major')!.frets);
    expect(upTwo.chord.frets).not.toEqual(cMajor.frets);
  });

  test('keeps transposing from wherever the card already is', () => {
    const twice = transposeChordShape(cMajor, 2);
    const again = transposeChordShape(twice.chord, 2);
    expect(again.chord.id).toBe('e-major');
    expect(again.chord.root).toBe('E');
  });

  test('wraps around the octave', () => {
    expect(transposeChordShape(aMajor, 3).chord.root).toBe('C');
    expect(transposeChordShape(cMajor, -1).chord.root).toBe('B');
  });

  test('the five major roots that used to be missing get the stored barre shape', () => {
    // Before this, only an offset kept playback right: the card read "C♯ Major" and drew
    // C Major's frets.
    const cSharp = transposeChordShape(cMajor, 1);
    expect(cSharp.usedStoredShape).toBe(true);
    expect(cSharp.chord.id).toBe('c-sharp-major');
    expect(cSharp.chord.frets).toEqual([-1, 4, 6, 6, 6, 4]);
    expect(cSharp.transposeOffset).toBe(0);
    expectShapeMatchesName(cSharp.chord);

    for (const delta of [3, 6, 8, 10]) {
      const shifted = transposeChordShape(cMajor, delta);
      expect(shifted.chord.frets.length).toBe(6);
      expect(shifted.transposeOffset).toBe(0);
      expectShapeMatchesName(shifted.chord);
    }
  });

  test('a movable shape simply moves with the key (B Minor −1 is the A♯ Minor barre)', () => {
    const bMinor = findOrCreateChord('B', 'Minor');
    const result = transposeChordShape(bMinor, -1);

    expect(findChord('A♯', 'Minor')).toBe(undefined); // nothing stored to look up
    expect(result.chord.name).toBe('A♯ Minor');
    expect(result.chord.frets).toEqual([-1, 1, 3, 3, 2, 1]);
    expect(result.chord.fingers).toEqual(bMinor.fingers);
    expect(result.transposeOffset).toBe(0);
    expectShapeMatchesName(result.chord);
  });

  test('an open shape that cannot move gets a voicing for the transposed notes', () => {
    // C Major is open, so it cannot slide; the old code kept its frets anyway.
    const sus = {
      ...cMajor,
      id: 'c-sus4',
      name: 'C Sus4',
      type: 'Sus4',
      notes: ['C' as const, 'F' as const, 'G' as const],
    };
    const result = transposeChordShape(sus, 2);

    expect(result.chord.root).toBe('D');
    expect(result.chord.name).toBe('D Sus4');
    expect(result.chord.notes).toEqual(['D', 'G', 'A']);
    expect(result.chord.frets.length).toBe(6);
    expect(result.chord.frets).not.toEqual(cMajor.frets);
    expect(result.transposeOffset).toBe(0);
    expectShapeMatchesName(result.chord);
  });

  test('every semitone step lands on a card that sounds its own name', () => {
    const starts = [
      findOrCreateChord('C', 'Major'),
      findOrCreateChord('A', 'Minor'),
      findOrCreateChord('F', 'Major'),
      findOrCreateChord('D', 'Major'),
    ];

    for (const start of starts) {
      for (let delta = -11; delta <= 11; delta += 1) {
        const { chord } = transposeChordShape(start, delta);
        expectShapeMatchesName(chord);
      }
    }
  });
});
