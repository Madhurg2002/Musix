# 02 Intervals

An **interval** is the distance in pitch between two notes. Intervals are the atomic units of melody and harmony — every scale, chord, and voice-leading motion is built from interval relationships.

This module is instrument-agnostic. It applies to any sound-producing system.

## 1. Interval Fundamentals

An interval is defined by:

1. **Quantity (generic size):** How many letter names apart the two notes are (e.g., C to G spans five letters — C, D, E, F, G — so it is some kind of fifth).
2. **Quality:** Whether the interval is major, minor, perfect, augmented, or diminished.

Quantity and quality together uniquely identify an interval. For example, "minor third" and "major third" are both thirds (quantity = 3) but differ in quality and size.

## 2. Measuring Intervals: Semitones

The most basic measurement of interval size is the **semitone** (or half step) — the smallest standard unit in 12-tone equal temperament. One semitone is the distance between adjacent pitches in the chromatic scale.

In 12-TET, the frequency ratio of one semitone is:

$$ r = \sqrt[12]{2} \approx 1.059463094 $$

An interval of *n* semitones has the frequency ratio:

$$ \text{ratio} = 2^{n/12} $$

| Interval name          | Semitones | Ratio (12-TET) |
|------------------------|-----------|----------------|
| Unison                 | 0         | 1.0000         |
| Minor second (m2)      | 1         | 1.0595         |
| Major second (M2)      | 2         | 1.1225         |
| Minor third (m3)       | 3         | 1.1892         |
| Major third (M3)       | 4         | 1.2599         |
| Perfect fourth (P4)    | 5         | 1.3348         |
| Tritone (TT)           | 6         | 1.4142         |
| Perfect fifth (P5)     | 7         | 1.4983         |
| Minor sixth (m6)       | 8         | 1.5874         |
| Major sixth (M6)       | 9         | 1.6818         |
| Minor seventh (m7)     | 10        | 1.7818         |
| Major seventh (M7)     | 11        | 1.8877         |
| Octave (P8)            | 12        | 2.0000         |

## 3. Interval Quality and Spelling

Interval quality is not arbitrary — it is determined by the spelling (which letter names are used) and by the number of semitones.

### Perfect Intervals

The unison, fourth, fifth, and octave are classified as **perfect** intervals. They have especially simple frequency ratios and strong consonance:

| Interval      | Semitones | Just Ratio (approx.) |
|---------------|-----------|----------------------|
| Perfect unison (P1) | 0   | 1 : 1                |
| Perfect fourth (P4) | 5   | 4 : 3                |
| Perfect fifth (P5)  | 7   | 3 : 2                |
| Perfect octave (P8) | 12  | 2 : 1                |

### Major and Minor Intervals

Seconds, thirds, sixths, and sevenths come in major and minor forms. A minor interval is one semitone smaller than the corresponding major interval:

- Minor third (m3) = 3 semitones; Major third (M3) = 4 semitones
- Minor seventh (m7) = 10 semitones; Major seventh (M7) = 11 semitones

## 4. Enharmonic Equivalence

Two intervals may sound identical but be spelled differently. For example:

- An augmented fourth (A4) and a diminished fifth (d5) both span 6 semitones (the tritone).

Their spellings matter for harmonic function and voice leading even though they are enharmonically equivalent in 12-TET.

## 5. Augmented and Diminished Intervals

- **Augmented:** One semitone larger than a major or perfect interval.
- **Diminished:** One semitone smaller than a minor or perfect interval.

Examples:

| Interval          | Semitones | From...        |
|-------------------|-----------|----------------|
| Diminished fifth (d5) | 6     | Perfect fifth lowered by a semitone |
| Augmented fourth (A4) | 6    | Perfect fourth raised by a semitone |
| Augmented fifth (A5)  | 8    | Perfect fifth raised by a semitone |

## 6. Simple and Compound Intervals

- **Simple intervals** are within one octave (0–12 semitones).
- **Compound intervals** exceed one octave and are the simple interval plus one or more octaves.

For example, a compound major third (15 semitones) is a major third plus an octave. In functional terms, compound intervals are often treated as equivalent to their simple counterparts in many harmonic contexts, though the octave displacement can matter in voice leading and texture.

