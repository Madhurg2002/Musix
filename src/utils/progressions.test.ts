// The progression builder replaces the whole card set at once, so a wrong offset here
// means every card in a loaded progression is wrong — these lock down the numerals.

import {
  PROGRESSION_PRESETS,
  advanceRun,
  nextPlaybackBeat,
  resolveProgression,
  romanNumeralFor,
  rotateRoot,
  startRun,
  toggleRunPause,
} from './progressions';

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
    // Root + type rather than `name`: the builder cares that the right chord lands in the
    // slot, not how it is titled (names come from `chordDisplayName`).
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

describe('nextPlaybackBeat', () => {
  test('walks one beat at a time', () => {
    expect(nextPlaybackBeat(0, 4)).toBe(1);
    expect(nextPlaybackBeat(2, 4)).toBe(3);
  });

  test('ends the run after the last beat', () => {
    // Null is what stops playback: returning the length itself would index past the cards.
    expect(nextPlaybackBeat(3, 4)).toBe(null);
    expect(nextPlaybackBeat(11, 12)).toBe(null);
  });

  test('ends rather than starts on an empty or invalid run', () => {
    expect(nextPlaybackBeat(0, 0)).toBe(null);
    expect(nextPlaybackBeat(0, -3)).toBe(null);
    expect(nextPlaybackBeat(Number.NaN, 4)).toBe(null);
  });

  test('every step of a twelve-bar run stays inside the cards, then stops', () => {
    let index: number | null = 0;
    const visited: number[] = [];
    while (index !== null) {
      visited.push(index);
      index = nextPlaybackBeat(index, 12);
    }
    expect(visited).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('progression run', () => {
  test('starts on the first beat', () => {
    expect(startRun(8)).toEqual({ index: 0, paused: false });
  });

  test('refuses to start on an empty board', () => {
    // A run with no beats would end on its first tick; the button is disabled instead.
    expect(startRun(0)).toBe(null);
  });

  test('pause and resume keep the position', () => {
    const running = { index: 3, paused: false };
    const paused = toggleRunPause(running)!;
    expect(paused).toEqual({ index: 3, paused: true });
    // Resume replays the chord it stopped on, so the index must not move either way.
    expect(toggleRunPause(paused)).toEqual({ index: 3, paused: false });
  });

  test('pausing an idle run does nothing', () => {
    expect(toggleRunPause(null)).toBe(null);
  });

  test('advancing carries the paused flag with it', () => {
    expect(advanceRun({ index: 0, paused: true }, 4)).toEqual({ index: 1, paused: true });
  });

  test('the run ends after the last beat and cannot be advanced past it', () => {
    expect(advanceRun({ index: 3, paused: false }, 4)).toBe(null);
    expect(advanceRun(null, 4)).toBe(null);
  });

  test('pause → resume → play out a four-bar run reaches every beat once', () => {
    let run = startRun(4);
    const heard: number[] = [];
    while (run) {
      heard.push(run.index);
      if (run.index === 1) {
        run = toggleRunPause(run);
        expect(run).toEqual({ index: 1, paused: true });
        run = toggleRunPause(run);
        expect(run).toEqual({ index: 1, paused: false });
      }
      run = advanceRun(run, 4);
    }
    expect(heard).toEqual([0, 1, 2, 3]);
  });
});

describe('romanNumeralFor', () => {
  test('names each preset chord by what it is doing in the key', () => {
    // The chart view labels every card this way, so a wrong numeral would mislabel the
    // whole progression at once.
    expect(romanNumeralFor('C', 'Major', 'C')).toBe('I');
    expect(romanNumeralFor('D', 'Minor', 'C')).toBe('ii');
    expect(romanNumeralFor('E', 'Minor', 'C')).toBe('iii');
    expect(romanNumeralFor('F', 'Major', 'C')).toBe('IV');
    expect(romanNumeralFor('G', 'Major', 'C')).toBe('V');
    expect(romanNumeralFor('A', 'Minor', 'C')).toBe('vi');
  });

  test('follows the key the progression was resolved in', () => {
    expect(romanNumeralFor('G', 'Major', 'G')).toBe('I');
    expect(romanNumeralFor('D', 'Major', 'G')).toBe('V');
    expect(romanNumeralFor('A', 'Minor', 'G')).toBe('ii');
    expect(romanNumeralFor('D', 'Major', 'D')).toBe('I');
  });

  test('spells chromatic degrees and extensions', () => {
    expect(romanNumeralFor('A♯', 'Major', 'C')).toBe('♭VII');
    expect(romanNumeralFor('B', 'Major', 'C')).toBe('VII');
    expect(romanNumeralFor('F♯', 'Major', 'C')).toBe('♯IV');
    expect(romanNumeralFor('C', '7th', 'C')).toBe('I7');
    expect(romanNumeralFor('G', '7th', 'C')).toBe('V7');
    expect(romanNumeralFor('C', 'Major 7th', 'C')).toBe('Imaj7');
  });

  test('a twelve-bar blues in C reads I I I I IV IV I I V IV I V', () => {
    const blues = resolveProgression(presetNamed('12-bar blues'), 'C');
    expect(blues.map((card) => romanNumeralFor(card.chord.root, card.chord.type, 'C'))).toEqual([
      'I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V',
    ]);
  });
});
