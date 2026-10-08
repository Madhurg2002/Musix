import { ScaleDefinition, IntervalDefinition } from '../types';

export const COMPREHENSIVE_SCALES: ScaleDefinition[] = [
  {
    id: 'major',
    name: 'Major (Ionian)',
    formula: 'W - W - H - W - W - W - H',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    shortFormula: ['1', '2', '3', '4', '5', '6', '7'],
    description: 'The foundation of Western music theory. Bright, uplifting sound.',
  },
  {
    id: 'minor',
    name: 'Natural Minor (Aeolian)',
    formula: 'W - H - W - W - H - W - W',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    shortFormula: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
    description: 'The standard minor scale. Somber, emotional, and reflective tone.',
  },
  {
    id: 'pentatonic-minor',
    name: 'Minor Pentatonic',
    formula: '1 - ♭3 - 4 - 5 - ♭7',
    intervals: [0, 3, 5, 7, 10],
    shortFormula: ['1', '♭3', '4', '5', '♭7'],
    description: 'Essential for Rock, Blues, and Soloing. 5 notes that always fit together.',
  },
  {
    id: 'blues',
    name: 'Blues Scale',
    formula: '1 - ♭3 - 4 - ♭5 - 5 - ♭7',
    intervals: [0, 3, 5, 6, 7, 10],
    shortFormula: ['1', '♭3', '4', '♭5', '5', '♭7'],
    description: 'Minor pentatonic with the gritty "blue note" (♭5 tritone).',
  },
  {
    id: 'dorian',
    name: 'Dorian Mode',
    formula: 'W - H - W - W - W - H - W',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    shortFormula: ['1', '2', '♭3', '4', '5', '6', '♭7'],
    description: 'Minor scale with a raised 6th. Smooth Jazz, Funk, and Latin feel.',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian Mode',
    formula: 'W - W - H - W - W - H - W',
    intervals: [0, 2, 4, 5, 7, 9, 10],
    shortFormula: ['1', '2', '3', '4', '5', '6', '♭7'],
    description: 'Major scale with a flat 7th. Classic Rock and Dominant 7th jam scale.',
  },
  {
    id: 'phrygian',
    name: 'Phrygian Mode',
    formula: 'H - W - W - W - H - W - W',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    shortFormula: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'],
    description: 'Dark, Spanish/Flamenco, and Heavy Metal flavor with flat 2nd.',
  },
  {
    id: 'lydian',
    name: 'Lydian Mode',
    formula: 'W - W - W - H - W - W - H',
    intervals: [0, 2, 4, 6, 7, 9, 11],
    shortFormula: ['1', '2', '3', '♯4', '5', '6', '7'],
    description: 'Dreamy, ethereal film-score sound with raised 4th.',
  }
];

export const COMPREHENSIVE_INTERVALS: IntervalDefinition[] = [
  { semitones: 0, name: 'Perfect Unison', short: 'P1', quality: 'perfect', description: 'Same note frequency. Zero distance.' },
  { semitones: 1, name: 'Minor 2nd', short: 'm2', quality: 'minor', description: 'Half step distance (1 fret). High tension ("Jaws" theme).' },
  { semitones: 2, name: 'Major 2nd', short: 'M2', quality: 'major', description: 'Whole step distance (2 frets). Smooth scale movement.' },
  { semitones: 3, name: 'Minor 3rd', short: 'm3', quality: 'minor', description: '3 semitones. Defines minor keys and chords.' },
  { semitones: 4, name: 'Major 3rd', short: 'M3', quality: 'major', description: '4 semitones. Defines major keys and bright harmony.' },
  { semitones: 5, name: 'Perfect 4th', short: 'P4', quality: 'perfect', description: '5 semitones. Consonant open interval ("Here Comes the Bride").' },
  { semitones: 6, name: 'Tritone / Diminished 5th', short: 'TT/d5', quality: 'tritone', description: '6 semitones (Devil in Music). Maximum tension.' },
  { semitones: 7, name: 'Perfect 5th', short: 'P5', quality: 'perfect', description: '7 semitones. The power chord backbone ("Star Wars" theme).' },
  { semitones: 8, name: 'Minor 6th', short: 'm6', quality: 'minor', description: '8 semitones. Dramatic, romantic tension.' },
  { semitones: 9, name: 'Major 6th', short: 'M6', quality: 'major', description: '9 semitones. Sweet, pastoral sound ("My Bonnie Lies Over the Ocean").' },
  { semitones: 10, name: 'Minor 7th', short: 'm7', quality: 'minor', description: '10 semitones. Blues & Dominant 7th key element.' },
  { semitones: 11, name: 'Major 7th', short: 'M7', quality: 'major', description: '11 semitones. Jazz & Dream pop warmth, 1 step below octave.' },
  { semitones: 12, name: 'Perfect Octave', short: 'P8', quality: 'perfect', description: '12 semitones. Exact double frequency.' },
];
