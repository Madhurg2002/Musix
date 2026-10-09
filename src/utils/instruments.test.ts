// Tests for the instrument registry and the per-instrument voicing maths it feeds.
//
// The registry is the contract between the sound engine, the chord studio, and the menus:
// every voice the engine can play must have exactly one entry, and the voicing search must
// produce playable frets on every fretted tuning — not just guitar.

import { findOrCreateChord } from '../data/chordsData';
import {
  INSTRUMENTS,
  INSTRUMENT_IDS,
  INSTRUMENT_LABELS,
  instrumentFor,
  type InstrumentDefinition,
} from '../data/instruments';
import type { InstrumentType } from './audio';
import { GUITAR_STRINGS, midiToFrequency } from './musicTheory';
import {
  chordFrequencies,
  chordPositionForStrings,
  keyboardMidis,
  transposeChordShape,
} from './chordVoicing';

/** The `InstrumentType` union in `src/utils/audio.ts`, restated as a tripwire. */
const ENGINE_VOICES: readonly InstrumentType[] = [
  'acoustic-guitar',
  'electric-guitar',
  'piano',
  'bass',
  'ukulele',
  'synth',
];

const cMajor = findOrCreateChord('C', 'Major');
const aMajor = findOrCreateChord('A', 'Major');
const bMinor = findOrCreateChord('B', 'Minor');

describe('instrument registry', () => {
  test('every sound-engine voice has exactly one entry', () => {
    expect([...INSTRUMENT_IDS]).toEqual([...ENGINE_VOICES]);
    expect(new Set(INSTRUMENT_IDS).size).toBe(INSTRUMENTS.length);
  });

  test('labels and lookups exist for every voice', () => {
    for (const id of ENGINE_VOICES) {
      expect(INSTRUMENT_LABELS[id].length).toBeGreaterThan(0);
      expect(instrumentFor(id).id).toBe(id);
    }
  });

  test('an unknown id falls back to the acoustic guitar', () => {
    expect(instrumentFor('banjo' as InstrumentType).id).toBe('acoustic-guitar');
  });

  test('fretted instruments declare a low-to-high tuning and a fret ceiling', () => {
    for (const def of INSTRUMENTS) {
      if (def.layout !== 'fretted') {
        expect(def.strings.length).toBe(0);
        continue;
      }
      expect(def.strings.length).toBeGreaterThanOrEqual(4);
      expect(def.maxFret).toBeGreaterThan(0);
      for (let index = 1; index < def.strings.length; index += 1) {
        expect(def.strings[index]!.baseMidi).toBeGreaterThan(def.strings[index - 1]!.baseMidi);
      }
    }
  });

  test('guitar voices reuse the stored-shape tuning', () => {
    for (const id of ['acoustic-guitar', 'electric-guitar'] as const) {
      const midis = instrumentFor(id).strings.map((string) => string.baseMidi);
      expect(midis).toEqual(GUITAR_STRINGS.map((string) => string.baseMidi));
    }
  });

  test('keyboard instruments declare no tuning', () => {
    expect(instrumentFor('piano').layout).toBe('keyboard');
    expect(instrumentFor('synth').layout).toBe('keyboard');
    expect(instrumentFor('synth').strings).toEqual([]);
  });
});

describe('chordPositionForStrings', () => {
  const guitar = instrumentFor('acoustic-guitar');
  const ukulele = instrumentFor('ukulele');
  const bass = instrumentFor('bass');

  test('guitar at position 0 hands back the stored shape', () => {
    const { frets, usedStoredShape } = chordPositionForStrings(
      cMajor, 0, guitar.strings, guitar.maxFret
    );
    expect(frets).toEqual(cMajor.frets);
    expect(usedStoredShape).toBe(true);
  });

  test('a ukulele gets a four-string voicing in the open position', () => {
    const { frets, usedStoredShape } = chordPositionForStrings(
      cMajor, 0, ukulele.strings, ukulele.maxFret
    );
    expect(usedStoredShape).toBe(false);
    // The real ukulele C shape: three open strings plus the A string at the third fret.
    expect(frets).toEqual([0, 0, 0, 3]);
  });

  test('a bass gets a four-string voicing, not a guitar shape', () => {
    const { frets } = chordPositionForStrings(cMajor, 0, bass.strings, bass.maxFret);
    expect(frets.length).toBe(4);
    // Open low E, C on the A string, E on the D string, open G — a C/E bass voicing.
    expect(frets).toEqual([0, 3, 2, 0]);
  });

  test('searched voicings only press chord tones inside the window', () => {
    const position = 8;
    const { frets } = chordPositionForStrings(
      cMajor, position, ukulele.strings, ukulele.maxFret
    );
    const chordTones = new Set([0, 4, 7]); // C, E, G
    let sounding = 0;

    frets.forEach((fret, index) => {
      if (fret < 0) return;
      sounding += 1;
      expect(fret).toBeGreaterThanOrEqual(6);
      expect(fret).toBeLessThanOrEqual(10);
      const pitch = (ukulele.strings[index]!.baseMidi + fret) % 12;
      expect(chordTones.has(pitch)).toBe(true);
    });

    expect(sounding).toBeGreaterThan(0);
  });

  test('the search never exceeds the instrument ceiling', () => {
    const { frets } = chordPositionForStrings(
      cMajor, 15, ukulele.strings, ukulele.maxFret
    );
    for (const fret of frets) {
      if (fret > 0) expect(fret).toBeLessThanOrEqual(ukulele.maxFret);
    }
  });
});

