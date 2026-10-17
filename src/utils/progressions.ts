// Named chord progressions for the Chord Studio's progression builder.
//
// A preset is a list of scale-degree offsets from a key root; resolving one turns it into
// the chord cards the studio already knows how to draw, transpose, and play. Keeping the
// resolver pure (no component state, no sound) means the presets can be unit tested and
// the component only decides when to load them.

import { ChordCardItem, NoteName } from '../types';
import { findOrCreateChord } from '../data/chordsData';
import { ALL_NOTES } from './musicTheory';

/** One step of a preset: semitones above the key root, and the chord quality on it. */
export interface ProgressionDegree {
  offset: number;
  type: string;
}

export interface ProgressionPreset {
  /** Stable id — used as the React key and in the loaded cards' ids. */
  id: string;
  /** Display name, written with the numerals learners see in theory books. */
  name: string;
  /** Tooltip: says what loading this preset does. */
  tip: string;
  degrees: readonly ProgressionDegree[];
}

/**
 * The three presets the plan named. Offsets follow the major scale
 * (I=0, ii=2, iii=4, IV=5, V=7, vi=9, vii=11), so changing the key re-roots every chord.
 */
export const PROGRESSION_PRESETS: readonly ProgressionPreset[] = [
  {
    id: '1564',
    name: 'I–V–vi–IV',
    tip: 'Load the pop progression — the sound of a thousand songs',
    degrees: [
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
      { offset: 9, type: 'Minor' },
      { offset: 5, type: 'Major' },
    ],
  },
  {
    id: '251',
    name: 'ii–V–I',
    tip: 'Load the jazz turnaround that resolves back home',
    degrees: [
      { offset: 2, type: 'Minor' },
      { offset: 7, type: 'Major' },
      { offset: 0, type: 'Major' },
    ],
  },
  {
    id: '12bar',
    name: '12-bar blues',
    tip: 'Load twelve bars of I, IV and V',
    degrees: [
      // | I  I  I  I | IV IV I  I | V  IV I  V  |
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
      { offset: 5, type: 'Major' },
      { offset: 0, type: 'Major' },
      { offset: 7, type: 'Major' },
    ],
  },
];

/** The note `offset` semitones above `key`, wrapping at the octave. */
export function rotateRoot(key: NoteName, offset: number): NoteName {
  const index = ALL_NOTES.indexOf(key);
  if (index < 0) return key;
  // +144 keeps every realistic negative offset inside one add-and-modulo.
  return ALL_NOTES[(index + offset + 144) % 12]!;
}

// Chromatic degrees, spelled the way a chord chart writes them relative to the key.
const DEGREE_NUMERALS: readonly string[] = [
  'I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII',
];

/**
 * The chord chart numeral for `root` inside `key` — `I`, `ii`, `V7`, `♭VII`, `vii°`.
 *
 * The progression chart needs it to say what each chord is *doing* in the key, which is the
 * part a list of names cannot show. Qualities follow the usual convention: upper case for
 * major, lower for minor, diminished and augmented, with the extension appended.
 */
export function romanNumeralFor(root: NoteName, type: string, key: NoteName): string {
  const rootIndex = ALL_NOTES.indexOf(root);
  const keyIndex = ALL_NOTES.indexOf(key);
  if (rootIndex < 0 || keyIndex < 0) return '';

  const numeral = DEGREE_NUMERALS[(rootIndex - keyIndex + 144) % 12] ?? '';
  const quality = type.toLowerCase();

  if (quality === 'major') return numeral;
  if (quality === '7th') return `${numeral}7`;
  if (quality === 'major 7th') return `${numeral}maj7`;
  if (quality === 'minor') return numeral.toLowerCase();
  if (quality === 'diminished') return `${numeral.toLowerCase()}°`;
  if (quality === 'augmented') return `${numeral}+`;
  if (quality === 'suspended') return `${numeral}sus`;
  return numeral;
}

/** Where a progression run is: which audible beat, and whether it is held. */
export interface PlaybackRun {
  index: number;
  paused: boolean;
}

/**
 * Begin a run over `total` audible beats, or `null` when there is nothing to play.
 * Returning `null` for an empty set keeps the caller from starting a run it would have to
 * end on the next tick.
 */
export function startRun(total: number): PlaybackRun | null {
  return total > 0 ? { index: 0, paused: false } : null;
}

/**
 * Hold the run, or carry on from where it stopped — the index survives, so Resume replays
 * the chord it paused on instead of jumping to the next one or back to the start.
 */
export function toggleRunPause(run: PlaybackRun | null): PlaybackRun | null {
  return run ? { index: run.index, paused: !run.paused } : null;
}

/**
 * The beat after `index` in a run of `total` beats, or null when the run is finished.
 *
 * Progression playback walks one beat at a time instead of queueing every beat up front:
 * a queue of timers could be cancelled but never *paused*, and an out-of-range index has
 * to end the run rather than fall off the end of the card list.
 */
export function nextPlaybackBeat(index: number, total: number): number | null {
  if (!Number.isFinite(index) || !Number.isFinite(total) || total <= 0) return null;
  const next = Math.trunc(index) + 1;
  return next >= total ? null : next;
}

/** Move a run on by one beat, or end it (`null`) after the last one. */
export function advanceRun(run: PlaybackRun | null, total: number): PlaybackRun | null {
  if (!run) return null;
  const next = nextPlaybackBeat(run.index, total);
  return next === null ? null : { index: next, paused: run.paused };
}

/**
 * Turn a preset into the studio's card items, ready to drop into state. Ids are stable
 * per preset step so React reuses the card nodes when the same preset is re-loaded in a
 * different key.
 */
export function resolveProgression(
  preset: ProgressionPreset,
  key: NoteName
): ChordCardItem[] {
  return preset.degrees.map((degree, index) => ({
    id: `prog-${preset.id}-${index}`,
    chord: findOrCreateChord(rotateRoot(key, degree.offset), degree.type),
    transposeOffset: 0,
    fretPosition: 0,
  }));
}
