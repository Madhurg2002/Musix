import { TUNING_FAMILIES, TUNING_PRESETS, resolveTuning } from './tunings';

// The tuner's preset table ships pitch data — a mistyped MIDI number tunes a learner to
// the wrong note, which no compiler or visual check catches. These assert the reference
// pitches against known frequencies (A4 = 440 Hz throughout).

describe('tuner tunings', () => {
  test('standard guitar resolves to the reference pitches', () => {
    const preset = TUNING_PRESETS.find((candidate) => candidate.name.startsWith('Standard (E'))!;
    const strings = resolveTuning(preset);
    expect(strings.map((string) => `${string.note}${string.octave}`)).toEqual([
      'E2',
      'A2',
      'D3',
      'G3',
      'B3',
      'E4',
    ]);
    expect(strings[0]!.frequency).toBe(82.41); // low E
    expect(strings[5]!.frequency).toBe(329.63); // high E
  });

  test('bass standard resolves to E1 A1 D2 G2 with two pegs a side', () => {
    const preset = TUNING_PRESETS.find((candidate) =>
      candidate.name.startsWith('Standard 4-String')
    )!;
    const strings = resolveTuning(preset);
    expect(strings.map((string) => `${string.note}${string.octave}`)).toEqual([
      'E1',
      'A1',
      'D2',
      'G2',
    ]);
    expect(strings[0]!.frequency).toBe(41.2);
    expect(strings.filter((string) => string.side === 'left')).toHaveLength(2);
    expect(strings.filter((string) => string.side === 'right')).toHaveLength(2);
  });

  test('five-string bass splits three pegs left and two right, low B first', () => {
    const preset = TUNING_PRESETS.find((candidate) => candidate.name.startsWith('5-String'))!;
    const strings = resolveTuning(preset);
    expect(strings.filter((string) => string.side === 'left')).toHaveLength(3);
    expect(strings.filter((string) => string.side === 'right')).toHaveLength(2);
    expect(`${strings[0]!.note}${strings[0]!.octave}`).toBe('B0');
  });

  test('ukulele keeps reentrant physical order (4 to 1) even though pitches are not monotonic', () => {
    const preset = TUNING_PRESETS.find((candidate) =>
      candidate.name.startsWith('Standard Reentrant')
    )!;
    const strings = resolveTuning(preset);
    expect(strings.map((string) => string.index)).toEqual([4, 3, 2, 1]);
    expect(strings.map((string) => `${string.note}${string.octave}`)).toEqual([
      'G4',
      'C4',
      'E4',
      'A4',
    ]);
    expect(strings[3]!.frequency).toBe(440); // the A string is the reference pitch itself
  });

  test('violin resolves to G3 D4 A4 E5', () => {
    const preset = TUNING_PRESETS.find((candidate) => candidate.family === 'Violin')!;
    const strings = resolveTuning(preset);
    expect(strings.map((string) => `${string.note}${string.octave}`)).toEqual([
      'G3',
      'D4',
      'A4',
      'E5',
    ]);
    expect(strings[0]!.frequency).toBe(196);
    expect(strings[3]!.frequency).toBe(659.26);
  });

  test('every preset has unique string numbers and at least four strings', () => {
    for (const preset of TUNING_PRESETS) {
      const numbers = preset.strings.map((string) => string.number);
      expect(new Set(numbers).size).toBe(numbers.length);
      expect(preset.strings.length).toBeGreaterThanOrEqual(4);
      expect(preset.voice.length).toBeGreaterThan(0);
    }
  });

  test('families list in picker order and every family has a preset', () => {
    expect([...TUNING_FAMILIES]).toEqual(['Guitar', 'Bass', 'Ukulele', 'Violin']);
    for (const family of TUNING_FAMILIES) {
      expect(TUNING_PRESETS.some((preset) => preset.family === family)).toBe(true);
    }
  });
});
