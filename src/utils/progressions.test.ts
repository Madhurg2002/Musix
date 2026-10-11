// The progression builder replaces the whole card set at once, so a wrong offset here
// means every card in a loaded progression is wrong — these lock down the numerals.

import { PROGRESSION_PRESETS, resolveProgression, rotateRoot } from './progressions';

const presetNamed = (name: string) => PROGRESSION_PRESETS.find((p) => p.name === name)!;

describe('rotateRoot', () => {
  test('adds semitones from the key root', () => {
    expect(rotateRoot('C', 7)).toBe('G');
    expect(rotateRoot('D', 2)).toBe('E');
  });

  test('wraps at the octave', () => {
    expect(rotateRoot('B', 1)).toBe('C');
    expect(rotateRoot('A', 5)).toBe('D');
  });

  test('handles negative offsets without falling off the array', () => {
    expect(rotateRoot('C', -1)).toBe('B');
    expect(rotateRoot('E', -7)).toBe('A');
  });
});

describe('resolveProgression', () => {
  test('I–V–vi–IV in C resolves to C, G, Am, F', () => {
    const cards = resolveProgression(presetNamed('I–V–vi–IV'), 'C');
    // Root + type rather than `name`: F's stored display name is "F Major (Barre)",
    // and the builder cares that the right chord lands in the slot, not how it is titled.
    expect(cards.map((card) => `${card.chord.root} ${card.chord.type}`)).toEqual([
      'C Major',
      'G Major',
      'A Minor',
      'F Major',
    ]);
  });

  test('ii–V–I in D resolves to Em, A, D', () => {
    const cards = resolveProgression(presetNamed('ii–V–I'), 'D');
    expect(cards.map((card) => card.chord.name)).toEqual([
      'E Minor',
      'A Major',
      'D Major',
    ]);
  });

  test('changing the key re-roots the same preset', () => {
    const inG = resolveProgression(presetNamed('I–V–vi–IV'), 'G');
    expect(inG.map((card) => card.chord.name)).toEqual([
      'G Major',
      'D Major',
      'E Minor',
      'C Major',
    ]);
  });

  test('12-bar blues has twelve bars walking I–IV–V', () => {
    const cards = resolveProgression(presetNamed('12-bar blues'), 'C');
    expect(cards).toHaveLength(12);
    const roots = cards.map((card) => `${card.chord.root}${card.chord.type === 'Major' ? '' : 'm'}`);
    expect(roots.slice(0, 4)).toEqual(['C', 'C', 'C', 'C']);
    expect(roots.slice(4, 6)).toEqual(['F', 'F']);
    expect(roots[8]).toBe('G');
    expect(roots[11]).toBe('G');
  });

  test('card ids are stable per preset step, so reloading does not remount the grid', () => {
    const first = resolveProgression(presetNamed('ii–V–I'), 'C');
    const second = resolveProgression(presetNamed('ii–V–I'), 'F');
    expect(first.map((card) => card.id)).toEqual(second.map((card) => card.id));
  });

  test('every loaded card starts untransposed at the open position', () => {
    for (const preset of PROGRESSION_PRESETS) {
      for (const card of resolveProgression(preset, 'C')) {
        expect(card.transposeOffset).toBe(0);
        expect(card.fretPosition).toBe(0);
        expect(card.isMuted).toBe(undefined);
      }
    }
  });
});
