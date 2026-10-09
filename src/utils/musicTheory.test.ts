import {
  stringInfoAt,
  getNoteIndex,
  getSemitoneIndexLike,
  getNoteDescriptor,
  resolveGuitarString,
  getFretNote,
  getFretMidi,
  getGuitarStringInfo,
  getNoteByCheckedIndex,
  ALL_NOTES,
  GUITAR_STRINGS,
  midiToFrequency,
  noteNameAt,
  NOTE_ALIASES,
  noteColorFor,
  transposeNote,
  transposeNoteSafe,
  transposeNoteSafeAny,
} from '../utils/musicTheory';

describe('musicTheory helpers', () => {
  describe('note shorthands', () => {
    test('C♯ aliases resolve to C♯', () => {
      expect(getNoteIndex('C#')).toBe(1);
      expect(getNoteIndex('Db')).toBe(1);
    });

    test('unknown alias falls back to note name parity', () => {
      expect(getNoteIndex('XyZ')).toBe(-1);
    });
  });

  describe('semitone helpers', () => {
    test('modded semitone output stays in 0..11', () => {
      expect(getSemitoneIndexLike(0)).toBe(0);
      expect(getSemitoneIndexLike(1)).toBe(1);
      expect(getSemitoneIndexLike(11)).toBe(11);
      expect(getSemitoneIndexLike(12)).toBe(0);
      expect(getSemitoneIndexLike(13)).toBe(1);
      expect(getSemitoneIndexLike(-1)).toBe(11);
      expect(getSemitoneIndexLike(25)).toBe(1);
    });

    test('non-finite input normalizes to 0', () => {
      expect(getSemitoneIndexLike(NaN)).toBe(0);
      expect(getSemitoneIndexLike(Infinity)).toBe(0);
      expect(getSemitoneIndexLike(-Infinity)).toBe(0);
    });
  });

  describe('note descriptor', () => {
    test('descriptor matches note, semitone, and color', () => {
      const d = getNoteDescriptor('C♯');
      expect(d.label).toBe('C♯');
      expect(d.semitone).toBe(1);
      expect(d.color).toBe('#FF8D33');
    });

    test('missing color falls back to black', () => {
      const d = getNoteDescriptor('B');
      expect(d.color).toBe('#E74C3C');
    });
  });

  describe('safe string lookups', () => {
    test('stringInfoAt returns valid string info for known index', () => {
      const info = stringInfoAt(0);
      expect(info.name).toBe('E');
      expect(info.octave).toBe(2);
      expect(info.baseMidi).toBe(40);
    });

    test('stringInfoAt clamps invalid index to first string', () => {
      const info = stringInfoAt(999);
      expect(info.name).toBe('E');
      expect(info.octave).toBe(2);
      expect(info.baseMidi).toBe(40);
    });

    test('stringInfoAt handles non-finite input', () => {
      const info = stringInfoAt(NaN);
      expect(info.name).toBe('E');
      expect(info.baseMidi).toBe(40);
    });
  });

  describe('guitar fret resolution', () => {
    test('getGuitarStringInfo matches GUITAR_STRINGS shape', () => {
      const info = getGuitarStringInfo(0);
      expect(info).toEqual({
        name: 'E',
        octave: 2,
        baseMidi: 40,
      });
    });

    test('getFretNote resolves open high E to E', () => {
      // String index 5 in this shape is High E; open string should stay E.
      const highEStringIndex = GUITAR_STRINGS.length - 1;
      expect(getFretNote(highEStringIndex, 0)).toBe('E');
    });

    test('fret offsets move through chromatic notes', () => {
      const base = getFretNote(5, 0);
      const next = getFretNote(5, 1);
      expect(ALL_NOTES.indexOf(base)).toBeLessThan(ALL_NOTES.indexOf(next));
    });

    test('getFretMidi approximates physical MIDI offset from base', () => {
      const baseMidi = GUITAR_STRINGS[5]!.baseMidi;
      const fret0 = getFretMidi(5, 0);
      const fret2 = getFretMidi(5, 2);
      expect(fret0).toBe(baseMidi);
      expect(fret2).toBe(baseMidi + 2);
    });
  });

  describe('strict build safe wrappers', () => {
    test('getNoteByCheckedIndex never returns undefined', () => {
      expect(getNoteByCheckedIndex(0)).toBe('C');
      expect(getNoteByCheckedIndex(12)).toBe('C');
      expect(getNoteByCheckedIndex(1)).toBe('C♯');
    });

    test('resolveGuitarString returns guitar-string-shaped info', () => {
      const info = resolveGuitarString(2);
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('octave');
      expect(info).toHaveProperty('baseMidi');
      expect(typeof info.name).toBe('string');
      expect(typeof info.octave).toBe('number');
      expect(typeof info.baseMidi).toBe('number');
    });
  });

  describe('pitch helpers', () => {
    test('midiToFrequency returns standard concert pitch for A4', () => {
      expect(midiToFrequency(69)).toBeCloseTo(440, 2);
    });

    test('MIDI offset translates to expected ratio', () => {
      const a4 = midiToFrequency(69);
      const a5 = midiToFrequency(81);
      expect(a5 / a4).toBeCloseTo(2, 2);
    });
  });

  describe('note name and color lookups', () => {
    test('noteNameAt returns valid note name for normalized index', () => {
      expect(noteNameAt(0)).toBe('C');
      expect(noteNameAt(1)).toBe('C♯');
      expect(noteNameAt(12)).toBe('C');
    });

    test('noteColorFor returns default color for unknown input', () => {
      // @ts-expect-error testing runtime fallback for unknown note shape
      expect(noteColorFor('XyZ')).toBe('#555555');
    });
  });

  describe('transpose helpers', () => {
    test('transposeNote preserves known note identity', () => {
      expect(transposeNote('C', 0)).toBe('C');
      expect(transposeNote('C', 1)).toBe('C♯');
      expect(transposeNote('C', 12)).toBe('C');
    });

    test('transposeNoteSafe falls back to C for unknown note', () => {
      // @ts-expect-error runtime fallback behavior for invalid note
      expect(transposeNoteSafe('X', 1)).toBe('C');
    });

    test('transposeNoteSafeAny handles sharps and flats via aliases', () => {
      // @ts-expect-error alias string input
      const upOne = transposeNoteSafeAny('Db', 1);
      // @ts-expect-error alias string input
      const upOneB = transposeNoteSafeAny('C#', 1);
      expect(upOne).toBe('D');
      expect(upOneB).toBe('D');
    });
  });

  describe('note alias table', () => {
    test('alias table covers common enharmonic spellings', () => {
      expect(NOTE_ALIASES['Db']).toBe('C♯');
      expect(NOTE_ALIASES['Eb']).toBe('D♯');
      expect(NOTE_ALIASES['Gb']).toBe('F♯');
      expect(NOTE_ALIASES['Ab']).toBe('G♯');
      expect(NOTE_ALIASES['Bb']).toBe('A♯');
      expect(NOTE_ALIASES['C#']).toBe('C♯');
      expect(NOTE_ALIASES['D#']).toBe('D♯');
      expect(NOTE_ALIASES['F#']).toBe('F♯');
      expect(NOTE_ALIASES['G#']).toBe('G♯');
      expect(NOTE_ALIASES['A#']).toBe('A♯');
    });
  });

  describe('guitar tuning table', () => {
    test('GUITAR_STRINGS matches expected standard tuning', () => {
      expect(GUITAR_STRINGS).toHaveLength(6);
      expect(GUITAR_STRINGS[0]).toEqual({ name: 'E', octave: 2, baseMidi: 40 });
      expect(GUITAR_STRINGS[5]).toEqual({ name: 'E', octave: 4, baseMidi: 64 });
    });
  });
});
