import {
  chordFrequencies,
  chordTones,
  describeChordSymbol,
  isChordToken,
  parseChordChart,
  parseChordSymbol,
  transposeChordToken,
  SAMPLE_CHART,
} from './chordChart';

describe('chordChart', () => {
  describe('isChordToken', () => {
    test('accepts common chord spellings', () => {
      for (const token of ['C', 'Am', 'Am7', 'F#m', 'Bb', 'G/B', 'Dsus4', 'Cmaj7', 'Cadd9']) {
        expect(isChordToken(token)).toBe(true);
      }
    });

    test('rejects lyric words and lowercase roots', () => {
      for (const token of ['I', 'the', 'look', 'a', 'dreaming', '', '123']) {
        expect(isChordToken(token)).toBe(false);
      }
    });
  });

  describe('parseChordSymbol', () => {
    test('reads a plain major chord', () => {
      const symbol = parseChordSymbol('C');
      expect(symbol?.root).toBe('C');
      expect(symbol?.suffix).toBe('');
      expect(symbol?.quality).toBe('major');
    });

    test('reads minor and seventh qualities', () => {
      expect(parseChordSymbol('Am7')?.quality).toBe('minor');
      expect(parseChordSymbol('Am7')?.suffix).toBe('m7');
      expect(parseChordSymbol('Cmaj7')?.quality).toBe('major');
    });

    test('normalizes enharmonic root spellings to canonical names', () => {
      expect(parseChordSymbol('Bb')?.root).toBe('A♯');
      expect(parseChordSymbol('F#')?.root).toBe('F♯');
      expect(parseChordSymbol('Db')?.root).toBe('C♯');
    });

    test('reads a slash bass note', () => {
      const symbol = parseChordSymbol('G/B');
      expect(symbol?.root).toBe('G');
      expect(symbol?.bass).toBe('B');
    });

    test('detects suspended and diminished qualities', () => {
      expect(parseChordSymbol('Dsus4')?.quality).toBe('suspended');
      expect(parseChordSymbol('Bdim')?.quality).toBe('diminished');
    });

    test('returns null for non-chords', () => {
      expect(parseChordSymbol('dreaming')).toBeNull();
      expect(parseChordSymbol('')).toBeNull();
    });
  });

  describe('parseChordChart', () => {
    test('separates chord lines, lyric lines and sections', () => {
      const parsed = parseChordChart(SAMPLE_CHART);
      expect(parsed.sections).toBe(3);
      expect(parsed.lines.some((line) => line.kind === 'chords')).toBe(true);
      expect(parsed.lines.some((line) => line.kind === 'lyrics')).toBe(true);
    });

    test('extracts inline chords from lyric lines', () => {
      const parsed = parseChordChart('C                G\nLook at her face, it is a lovely face');
      expect(parsed.chords).toEqual(['C', 'G']);
    });

    test('flattens chords in playing order and de-duplicates the unique list', () => {
      const parsed = parseChordChart(SAMPLE_CHART);
      expect(parsed.chords.slice(0, 4)).toEqual(['C', 'G', 'Am', 'F']);
      expect(parsed.unique).toEqual(['C', 'G', 'Am', 'F']);
    });

    test('keeps section headers as note lines rather than chords', () => {
      const parsed = parseChordChart('[Verse]\nAm');
      expect(parsed.lines[0]).toEqual({ kind: 'note', text: 'Verse', chords: [] });
      expect(parsed.chords).toEqual(['Am']);
    });

    test('handles an empty chart without throwing', () => {
      const parsed = parseChordChart('');
      expect(parsed.chords).toEqual([]);
      expect(parsed.unique).toEqual([]);
    });
  });

  describe('chordTones', () => {
    test('builds a major triad', () => {
      const symbol = parseChordSymbol('C')!;
      expect(chordTones(symbol)).toEqual(['C', 'E', 'G']);
    });

    test('builds a minor seventh', () => {
      const symbol = parseChordSymbol('Am7')!;
      expect(chordTones(symbol)).toEqual(['A', 'C', 'E', 'G']);
    });

    test('builds a major seventh', () => {
      const symbol = parseChordSymbol('Cmaj7')!;
      expect(chordTones(symbol)).toEqual(['C', 'E', 'G', 'B']);
    });

    test('adds the slash bass below the chord', () => {
      const symbol = parseChordSymbol('G/B')!;
      expect(chordTones(symbol)).toContain('B');
    });

    test('transposes the whole voicing', () => {
      const symbol = parseChordSymbol('C')!;
      expect(chordTones(symbol, 2)).toEqual(['D', 'F♯', 'A']);
    });
  });

  describe('transposeChordToken', () => {
    test('shifts a plain chord', () => {
      expect(transposeChordToken('C', 2)).toBe('D');
    });

    test('keeps the suffix when shifting', () => {
      expect(transposeChordToken('Am7', 3)).toBe('Cm7');
    });

    test('shifts the slash bass too', () => {
      expect(transposeChordToken('G/B', 2)).toBe('A/C♯');
    });

    test('is a no-op at zero semitones', () => {
      expect(transposeChordToken('F#m7', 0)).toBe('F#m7');
    });
  });

  describe('chordFrequencies', () => {
    test('returns one finite frequency per chord tone', () => {
      const symbol = parseChordSymbol('Am7')!;
      const freqs = chordFrequencies(symbol);
      expect(freqs).toHaveLength(chordTones(symbol).length);
      for (const freq of freqs) {
        expect(Number.isFinite(freq)).toBe(true);
        expect(freq).toBeGreaterThan(0);
      }
    });
  });

  describe('describeChordSymbol', () => {
    test('describes quality and extension', () => {
      expect(describeChordSymbol('Am7')).toContain('minor');
      expect(describeChordSymbol('C')).toContain('major');
    });
  });
});