## 7. The Tritone

The **tritone** is an interval of 6 semitones: exactly half an octave. It can be spelled as:

- Augmented fourth (e.g., F to B)
- Diminished fifth (e.g., B to F)

Historically, the tritone was called *diabolus in musica* ("the devil in music") because of its instability and strong tendency to resolve. In dominant seventh chords, the tritone between the third and seventh drives the chord's resolution.

## 8. Harmonic, Melodic, and Compound Intervals

- **Harmonic intervals:** Two pitches sounded simultaneously.
- **Melodic intervals:** Two pitches sounded in sequence.
- The same interval name applies in both cases; the difference is in how they are perceived and used.

## 9. Interval Inversion

**Inverting** an interval means moving the lower note up an octave (or the upper note down an octave). Inversion follows these rules:

- Size: An interval's inversion spans (9 − original quantity) letter names. Example: a third inverts to a sixth.
- Quality: 
  - Perfect stays perfect.
  - Major becomes minor (and vice versa).
  - Augmented becomes diminished (and vice versa).

For example:

- Major third (M3) inverts to minor sixth (m6).
- Perfect fifth (P5) inverts to perfect fourth (P4).

In semitones, an interval and its inversion always sum to 12 (within one octave).

## 10. Consonance and Dissonance

Intervals are loosely categorized by how stable or tense they sound:

- **Perfect consonances:** Unison, octave, perfect fifth, perfect fourth (though the fourth can function as a dissonance against the bass in some contexts).
- **Imperfect consonances:** Major and minor thirds, major and minor sixths.
- **Dissonances:** Seconds, sevenths, and the tritone (and their compounds), along with augmented and diminished intervals.

Consonance and dissonance are context-dependent and culturally shaped, but these categories are a useful starting point for Western tonal harmony.

## 11. Frequency Ratios for Common Intervals

Interval quality is closely tied to simple integer frequency ratios. Here are approximate **just intonation** ratios for key intervals:

| Interval          | Semitones | Just Ratio |
|-------------------|-----------|------------|
| Minor second (m2) | 1         | 16 : 15    |
| Major second (M2) | 2         | 9 : 8      |
| Minor third (m3)  | 3         | 6 : 5      |
| Major third (M3)  | 4         | 5 : 4      |
| Perfect fourth (P4)| 5        | 4 : 3      |
| Tritone (TT)      | 6         | 45 : 32 / 64 : 45 |
| Perfect fifth (P5)| 7         | 3 : 2      |
| Minor sixth (m6)  | 8         | 8 : 5      |
| Major sixth (M6)  | 9         | 5 : 3      |
| Minor seventh (m7)| 10        | 16 : 9 / 9 : 5 |
| Major seventh (M7)| 11        | 15 : 8     |
| Octave (P8)       | 12        | 2 : 1      |

In 12-TET, these ratios are approximated by $2^{n/12}$.

## 12. Interval Notation and Shorthand

A compact shorthand is widely used:

| Symbol | Meaning            |
|--------|--------------------|
| P1     | Perfect unison     |
| m2     | Minor second       |
| M2     | Major second       |
| m3     | Minor third        |
| M3     | Major third        |
| P4     | Perfect fourth     |
| TT     | Tritone            |
| P5     | Perfect fifth      |
| m6     | Minor sixth        |
| M6     | Major sixth        |
| m7     | Minor seventh      |
| M7     | Major seventh      |
| P8     | Perfect octave     |

Brackets such as ♭3 (flat three) and ♯5 (sharp five) are used in chord formulas to indicate alterations relative to a scale or chord.

## 13. Summary

- Intervals are defined by **quantity** (number of letter names) and **quality** (pitch size in semitones).
- The semitone is the basic unit; the frequency ratio of *n* semitones is $2^{n/12}$ in 12-TET.
- Qualities include perfect, major, minor, augmented, and diminished.
- Inversion swaps quantity to (9 − quantity) and flips major/minor and augmented/diminished.
- Simple frequency ratios explain consonance; the tritone and other dissonances create tension and motion.
- Interval concepts here are fully instrument-agnostic and form the basis for scales and chords.
