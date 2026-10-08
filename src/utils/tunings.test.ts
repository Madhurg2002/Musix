import { midiToFrequency } from './musicTheory';
import { TUNING_FAMILIES, TUNING_PRESETS, resolveTuning, tuningFrequencyRange } from './tunings';

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
    expect([...TUNING_FAMILIES]).toEqual([
      'Guitar',
      'Bass',
      'Ukulele',
      'Violin',
      'Mandolin',
      'Banjo',
      'Cello',
    ]);
    // Custom is a runtime-only group assembled by the tuner from saved editor presets;
    // it must never leak into the static table.
    expect(TUNING_FAMILIES).not.toContain('Custom');
    for (const family of TUNING_FAMILIES) {
      expect(TUNING_PRESETS.some((preset) => preset.family === family)).toBe(true);
    }
  });

  test('resolveTuning applies A4 calibration and capo; defaults reproduce the table', () => {
    const preset = TUNING_PRESETS.find((candidate) => candidate.name.startsWith('Standard (E'))!;
    const plain = resolveTuning(preset);
    expect(resolveTuning(preset, { a4: 440, capo: 0 })).toEqual(plain);

    // Capo 2 shifts every target two frets up and the note names travel with it.
    const capo2 = resolveTuning(preset, { capo: 2 });
    expect(capo2[0]!.frequency).toBeCloseTo(92.5, 1); // F♯2, was E2
    expect(capo2[0]!.octave).toBe(2);
    expect(capo2[5]!.frequency).toBeCloseTo(369.99, 1); // F♯4, was E4

    // A baroque reference scales every frequency down with it.
    const baroque = resolveTuning(preset, { a4: 415 });
    expect(baroque[0]!.frequency).toBeCloseTo(77.72, 1); // E2 at A = 415
    expect(baroque[5]!.frequency).toBeCloseTo(310.9, 1); // E4 at A = 415
    expect(baroque[0]!.note).toBe(plain[0]!.note); // calibration changes pitch, not names
  });
});

// The tuner's detection cutoff derives from each preset's strings — a wrong margin
// either cuts real notes (the global 55–1400 Hz band it replaces could not tune a
// bass's low E or a violin's upper half) or lets room noise drive the needle. These
// assert the band invariants for every preset, plus the two regressions that motivated
// the change.

describe('tuner frequency cutoff', () => {
  test('every preset yields a band that contains all of its open strings', () => {
    for (const preset of TUNING_PRESETS) {
      const { min, max } = tuningFrequencyRange(preset);
      expect(min).toBeLessThan(max);
      expect(min).toBeGreaterThanOrEqual(25); // rumble floor
      for (const { frequency } of resolveTuning(preset)) {
        expect(frequency).toBeGreaterThan(min);
        expect(frequency).toBeLessThan(max);
      }
    }
  });

  test('the low end sits below the lowest open string, so tuning up from below works', () => {
    for (const preset of TUNING_PRESETS) {
      const { min } = tuningFrequencyRange(preset);
      const lowest = Math.min(...preset.strings.map((string) => string.baseMidi));
      expect(min).toBeLessThan(midiToFrequency(lowest));
    }
  });

  test('the high end reaches 24 frets above the highest open string', () => {
    for (const preset of TUNING_PRESETS) {
      const { max } = tuningFrequencyRange(preset);
      const highest = Math.max(...preset.strings.map((string) => string.baseMidi));
      expect(max).toBeCloseTo(midiToFrequency(highest + 24), 0);
    }
  });

  test('regression: the old global band cut real notes — bass and violin pass now', () => {
    const bass = TUNING_PRESETS.find((preset) =>
      preset.name.startsWith('Standard 4-String')
    )!;
    expect(tuningFrequencyRange(bass).min).toBeLessThan(41.2); // low E1, cut at 55 before

    const fiveString = TUNING_PRESETS.find((preset) => preset.name.startsWith('5-String'))!;
    expect(tuningFrequencyRange(fiveString).min).toBeLessThan(30.9); // low B0

    const violin = TUNING_PRESETS.find((preset) => preset.family === 'Violin')!;
    expect(tuningFrequencyRange(violin).max).toBeGreaterThan(1400); // cut at 1400 before
  });
});
