import {
  IN_TUNE_CENTS,
  NOTE_HYSTERESIS_FRAMES,
  centsBetween,
  centsLabel,
  createNeedleSmoother,
  createNoteHysteresis,
  meterColorState,
  meterColorValue,
  needleAngleFor,
  noteFrequency,
  stabilityLabel,
} from './tunerMeter';

// The tuner's visual decisions live here rather than inside the component, because a
// meter that jumps, flickers, or paints the wrong state cannot be caught by `tsc` and
// could not be exercised without a microphone. These assert the maths the screen runs.

describe('tuner meter maths', () => {
  test('centsBetween measures sharp positive and flat negative', () => {
    expect(centsBetween(440, 440)).toBe(0);
    expect(centsBetween(442.2, 440)).toBe(9); // ~9.02 ¢
    expect(centsBetween(437.8, 440)).toBe(-9); // ~−9.02 ¢
    expect(centsBetween(880, 440)).toBe(1200); // exact octave
  });

  test('centsLabel uses the real minus and drops the sign at zero', () => {
    expect(centsLabel(0)).toBe('0 ¢');
    expect(centsLabel(12)).toBe('+12 ¢');
    expect(centsLabel(-3)).toBe('−3 ¢');
  });

  test('noteFrequency honours the A4 reference', () => {
    expect(noteFrequency(69)).toBe(440);
    expect(noteFrequency(69, 432)).toBe(432);
    expect(noteFrequency(81)).toBeCloseTo(880, 6); // A5 = one octave above A4
    expect(noteFrequency(57, 415)).toBeCloseTo(207.5, 6); // A3 = half of A4's reference
  });

  test('needle angle reaches ±45° at ±50 ¢ and clamps beyond', () => {
    expect(needleAngleFor(0)).toBe(0);
    expect(needleAngleFor(50)).toBe(45);
    expect(needleAngleFor(-50)).toBe(-45);
    expect(needleAngleFor(120)).toBe(45);
    expect(needleAngleFor(-120)).toBe(-45);
    expect(needleAngleFor(25)).toBe(22.5);
  });

  test('meter colour state: silence, confirmed in tune, flat, sharp', () => {
    expect(meterColorState(false, 0, false)).toBe('silent');
    expect(meterColorState(true, 2, true)).toBe('intune');
    expect(meterColorState(true, -2, false)).toBe('flat');
    expect(meterColorState(true, 30, false)).toBe('sharp');
    // A raw in-tune cents value without the dwell confirmation stays sharp-side (the
    // app's `centsOff < 0` convention) — one lucky frame inside ±4 ¢ must not flash
    // the in-tune colour.
    expect(meterColorState(true, 0, false)).toBe('sharp');
  });

  test('every colour state maps to a theme token', () => {
    for (const state of ['silent', 'intune', 'flat', 'sharp'] as const) {
      expect(meterColorValue(state)).toContain('var(');
    }
    expect(meterColorValue('silent')).toContain('rgba(');
  });
});

describe('needle smoother', () => {
  test('settles on a constant signal', () => {
    const smoother = createNeedleSmoother();
    let out = 0;
    for (let i = 0; i < 60; i++) out = smoother.push(100);
    expect(out).toBeCloseTo(100, 6);
  });

  test('a single spike cannot yank the needle', () => {
    const smoother = createNeedleSmoother();
    for (let i = 0; i < 20; i++) smoother.push(100);
    const out = smoother.push(400); // octave slip / breath
    expect(Math.abs(out - 100)).toBeLessThan(40);
  });

  test('a real step change is followed, not rejected', () => {
    const smoother = createNeedleSmoother();
    for (let i = 0; i < 20; i++) smoother.push(100);
    let out = 100;
    // The median window holds the old value until the new one fills its half, then the
    // EMA settles: 0.78^n decays to well under 1e-4 after 80 frames (~1.3 s at 60 fps).
    for (let i = 0; i < 80; i++) out = smoother.push(200);
    expect(out).toBeCloseTo(200, 4);
  });

  test('reset returns to the next sample', () => {
    const smoother = createNeedleSmoother();
    smoother.push(100);
    smoother.push(100);
    smoother.reset();
    expect(smoother.push(500)).toBe(500);
  });
});

describe('note hysteresis', () => {
  test('first note commits immediately', () => {
    const hysteresis = createNoteHysteresis(3);
    expect(hysteresis.observe(40)).toBe(40);
  });

  test('a new note must hold for the full streak before the label switches', () => {
    const hysteresis = createNoteHysteresis(3);
    hysteresis.observe(40);
    expect(hysteresis.observe(41)).toBe(40); // pending 1
    expect(hysteresis.observe(41)).toBe(40); // pending 2
    expect(hysteresis.observe(41)).toBe(41); // streak complete → committed
    expect(hysteresis.observe(41)).toBe(41);
  });

  test('an interrupted streak restarts instead of committing', () => {
    const hysteresis = createNoteHysteresis(3);
    hysteresis.observe(40);
    hysteresis.observe(41);
    hysteresis.observe(41);
    expect(hysteresis.observe(40)).toBe(40); // back to committed — streak dropped
    expect(hysteresis.observe(41)).toBe(40); // must start over
    expect(hysteresis.observe(41)).toBe(40);
    expect(hysteresis.observe(41)).toBe(41);
  });

  test('default streak matches the documented frame count', () => {
    const hysteresis = createNoteHysteresis();
    hysteresis.observe(60);
    for (let i = 1; i < NOTE_HYSTERESIS_FRAMES; i++) expect(hysteresis.observe(61)).toBe(60);
    expect(hysteresis.observe(61)).toBe(61);
  });
});

describe('stability chip', () => {
  test('needs at least half the window before it speaks', () => {
    expect(stabilityLabel([])).toBeNull();
    expect(stabilityLabel([0, 1, 0])).toBeNull();
  });

  test('grades the recent trace by peak-to-peak spread', () => {
    const tight = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 0 : 2));
    expect(stabilityLabel(tight)).toBe('steady');
    const wobble = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? -5 : 5));
    expect(stabilityLabel(wobble)).toBe('moving');
    const wild = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? -30 : 30));
    expect(stabilityLabel(wild)).toBe('unsettled');
  });

  test('only the recent tail counts', () => {
    const past = Array.from({ length: 60 }, () => 40); // old, wildly off but stable
    const recent = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 0 : 2));
    expect(stabilityLabel([...past, ...recent])).toBe('steady');
  });
});

test('in-tune tolerance constant is the documented ±4 cents', () => {
  expect(IN_TUNE_CENTS).toBe(4);
});
