// Learner preferences that survive a reload.
//
// Two rules shape this file:
//
// 1. **Permission first.** Nothing is written until the learner allows preference storage
//    (see `consent.ts`). Before that, writes are held in memory for the session; a refusal
//    discards them. The stored form is first-party cookies, one per preference, so what is
//    kept is inspectable and clearable like any other site data.
// 2. **Validate on read.** Storage can hold anything — values from an older build,
//    hand-edited junk, a partially written entry — and a bad value must never reach a
//    screen mid-render, so an unreadable or invalid entry falls back to the caller's
//    default instead of throwing.
//
// A value too big for the 4 KB cookie cap (a long pasted chord chart) spills into
// `localStorage` instead; that path only runs once permission has been given.

import { ALL_NOTES } from './musicTheory';
import type { NoteName } from '../types';
import { eraseCookie, readCookie, writeCookie } from './cookies';
import { hasConsent, whenGranted } from './consent';

const PREFIX = 'musix.pref.';

/** Headroom for the cookie name and attributes inside the 4 KB-per-cookie cap. */
const MAX_COOKIE_VALUE = 3500;

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

/** Raw stored text for a key: the cookie, or the local overflow copy behind it. */
function readRaw(key: string): string | null {
  // Without permission nothing was written, so there is nothing to read.
  if (!hasConsent()) return null;
  const name = storageKey(key);
  const fromCookie = readCookie(name);
  if (fromCookie !== null) return fromCookie;
  try {
    return localStorage.getItem(name);
  } catch {
    return null;
  }
}

/** Persist one already-encoded value, choosing the store that fits its size. */
function storeRaw(key: string, raw: string): void {
  const name = storageKey(key);
  try {
    if (raw.length <= MAX_COOKIE_VALUE) {
      writeCookie(name, raw);
      try {
        localStorage.removeItem(name); // superseded an overflow copy
      } catch {
        // Blocked storage just means the overflow copy stays stale; the cookie wins on read.
      }
    } else {
      eraseCookie(name);
      localStorage.setItem(name, raw);
    }
  } catch {
    // Private mode can block storage; nothing to do and nothing to tell the learner.
  }
}

/** Read and validate a stored value, falling back when it is missing, blocked, or invalid. */
export function readPreference<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => value is T
): T {
  try {
    const raw = readRaw(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Persist a value. Without permission the write is held for the session (and released if
 * the learner allows storage); a refusal or blocked storage only means the choice lasts
 * until the page is reloaded.
 */
export function writePreference(key: string, value: unknown): void {
  let raw: string | undefined;
  try {
    raw = JSON.stringify(value);
  } catch {
    return; // Unserialisable values are not worth a silent partial write.
  }
  if (raw === undefined) return;
  whenGranted(() => storeRaw(key, raw));
}

export function clearPreference(key: string): void {
  const name = storageKey(key);
  eraseCookie(name);
  try {
    localStorage.removeItem(name);
  } catch {
    // Same as above.
  }
}

/** Forget every preference — used when the learner withdraws permission. */
export function clearAllPreferences(): void {
  for (const key of Object.values(PREFERENCE_KEYS)) clearPreference(key);
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
