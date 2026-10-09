// Learner preferences that survive a reload.
//
// Every read validates the stored value before trusting it. Storage can hold anything —
// values from an older build, hand-edited junk, a partially written entry — and a bad value
// must never reach a screen mid-render, so an unreadable or invalid entry falls back to the
// caller's default instead of throwing.

import { ALL_NOTES } from './musicTheory';
import type { NoteName } from '../types';

const PREFIX = 'musix.pref.';

/** Preference slots. Keys are stable: renaming one silently drops what a learner saved. */
export const PREFERENCE_KEYS = {
  root: 'root',
  instrument: 'instrument',
  visualizer: 'visualizer',
  scaleId: 'scaleId',
  songChart: 'songChart',
  songBpm: 'songBpm',
  songBeatsPerChord: 'songBeatsPerChord',
  songTranspose: 'songTranspose',
  songSoundOn: 'songSoundOn',
} as const;

function storageKey(key: string): string {
  return `${PREFIX}${key}`;
}

/** Read and validate a stored value, falling back when it is missing, blocked, or invalid. */
export function readPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): T {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** Persist a value. Storage being blocked only means the session is not remembered. */
export function writePreference(key: string, value: unknown): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Private mode can block storage; nothing to do and nothing to tell the learner.
  }
}

export function clearPreference(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // Same as above.
  }
}

/* ----------------------------------------------------------------------------- validators */

/** String restricted to a known set of ids. */
export function isOneOf<T extends string>(
  ...allowed: readonly T[]
): (value: unknown) => value is T {
  return (value: unknown): value is T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

/** Value restricted to a known set, for non-string options such as numeric presets. */
export function isOneOfValue<T>(allowed: readonly T[]): (value: unknown) => value is T {
  return (value: unknown): value is T => allowed.includes(value as T);
}

export const isText = (value: unknown): value is string => typeof value === 'string';

export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';

/** Finite number inside an inclusive range, so a tampered tempo cannot break playback. */
export function isNumberInRange(min: number, max: number): (value: unknown) => value is number {
  return (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

/** Finite integer inside an inclusive range. */
export function isIntegerInRange(min: number, max: number): (value: unknown) => value is number {
  return (value: unknown): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export const isNoteName = isOneOf<NoteName>(...ALL_NOTES);
