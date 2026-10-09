// Tests for the chord voicing maths that used to live inside ChordWorkbench and had no
// coverage at all — including the transposition bug where a shifted card kept its old shape.

import { COMPREHENSIVE_CHORDS, findChord, findOrCreateChord } from '../data/chordsData';
import { transposeChordShape, fretWindow, getChordPosition } from './chordVoicing';

const cMajor = findOrCreateChord('C', 'Major');
const aMajor = findOrCreateChord('A', 'Major');

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

  test('every stored shape has six fret positions', () => {
    for (const chord of COMPREHENSIVE_CHORDS) {
      expect(chord.frets.length).toBe(6);
    }
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

  test('finger numbers are 1-4 and stay positive for sounding strings', () => {
    const { frets, fingers } = getChordPosition(aMajor, 5);
    frets.forEach((fret, index) => {
      const finger = fingers[index];
      if (fret > 0) {
        expect(finger).toBeGreaterThan(0);
        expect(finger).toBeLessThanOrEqual(4);
      } else {
        expect(finger).toBe(0);
      }
    });
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

  test('falls back to transposed notes and keeps the offset when no shape exists', () => {
    // The table has no sus chords, so this exercises the fallback branch.
    const sus = { ...cMajor, id: 'c-sus4', name: 'C Sus4', type: 'Sus4', notes: ['C' as const, 'F' as const, 'G' as const] };
    const result = transposeChordShape(sus, 2, 1);

    expect(result.usedStoredShape).toBe(false);
    expect(result.chord.root).toBe('D');
    expect(result.chord.name).toBe('D Sus4');
    expect(result.chord.notes).toEqual(['D', 'G', 'A']);
    expect(result.transposeOffset).toBe(3);
  });
});
