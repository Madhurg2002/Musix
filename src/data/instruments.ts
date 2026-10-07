// The instrument registry — the single source of truth for every instrument the app can
// play and draw.
//
// Each entry binds three things together: the voice id the sound engine plays, the layout
// family that decides how a chord card renders it (a fret grid or a keyboard), and, for
// fretted instruments, the tuning chord voicings are searched against. Menus (TopBar,
// Chord Studio) and the preference validator read the same list, so adding an instrument
// here is what makes it appear everywhere.
//
// See docs/ADDING-AN-INSTRUMENT.md for the full checklist.

import type { NoteName } from '../types';
import type { InstrumentType } from '../utils/audio';
import { GUITAR_STRINGS } from '../utils/musicTheory';

/** One open string of a fretted instrument. */
export interface InstrumentString {
  name: NoteName;
  octave: number;
  /** MIDI note number of the open string (C4 = 60). */
  baseMidi: number;
}

/**
 * How a chord card draws the instrument:
 * - `fretted` — a string grid with frets and fingers, voiced against `strings`.
 * - `keyboard` — a piano strip with the chord tones lit.
 */
export type InstrumentLayout = 'fretted' | 'keyboard';

export interface InstrumentDefinition {
  /** Voice id — must match a `case` in the sound engine (`src/utils/audio.ts`). */
  id: InstrumentType;
  /** Name shown in menus and on the chord studio's instrument chips. */
  label: string;
  layout: InstrumentLayout;
  /**
   * Tuning, low pitch to high. Index `i` here is `frets[i]` of a chord shape, so the
   * array order is the data convention, not the order strings are drawn (grids draw the
   * highest string on top, like tablature). Empty for keyboard instruments.
   */
  strings: readonly InstrumentString[];
  /** Highest fret the voicing search may press — also the chord studio slider's ceiling. */
  maxFret: number;
}

/**
 * Standard six-string guitar tuning, shared by both guitar voices. It is the same table
 * `musicTheory.GUITAR_STRINGS` has always used: stored chord shapes in `chordsData.ts`
 * were written against it, so the registry reuses it rather than restating it.
 */
const STANDARD_GUITAR: readonly InstrumentString[] = GUITAR_STRINGS;

export const INSTRUMENTS: readonly InstrumentDefinition[] = [
  {
    id: 'acoustic-guitar',
    label: 'Acoustic guitar',
    layout: 'fretted',
    strings: STANDARD_GUITAR,
    maxFret: 20,
  },
  {
    id: 'electric-guitar',
    label: 'Electric guitar',
    layout: 'fretted',
    strings: STANDARD_GUITAR,
    maxFret: 20,
  },
  // Entry order is menu order: the top bar's select and the studio's chips both render
  // the registry top to bottom, so keep the voices where learners already expect them.
  { id: 'piano', label: 'Grand piano', layout: 'keyboard', strings: [], maxFret: 0 },
  {
    id: 'bass',
    label: 'Bass guitar',
    layout: 'fretted',
    // Standard four-string bass: E1 A1 D2 G2.
    strings: [
      { name: 'E', octave: 1, baseMidi: 28 },
      { name: 'A', octave: 1, baseMidi: 33 },
      { name: 'D', octave: 2, baseMidi: 38 },
      { name: 'G', octave: 2, baseMidi: 43 },
    ],
    maxFret: 20,
  },
  {
    id: 'ukulele',
    label: 'Ukulele',
    layout: 'fretted',
    // Reentrant gCEA tuning, listed low to high by pitch (C4 E4 G4 A4).
    strings: [
      { name: 'C', octave: 4, baseMidi: 60 },
      { name: 'E', octave: 4, baseMidi: 64 },
      { name: 'G', octave: 4, baseMidi: 67 },
      { name: 'A', octave: 4, baseMidi: 69 },
    ],
    maxFret: 15,
  },
  { id: 'synth', label: 'Synth pad', layout: 'keyboard', strings: [], maxFret: 0 },
];

/** Every playable voice id, in registry order. */
export const INSTRUMENT_IDS: readonly InstrumentType[] = INSTRUMENTS.map((def) => def.id);

/** Menu names, derived so a label can never drift from its entry. */
export const INSTRUMENT_LABELS: Readonly<Record<InstrumentType, string>> = Object.fromEntries(
  INSTRUMENTS.map((def) => [def.id, def.label])
) as Readonly<Record<InstrumentType, string>>;

/**
 * Look up one definition. Unknown ids fall back to the acoustic guitar — the same voice
 * the sound engine falls back to — so a stale saved preference degrades instead of
 * crashing a render.
 */
export function instrumentFor(id: InstrumentType): InstrumentDefinition {
  return INSTRUMENTS.find((def) => def.id === id) ?? INSTRUMENTS[0]!;
}
