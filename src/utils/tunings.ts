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

/** Instrument groups, in the order they appear in the picker. */
export type TuningFamily = 'Guitar' | 'Bass' | 'Ukulele' | 'Violin';

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
];

/** Every family that has at least one preset, in picker order. */
export const TUNING_FAMILIES: readonly TuningFamily[] = [
  ...new Set(TUNING_PRESETS.map((preset) => preset.family)),
];

/** Expand a preset into the note/octave/frequency rows the tuner renders. */
export function resolveTuning(preset: TuningPreset): TuningStringInfo[] {
  const half = Math.ceil(preset.strings.length / 2);
  return preset.strings.map((string, position) => ({
    index: string.number,
    note: noteNameAt(string.baseMidi),
    octave: Math.floor(string.baseMidi / 12) - 1,
    frequency: Number(midiToFrequency(string.baseMidi).toFixed(2)),
    side: position < half ? 'left' : 'right',
  }));
}
