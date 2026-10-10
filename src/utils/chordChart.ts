// Chord-chart parsing for the song follower.
//
// Ultimate Guitar (and most tab sites) block direct fetching from the browser: their pages
// are not CORS-enabled and their terms disallow scraping. So Musix does not fetch a URL —
// the learner pastes the chord chart they are already looking at, and this module turns that
// text into a chord sequence the follower can step through.
//
// Everything here is pure so it can be unit tested without a DOM.

import { ALL_NOTES, NOTE_ALIASES, getNoteIndex, midiToFrequency, transposeNote } from './musicTheory';
import type { NoteName } from '../types';

export type ChordQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'suspended' | 'other';

export interface ChordSymbol {
  raw: string;
  root: NoteName;
  suffix: string;
  quality: ChordQuality;
  bass?: NoteName;
}

export type ChartLineKind = 'chords' | 'lyrics' | 'note';

export interface ChartLine {
  kind: ChartLineKind;
  text: string;
  /** Chord tokens on this line, in the order they appear. */
  chords: string[];
}

export interface ParsedChart {
  lines: ChartLine[];
  /** Every chord in playing order, flattened across the whole chart. */
  chords: string[];
  /** Distinct chord symbols, in first-seen order. */
  unique: string[];
  /** Number of `[Section]` headers found. */
  sections: number;
}

// Permissive on the suffix (maj7, sus4, add9, °, ø, +, parentheses…) but strict about the
// root, which is what keeps lyric words from being mistaken for chords.
const CHORD_RE =
  /^([A-G])([#b♯♭]?)((?:maj|min|dim|aug|sus|add|no|M|m|°|ø|\+|-)?[0-9]*(?:[#b♯♭]?[0-9]*)?(?:\([^)]*\))?)(?:\/([A-G])([#b♯♭]?))?$/;

const SECTION_RE = /^\[(.+?)\]$/;

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  diminished: [0, 3, 6],
  augmented: [0, 4, 8],
  suspended: [0, 5, 7],
  other: [0, 4, 7],
};

function normalizeAccidental(spelling: string): NoteName | null {
  if (!spelling) return null;
  const asciiified = spelling.replace('♯', '#').replace('♭', 'b');
  const direct = NOTE_ALIASES[asciiified];
  if (direct) return direct;
  return (ALL_NOTES as readonly string[]).includes(asciiified) ? (asciiified as NoteName) : null;
}

function qualityFromSuffix(suffix: string): ChordQuality {
  if (/^(dim|°|ø)/.test(suffix)) return 'diminished';
  if (/^(aug|\+)/.test(suffix)) return 'augmented';
  if (/^sus/.test(suffix)) return 'suspended';
  if (/^m(?!aj)/.test(suffix)) return 'minor';
  if (suffix === '') return 'major';
  if (/^maj|^M/.test(suffix)) return 'major';
  // 7, 9, 13, add9, 6 … are major-ish unless they already matched m/dim/aug.
  return /\d/.test(suffix) ? 'major' : 'other';
}

/** Read a chord token such as `C`, `Am7`, `F#m`, `Bb`, `G/B`, `Dsus4`. */
export function parseChordSymbol(token: string): ChordSymbol | null {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const match = trimmed.match(CHORD_RE);
  if (!match) return null;

  const [, letter, accidental, suffix = '', bassLetter, bassAccidental] = match;
  const root = normalizeAccidental(`${letter}${accidental ?? ''}`);
  if (!root) return null;

  const bass = bassLetter ? normalizeAccidental(`${bassLetter}${bassAccidental ?? ''}`) ?? undefined : undefined;

  return {
    raw: trimmed,
    root,
    suffix,
    quality: qualityFromSuffix(suffix),
    bass,
  };
}

/** True when a whitespace-separated token looks like a chord rather than a word. */
export function isChordToken(token: string): boolean {
  if (!token) return false;
  // A lone `A`–`G` is a valid chord, but a lowercase word never is.
  if (!/^[A-G]/.test(token)) return false;
  return CHORD_RE.test(token);
}

/** Parse a pasted chord chart into lines plus a flattened chord sequence. */
export function parseChordChart(input: string): ParsedChart {
  const lines: ChartLine[] = [];
  const chords: string[] = [];
  let sections = 0;

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      lines.push({ kind: 'note', text: '', chords: [] });
      continue;
    }

    const section = line.match(SECTION_RE);
    if (section) {
      sections += 1;
      lines.push({ kind: 'note', text: section[1]?.trim() ?? '', chords: [] });
      continue;
    }

    const tokens = line.split(/\s+/);
    const lineChords = tokens.filter(isChordToken);
    const isChordLine = lineChords.length > 0 && lineChords.length === tokens.length;

    chords.push(...lineChords);
    lines.push({ kind: isChordLine ? 'chords' : 'lyrics', text: line, chords: lineChords });
  }

  const unique = Array.from(new Set(chords));
  return { lines, chords, unique, sections };
}