describe('keyboardMidis', () => {
  test('a triad stacks in close position from the C4 octave', () => {
    expect(keyboardMidis(cMajor)).toEqual([60, 64, 67]);
  });

  test('the root moves with the chord', () => {
    expect(keyboardMidis(aMajor)).toEqual([69, 73, 76]);
    expect(keyboardMidis(bMinor)).toEqual([71, 74, 78]);
  });

  test('every note lands above the previous one', () => {
    const midis = keyboardMidis(bMinor);
    for (let index = 1; index < midis.length; index += 1) {
      expect(midis[index]!).toBeGreaterThan(midis[index - 1]!);
    }
  });
});

describe('chordFrequencies', () => {
  const guitar = instrumentFor('acoustic-guitar');
  const bass = instrumentFor('bass');
  const piano = instrumentFor('piano');

  const midiOf = (frequency: number) => Math.round(12 * Math.log2(frequency / 440) + 69);

  test('guitar plays the stored frets', () => {
    const frequencies = chordFrequencies(cMajor, 0, 0, guitar);
    expect(frequencies.length).toBe(5); // x32010 — five sounding strings
    expect(frequencies[0]).toBeCloseTo(midiToFrequency(48), 5); // A string, third fret
  });

  test('a bass plays in the bass register on four strings', () => {
    const frequencies = chordFrequencies(cMajor, 0, 0, bass);
    expect(frequencies.length).toBe(4);
    expect(frequencies[0]).toBeCloseTo(midiToFrequency(28), 5); // open low E
  });

  test('a keyboard plays the close voicing', () => {
    const frequencies = chordFrequencies(cMajor, 0, 0, piano);
    expect(frequencies.length).toBe(3);
    expect(frequencies[0]).toBeCloseTo(midiToFrequency(60), 5);
    expect(frequencies[2]).toBeCloseTo(midiToFrequency(67), 5);
  });

  test('an offset applies to stored shapes, which have not moved with the key', () => {
    const shifted = transposeChordShape(cMajor, 1); // no stored F♯ shape → offset 1
    expect(shifted.usedStoredShape).toBe(false);
    expect(shifted.transposeOffset).toBe(1);

    const frequencies = chordFrequencies(
      shifted.chord, 0, shifted.transposeOffset, guitar
    );
    // The C shape keeps its frets; the offset moves every pitch up one semitone.
    expect(midiOf(frequencies[0]!)).toBe(49);
  });

  test('a searched voicing never double-transposes', () => {
    const shifted = transposeChordShape(cMajor, 1);
    const frequencies = chordFrequencies(
      shifted.chord, 5, shifted.transposeOffset, guitar
    );
    // The frets were built from the already-transposed notes — C Major +1 is C♯ Major
    // (C♯, E♯/F, G♯) — so every sounding pitch must be one of those. Adding the offset a
    // second time would land on D major instead.
    const cSharpMajorTones = new Set([1, 5, 8]);
    expect(frequencies.length).toBeGreaterThan(0);
    for (const frequency of frequencies) {
      expect(cSharpMajorTones.has(((midiOf(frequency) % 12) + 12) % 12)).toBe(true);
    }
  });

  test('an empty fretted voicing falls back to pitched chord tones', () => {
    const silent: InstrumentDefinition = {
      id: 'acoustic-guitar',
      label: 'Silent',
      layout: 'fretted',
      strings: [],
      maxFret: 0,
    };
    const frequencies = chordFrequencies(cMajor, 0, 0, silent);
    expect(frequencies.length).toBe(3);
  });
});
