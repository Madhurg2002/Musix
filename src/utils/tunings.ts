// Tuning presets for the tuner screen — the data behind its instrument picker.
//
// Every string is stored as a MIDI note number; the note name, octave, and frequency
// derive from it through the same `midiToFrequency` formula the rest of the app uses, so
// a preset cannot ship a mistyped hertz value (the old table hand-typed all eighteen).
//
// Physical order convention: strings run low to high down each headstock column — the
// left column holds the first ceil(n/2) entries, the right column the rest. That mirrors
// how the old guitar presets were laid out and reads naturally as "pitch rises as you go
// down"; it is a stylised diagram, not a literal headstock map.
//
// Adding a tuning here makes it appear in the tuner's picker with no component changes.

import type { NoteName } from '../types';
import type { InstrumentType } from './audio';
import { midiToFrequency, noteNameAt } from './musicTheory';

/** Instrument groups, in the order they appear in the picker. `Custom` is only ever
    populated at runtime from the tuner's saved editor presets — never from this table. */
export type TuningFamily = 'Guitar' | 'Bass' | 'Ukulele' | 'Violin' | 'Mandolin' | 'Banjo' | 'Cello' | 'Custom';

/** One open string of a tuning. */
export interface TuningString {
  /** Player-facing string number (guitar/bass count up from the low string; ukulele and
      violin count 4 → 1 from the string nearest the player's face). */
  number: number;
  /** MIDI note of the open string (C4 = 60). Note, octave, and Hz derive from this. */
  baseMidi: number;
}

export interface TuningPreset {
  /** Shown in the picker under its family group. */
  name: string;
  family: TuningFamily;
  /** Sound-engine voice the reference tone plays with. */
  voice: InstrumentType;
  /** Open strings, low to high down each headstock column. */
  strings: readonly TuningString[];
}

/** A preset's strings with everything the tuner UI renders, derived from the MIDI data. */
export interface TuningStringInfo {
  /** String number — the tuner's peg identity. */
  index: number;
  note: NoteName;
  octave: number;
  frequency: number;
  side: 'left' | 'right';
}

export const TUNING_PRESETS: readonly TuningPreset[] = [
  // ── Guitar ──
  {
    name: 'Standard (E A D G B E)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 40 },
      { number: 5, baseMidi: 45 },
      { number: 4, baseMidi: 50 },
      { number: 3, baseMidi: 55 },
      { number: 2, baseMidi: 59 },
      { number: 1, baseMidi: 64 },
    ],
  },
  {
    name: 'Drop D (D A D G B E)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 38 },
      { number: 5, baseMidi: 45 },
      { number: 4, baseMidi: 50 },
      { number: 3, baseMidi: 55 },
      { number: 2, baseMidi: 59 },
      { number: 1, baseMidi: 64 },
    ],
  },
  {
    name: 'Half Step Down (E♭ A♭ D♭ G♭ B♭ E♭)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 39 },
      { number: 5, baseMidi: 44 },
      { number: 4, baseMidi: 49 },
      { number: 3, baseMidi: 54 },
      { number: 2, baseMidi: 58 },
      { number: 1, baseMidi: 63 },
    ],
  },
  {
    name: 'Open G (D G D G B E)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 38 },
      { number: 5, baseMidi: 43 },
      { number: 4, baseMidi: 50 },
      { number: 3, baseMidi: 55 },
      { number: 2, baseMidi: 59 },
      { number: 1, baseMidi: 64 },
    ],
  },
  {
    name: 'DADGAD (D A D G A D)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 38 },
      { number: 5, baseMidi: 45 },
      { number: 4, baseMidi: 50 },
      { number: 3, baseMidi: 55 },
      { number: 2, baseMidi: 57 },
      { number: 1, baseMidi: 62 },
    ],
  },
  {
    name: 'Drop C (C G C F A D)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 36 },
      { number: 5, baseMidi: 43 },
      { number: 4, baseMidi: 48 },
      { number: 3, baseMidi: 53 },
      { number: 2, baseMidi: 57 },
      { number: 1, baseMidi: 62 },
    ],
  },
  {
    name: 'Open D (D A D F♯ A D)',
    family: 'Guitar',
    voice: 'acoustic-guitar',
    strings: [
      { number: 6, baseMidi: 38 },
      { number: 5, baseMidi: 45 },
      { number: 4, baseMidi: 50 },
      { number: 3, baseMidi: 54 },
      { number: 2, baseMidi: 57 },
      { number: 1, baseMidi: 62 },
    ],
  },
  // ── Bass ──
  {
    name: 'Standard 4-String (E A D G)',
    family: 'Bass',
    voice: 'bass',
    strings: [
      { number: 4, baseMidi: 28 },
      { number: 3, baseMidi: 33 },
      { number: 2, baseMidi: 38 },
      { number: 1, baseMidi: 43 },
    ],
  },
  {
    name: '5-String (B E A D G)',
    family: 'Bass',
    voice: 'bass',
    strings: [
      { number: 5, baseMidi: 23 },
      { number: 4, baseMidi: 28 },
      { number: 3, baseMidi: 33 },
      { number: 2, baseMidi: 38 },
      { number: 1, baseMidi: 43 },
    ],
  },
  // ── Ukulele ──
  {
    // Reentrant tuning: the 4th string (g) sits above C and E, which is why the MIDI
    // numbers are not monotonic here — pitch order is not physical order on a ukulele.
    name: 'Standard Reentrant (g C E A)',
    family: 'Ukulele',
    voice: 'ukulele',
    strings: [
      { number: 4, baseMidi: 67 },
      { number: 3, baseMidi: 60 },
      { number: 2, baseMidi: 64 },
      { number: 1, baseMidi: 69 },
    ],
  },
  {
    name: 'Low-G (G C E A)',
    family: 'Ukulele',
    voice: 'ukulele',
    strings: [
      { number: 4, baseMidi: 55 },
      { number: 3, baseMidi: 60 },
      { number: 2, baseMidi: 64 },
      { number: 1, baseMidi: 69 },
    ],
  },
  // ── Violin ──
  {
    // The sound engine has no dedicated violin voice, so the reference tone uses the
    // acoustic guitar — the closest sustained plucked voice in the registry.
    name: 'Standard (G D A E)',
    family: 'Violin',
    voice: 'acoustic-guitar',
    strings: [
      { number: 4, baseMidi: 55 },
      { number: 3, baseMidi: 62 },
      { number: 2, baseMidi: 69 },
      { number: 1, baseMidi: 76 },
    ],
  },
  // ── Mandolin ──
  {
    // Same open pitches as violin (G D A E), different string count and voice.
    name: 'Standard (G D A E)',
    family: 'Mandolin',
    voice: 'acoustic-guitar',
    strings: [
      { number: 4, baseMidi: 55 },
      { number: 3, baseMidi: 62 },
      { number: 2, baseMidi: 69 },
      { number: 1, baseMidi: 76 },
    ],
  },
  // ── Banjo ──
  {
    // Open G (5-String): D G B D G — monotonic low→high; the short 5th string is a
    // fretboard detail this stylised headstock diagram does not model.
    name: 'Open G (D G B D G)',
    family: 'Banjo',
    voice: 'ukulele',
    strings: [
      { number: 5, baseMidi: 50 },
      { number: 4, baseMidi: 55 },
      { number: 3, baseMidi: 59 },
      { number: 2, baseMidi: 62 },
      { number: 1, baseMidi: 67 },
    ],
  },
  // ── Cello ──
  {
    // Standard C G D A; the bass voice sustains like a bowed low string far better
    // than a plucked one.
    name: 'Standard (C G D A)',
    family: 'Cello',
    voice: 'bass',
    strings: [
      { number: 4, baseMidi: 36 },
      { number: 3, baseMidi: 43 },
      { number: 2, baseMidi: 50 },
      { number: 1, baseMidi: 57 },
    ],
  },
];