/** Notes of the chord, built from the root and its quality (7ths included when implied). */
export function chordTones(symbol: ChordSymbol, semitones = 0): NoteName[] {
  const intervals = [...QUALITY_INTERVALS[symbol.quality]];

  if (/maj7|M7/.test(symbol.suffix)) {
    intervals.push(11);
  } else if (/7|9|11|13/.test(symbol.suffix)) {
    // Dominant and minor sevenths are both a minor 7th (10 semitones) above the root.
    intervals.push(10);
  }

  const shift = (semi: number) => transposeNote(transposeNote(symbol.root, semitones), semi);
  const tones = intervals.map(shift);

  if (symbol.bass) {
    tones.push(transposeNote(symbol.bass, semitones));
  }

  return tones;
}

/** Shift a chord symbol by a number of semitones, keeping its suffix and slash bass. */
export function transposeChordToken(token: string, semitones: number): string {
  const symbol = parseChordSymbol(token);
  if (!symbol || semitones === 0) return token;

  const root = transposeNote(symbol.root, semitones);
  const bass = symbol.bass ? `/${transposeNote(symbol.bass, semitones)}` : '';
  return `${root}${symbol.suffix}${bass}`;
}

/**
 * Pitch classes (0 = C … 11 = B) that a chart token sounds, transposed by `semitones`,
 * or null when the token is not a chord. This is the mic follow-along's comparison
 * basis: what the learner plays, reduced to pitch classes, is matched against these sets.
 */
export function chordPitchClasses(token: string, semitones = 0): number[] | null {
  const symbol = parseChordSymbol(token);
  if (!symbol) return null;
  const classes = new Set<number>();
  for (const note of chordTones(symbol, semitones)) {
    const index = getNoteIndex(note);
    if (index >= 0) classes.add(index);
  }
  return [...classes];
}

/**
 * How well a set of heard pitch classes fits a chord's: every overlap counts once for,
 * every class outside the chord counts against — a perfect fit scores +1 per heard note,
 * 0 means no information either way, and negatives are clashes. The Song Follower's live coaching
 * uses it both to flag a wrong chord and to work out where the learner actually is.
 */
export function chordFitScore(heard: readonly number[], tones: readonly number[]): number {
  let score = 0;
  for (const pitchClass of heard) {
    score += tones.includes(pitchClass) ? 1 : -1;
  }
  return score;
}

/**
 * The chart index that best explains what is being played: the highest fit score, with
 * ties won by the earliest index at or after `from` (wrapping), because the follower
 * moves forward through a song — so while the current position fits at all, it wins and
 * the caller has nothing to snap to. Returns null when the chart has no position that
 * the heard notes fit (score ≥ 1).
 */
export function findBestChartPosition(
  heard: readonly number[],
  tonesByIndex: readonly (readonly number[] | null)[],
  from: number
): number | null {
  const count = tonesByIndex.length;
  if (count === 0 || heard.length === 0) return null;

  const start = ((Math.trunc(from) % count) + count) % count;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestIndex: number | null = null;

  for (let offset = 0; offset < count; offset++) {
    const index = (start + offset) % count;
    const tones = tonesByIndex[index];
    if (!tones || tones.length === 0) continue;
    const score = chordFitScore(heard, tones);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestScore >= 1 ? bestIndex : null;
}

/** Frequency in Hz for each note of the chord, voiced in ascending order above the root. */
export function chordFrequencies(symbol: ChordSymbol, semitones = 0, baseMidi = 52): number[] {
  const root = transposeNote(symbol.root, semitones);
  const rootPitchClass = Math.max(0, ALL_NOTES.indexOf(root));

  const offsets = [...QUALITY_INTERVALS[symbol.quality]];
  if (/maj7|M7/.test(symbol.suffix)) {
    offsets.push(11);
  } else if (/7|9|11|13/.test(symbol.suffix)) {
    offsets.push(10);
  }

  const frequencies = offsets.map((offset) =>
    midiToFrequency(baseMidi + rootPitchClass + offset)
  );

  // A slash chord puts its bass note in the octave below the rest of the voicing.
  if (symbol.bass) {
    const bassPitchClass = Math.max(0, ALL_NOTES.indexOf(transposeNote(symbol.bass, semitones)));
    frequencies.unshift(midiToFrequency(baseMidi - 12 + bassPitchClass));
  }

  return frequencies;
}

/** Human-readable name, e.g. `Am7` → "A minor 7". */
export function describeChordSymbol(token: string): string {
  const symbol = parseChordSymbol(token);
  if (!symbol) return token;

  const quality = symbol.quality === 'other' ? 'chord' : symbol.quality;
  const suffix = symbol.suffix.replace(/^m(?!aj)/, '').replace(/^maj/, 'major ');
  const detail = suffix && !/^\d+$/.test(suffix) ? suffix : '';
  const number = symbol.suffix.match(/\d+/)?.[0] ?? '';

  return `${symbol.root} ${quality}${detail ? ` ${detail.trim()}` : ''}${number ? ` ${number}` : ''}`
    .replace(/\s+/g, ' ')
    .trim();
}

/** A short chart used to demonstrate the follower without pasting anything. */
export const SAMPLE_CHART = `[Intro]
C  G  Am  F

[Verse]
C                G
Look at her face, it's a wonderful face
Am               F
And it means something special to me

[Chorus]
F        C
I'm only dreaming
G        Am
I'm only dreaming
`;
