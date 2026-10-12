// Pure meter math for the instrument tuner, extracted from GuitarTuner.tsx so the
// behaviour that decides what the needle and badges show can be unit-tested without a
// microphone or a DOM.
//
// The shape of this module is informed by TomSchimansky/GuitarTuner, whose needle runs
// through a rolling average of the last 30 estimates (~0.6 s) and whose note label must
// hold for 15 consecutive detections (~0.3 s) before it switches — both exist because a
// tuner that jitters or flickers between neighbour notes reads as broken. The helpers
// below carry those ideas in testable form, with spike rejection (median) instead of a
// plain mean and a shorter window, since our detector already gates on RMS.

/** Cents (+ sharp, − flat) of `frequency` against a target pitch, rounded for display. */
export function centsBetween(frequency: number, target: number): number {
  return Math.round(1200 * Math.log2(frequency / target));
}

/** Display form for a cents offset: `+12 ¢`, `−3 ¢`, or `0 ¢` (U+2212 is the real minus). */
export function centsLabel(cents: number): string {
  if (cents === 0) return '0 ¢';
  return `${cents > 0 ? '+' : '−'}${Math.abs(cents)} ¢`;
}

/** Equal-tempered frequency of a MIDI note at a given A4 reference (A4 = 69). */
export function noteFrequency(midi: number, a4 = 440): number {
  return a4 * 2 ** ((midi - 69) / 12);
}

/** Cents window for the IN TUNE badge (±4 ¢ ≈ a well-intonated ear). */
export const IN_TUNE_CENTS = 4;
/** Needle reaches ±45° at ±50 ¢ and clamps beyond. */
export const NEEDLE_MAX_CENTS = 50;
export const NEEDLE_MAX_DEGREES = 45;
/** Hold this long inside the in-tune window before the badge, peg ring, and chime
    commit. One lucky frame inside ±4 ¢ must not flash IN TUNE; the reference tuner
    gates its sound on 8 consecutive in-tune hits for the same reason. */
export const IN_TUNE_DWELL_MS = 400;
/** Consecutive frames of agreement before the displayed note changes (≈0.2 s at 60 fps,
    mirroring the reference tuner's 15 hits at ~47 Hz ≈ 0.3 s). */
export const NOTE_HYSTERESIS_FRAMES = 12;

export type MeterColorState = 'silent' | 'intune' | 'flat' | 'sharp';

/** Needle angle in degrees: ±45° across ±50 cents, clamped beyond. */
export function needleAngleFor(cents: number): number {
  const clamped = Math.min(Math.max((cents / NEEDLE_MAX_CENTS) * NEEDLE_MAX_DEGREES, -NEEDLE_MAX_DEGREES), NEEDLE_MAX_DEGREES);
  return Math.round(clamped * 10) / 10;
}

/** Which colour family the meter paints for this frame. */
export function meterColorState(
  detected: boolean,
  cents: number,
  confirmedInTune: boolean
): MeterColorState {
  if (!detected) return 'silent';
  if (confirmedInTune) return 'intune';
  return cents < 0 ? 'flat' : 'sharp';
}

/** CSS colour value (theme token) for a meter state. */
export function meterColorValue(state: MeterColorState): string {
  switch (state) {
    case 'intune':
      return 'var(--accent-success)';
    case 'flat':
      return 'var(--accent-highlight)';
    case 'sharp':
      return 'var(--accent-alert)';
    default:
      return 'rgba(var(--overlay-rgb), 0.45)';
  }
}

/**
 * Needle smoothing: a rolling median feeding an exponential moving average.
 *
 * The median window rejects single-frame outliers — one octave slip or breath must not
 * yank the needle across the dial — and the EMA is the damping that gives the needle
 * its settle. The reference tuner plain-averages 30 raw estimates; median + EMA reaches
 * a similar feel with less lag and better spike behaviour.
 */
export function createNeedleSmoother(windowSize = 11, alpha = 0.22) {
  const window: number[] = [];
  let smoothed: number | null = null;
  return {
    push(sample: number): number {
      window.push(sample);
      if (window.length > windowSize) window.shift();
      const sorted = [...window].sort((a, b) => a - b);
      const mid = sorted.length >> 1;
      const median = sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
      smoothed = smoothed === null ? median : smoothed + alpha * (median - smoothed);
      return smoothed;
    },
    reset(): void {
      window.length = 0;
      smoothed = null;
    },
  };
}

/**
 * Note-label hysteresis: a new nearest note must be seen for `neededFrames` consecutive
 * frames before the displayed note switches. The very first note commits immediately
 * (a tuner that shows nothing for 200 ms after the first pluck feels broken), and a
 * return to the already-committed note commits immediately too.
 */
export function createNoteHysteresis(neededFrames = NOTE_HYSTERESIS_FRAMES) {
  let committed: number | null = null;
  let pending: number | null = null;
  let streak = 0;
  return {
    observe(candidate: number | null): number | null {
      if (candidate === null) {
        pending = null;
        streak = 0;
        return committed;
      }
      if (committed === null) {
        committed = candidate;
        return committed;
      }
      if (candidate === committed) {
        pending = null;
        streak = 0;
        return committed;
      }
      if (candidate === pending) {
        streak += 1;
      } else {
        pending = candidate;
        streak = 1;
      }
      if (streak >= neededFrames) {
        committed = candidate;
        pending = null;
        streak = 0;
      }
      return committed;
    },
    reset(): void {
      committed = null;
      pending = null;
      streak = 0;
    },
  };
}

/**
 * "Hold still" chip over the recent cents trace: `null` until there is enough history,
 * otherwise graded by peak-to-peak spread — steady ≤4 ¢, moving ≤12 ¢, unsettled beyond.
 */
export function stabilityLabel(
  samples: readonly number[],
  recent = 20
): 'steady' | 'moving' | 'unsettled' | null {
  const slice = samples.slice(-recent);
  if (slice.length < Math.ceil(recent / 2)) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const value of slice) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const spread = max - min;
  if (spread <= 4) return 'steady';
  if (spread <= 12) return 'moving';
  return 'unsettled';
}