/** Every family that has at least one preset, in picker order. */
export const TUNING_FAMILIES: readonly TuningFamily[] = [
  ...new Set(TUNING_PRESETS.map((preset) => preset.family)),
];

/**
 * Expand a preset into the note/octave/frequency rows the tuner renders.
 *
 * `opts` applies the tuner's two calibration axes: `a4` scales every frequency to a
 * non-standard concert pitch (A = 415–466 Hz) and `capo` shifts every target up N
 * semitones with its note name moving along. Defaults reproduce the plain 440-based
 * table exactly, so bare `resolveTuning(preset)` is unchanged.
 */
export function resolveTuning(
  preset: TuningPreset,
  opts: { a4?: number; capo?: number } = {}
): TuningStringInfo[] {
  const a4 = opts.a4 ?? 440;
  const capo = opts.capo ?? 0;
  const half = Math.ceil(preset.strings.length / 2);
  return preset.strings.map((string, position) => {
    const midi = string.baseMidi + capo;
    return {
      index: string.number,
      note: noteNameAt(midi),
      octave: Math.floor(midi / 12) - 1,
      frequency: Number((a4 * 2 ** ((midi - 69) / 12)).toFixed(2)),
      side: position < half ? 'left' : 'right',
    };
  });
}

/**
 * The frequency band a preset can actually produce — the tuner's detection cutoff.
 *
 * Derived from the preset's own strings, so every tuning ships with its range instead
 * of a hand-typed constant:
 *
 * - Low end: one octave below the lowest open string — room for drop tunings and for
 *   approaching the pitch from below while tuning up — but never below 25 Hz, so a
 *   5-string bass's B0 (30.9 Hz) passes while sub-bass rumble does not.
 * - High end: two octaves (24 frets) above the highest open string — the whole
 *   fingerboard, and nothing above the instrument's designed range.
 *
 * The single global band this replaces (55–1400 Hz) was wrong in both directions: it
 * cut a bass's low E1 (41.2 Hz) and B0 entirely, and clipped a violin's upper half.
 * Only the tuner needs this — the fretboard note finder and Song Follower keep the
 * default band, since they listen for any playable pitch rather than one instrument.
 */
export function tuningFrequencyRange(preset: TuningPreset): { min: number; max: number } {
  const midis = preset.strings.map((string) => string.baseMidi);
  const lowest = Math.min(...midis);
  const highest = Math.max(...midis);
  const min = Math.max(midiToFrequency(lowest) / 2, 25);
  const max = midiToFrequency(highest) * 4;
  return { min, max };
}
