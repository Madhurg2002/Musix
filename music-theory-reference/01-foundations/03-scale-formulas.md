# 03 Scale Formulas

A **scale** is an ordered collection of pitch classes within an octave, typically arranged in ascending (or descending) sequence. Scales define the pitch material available within a tonal context and determine the character — major, minor, modal, chromatic — of a piece.

This module is instrument-agnostic. A scale formula applies regardless of how pitches are produced.

## 1. Scale Degree Notation

Scale degrees are numbered within the scale, starting from the **tonic** (scale degree 1):

1. Tonic
2. Supertonic
3. Mediant
4. Subdominant
5. Dominant
6. Submediant
7. Leading tone

In any given key, these letter names follow the alphabet consecutively without skipping letters. For example, a C major scale uses the letters C D E F G A B, one of each per octave.

When a scale degree is altered, it is indicated with accidentals:

- ♭3 = flat third
- ♯4 = sharp four
- ♭7 = flat seven

These symbols show *what* is altered relative to the diatonic expectation, which is essential for chord construction and modal interchange.

## 2. Whole Steps and Half Steps

A scale formula describes the pattern of steps between consecutive scale degrees. In 12-tone equal temperament:

- A **half step (H)** = 1 semitone
- A **whole step (W)** = 2 semitones

Because equal temperament divides the octave into 12 equal semitones, any scale can be expressed as a sequence of W/H steps or directly as semitone offsets from the tonic.

## 3. The Major Scale

The **major scale** follows this step pattern starting from the tonic:

$$ W - W - H - W - W - W - H $$

In scale degrees and application:

| Degree | Letter (C major) | Semitone from tonic |
|--------|------------------|---------------------|
| 1      | C                | 0                   |
| 2      | D                | 2                   |
| 3      | E                | 4                   |
| 4      | F                | 5                   |
| 5      | G                | 7                   |
| 6      | A                | 9                   |
| 7      | B                | 11                  |
| 8      | C (octave)       | 12                  |

The formula in scale-degree terms is:

$$ 1 - 2 - 3 - 4 - 5 - 6 - 7 $$

The major scale is the reference for the **Ionian mode** and the basis for much of Western tonal harmony.

### Semitone Array

A major scale's semitone offsets from the tonic are:

$$ [0, 2, 4, 5, 7, 9, 11] $$

## 4. The Natural Minor Scale

The **natural minor scale** (Aeolian mode) is:

$$ W - H - W - W - H - W - W $$

Or in scale-degree terms:

$$ 1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7 $$

In C minor:

| Degree | Letter | Semitone from tonic |
|--------|--------|---------------------|
| 1      | C      | 0                   |
| 2      | D      | 2                   |
| ♭3     | E♭     | 3                   |
| 4      | F      | 5                   |
| 5      | G      | 7                   |
| ♭6     | A♭     | 8                   |
| ♭7     | B♭     | 10                  |

Semitone offsets from the tonic:

$$ [0, 2, 3, 5, 7, 8, 10] $$

The flattened third, sixth, and seventh give the minor scale its darker color relative to the major.

## 5. The Harmonic Minor Scale

The **harmonic minor** raises the seventh degree to create a leading tone, strengthening the pull to the tonic:

$$ 1 - 2 - ♭3 - 4 - 5 - ♭6 - 7 $$

Step pattern:

$$ W - H - W - W - H - \text{augmented second} - H $$

That augmented second between ♭6 and 7 (3 semitones) is a distinctive feature.

In C harmonic minor:

| Degree | Letter | Semitone from tonic |
|--------|--------|---------------------|
| 1      | C      | 0                   |
| 2      | D      | 2                   |
| ♭3     | E♭     | 3                   |
| 4      | F      | 5                   |
| 5      | G      | 7                   |
| ♭6     | A♭     | 8                   |
| 7      | B      | 11                  |

Semitone offsets from tonic:

$$ [0, 2, 3, 5, 7, 8, 11] $$

The raised seventh creates a major seventh interval above the tonic and a leading tone, and it produces a strong V–i cadence in minor keys.

## 6. The Melodic Minor Scale

The **melodic minor** raises both the sixth and seventh ascending to smooth out voice leading toward the tonic, then often reverts to natural minor descending:

**Ascending:**

$$ 1 - 2 - ♭3 - 4 - 5 - 6 - 7 $$

Semitone offsets:

$$ [0, 2, 3, 5, 7, 9, 11] $$

**Descending:** typically the same as natural minor (♭6, ♭7).

In C melodic minor (ascending):

| Degree | Letter | Semitone from tonic |
|--------|--------|---------------------|
| 1      | C      | 0                   |
| 2      | D      | 2                   |
| ♭3     | E♭     | 3                   |
| 4      | F      | 5                   |
| 5      | G      | 7                   |
| 6      | A      | 9                   |
| 7      | B      | 11                  |

Melodic minor is both a scale in its own right and the source of several important jazz and contemporary modes.

## 7. Modes of the Major Scale

The seven **diatonic modes** are rotations of the major scale, each starting on a different degree. Because they share the same pitch classes, they sound distinctly different due to their unique tonic and interval patterns.

### Ionian (Mode 1)

- Tonic on major scale degree 1
- Formula: $1 - 2 - 3 - 4 - 5 - 6 - 7$
- Identical to the major scale
- Characteristic: bright, stable, consonant

### Dorian (Mode 2)

- Tonic on major scale degree 2
- Formula: $1 - 2 - ♭3 - 4 - 5 - 6 - ♭7$
- Semitone offsets from tonic: $[0, 2, 3, 5, 7, 9, 10]$
- Characteristic: minor with a raised sixth — a "soulful" minor flavor

### Phrygian (Mode 3)

- Tonic on major scale degree 3
- Formula: $1 - ♭2 - ♭3 - 4 - 5 - ♭6 - ♭7$
- Semitone offsets: $[0, 1, 3, 5, 7, 8, 10]$
- Characteristic: minor with a lowered second, giving a Spanish or dark flavor

### Lydian (Mode 4)

- Tonic on major scale degree 4
- Formula: $1 - 2 - 3 - ♯4 - 5 - 6 - 7$
- Semitone offsets: $[0, 2, 4, 6, 7, 9, 11]$
- Characteristic: major with a raised fourth — floating, dreamy, bright

### Mixolydian (Mode 5)

- Tonic on major scale degree 5
- Formula: $1 - 2 - 3 - 4 - 5 - 6 - ♭7$
- Semitone offsets: $[0, 2, 4, 5, 7, 9, 10]$
- Characteristic: major with a flattened seventh — dominant, bluesy, rock-friendly

### Aeolian (Mode 6)

- Tonic on major scale degree 6
- Formula: $1 - 2 - ♭3 - 4 - 5 - ♭6 - ♭7$
- Semitone offsets: $[0, 2, 3, 5, 7, 8, 10]$
- Characteristic: the natural minor sound

### Locrian (Mode 7)

- Tonic on major scale degree 7
- Formula: $1 - ♭2 - ♭3 - 4 - ♭5 - ♭6 - ♭7$
- Semtone offsets: $[0, 1, 3, 5, 6, 8, 10]$
- Characteristic: diminished, unstable — rarely used as a tonic scale

## 8. Summary Table of Mode Formulas

Using $W$ = whole step, $H$ = half step, and scale-degree notation:

| Mode       | Formula (degrees)                        | Step pattern            | Semitone offsets              |
|------------|------------------------------------------|-------------------------|-------------------------------|
| Ionian     | $1, 2, 3, 4, 5, 6, 7$                   | $W-W-H-W-W-W-H$         | $[0,2,4,5,7,9,11]$           |
| Dorian     | $1, 2, ♭3, 4, 5, 6, ♭7$                 | $W-H-W-W-W-H-W$         | $[0,2,3,5,7,9,10]$           |
| Phrygian   | $1, ♭2, ♭3, 4, 5, ♭6, ♭7$               | $H-W-W-W-H-W-W$         | $[0,1,3,5,7,8,10]$           |
| Lydian     | $1, 2, 3, ♯4, 5, 6, 7$                  | $W-W-W-H-W-W-H$         | $[0,2,4,6,7,9,11]$           |
| Mixolydian | $1, 2, 3, 4, 5, 6, ♭7$                  | $W-W-H-W-W-H-W$         | $[0,2,4,5,7,9,10]$           |
| Aeolian    | $1, 2, ♭3, 4, 5, ♭6, ♭7$                | $W-H-W-W-H-W-W$         | $[0,2,3,5,7,8,10]$           |
| Locrian    | $1, ♭2, ♭3, 4, ♭5, ♭6, ♭7$              | $H-W-W-H-W-W-W$         | $[0,1,3,5,6,8,10]$           |

## 9. Pentatonic and Blues Scales (Overview)

Though not diatonic in the strict sense, these are foundational:

- **Major pentatonic:** $1, 2, 3, 5, 6$ — omitting the fourth and seventh.
- **Minor pentatonic:** $1, ♭3, 4, 5, ♭7$.
- **Blues scale:** minor pentatonic plus the "blue note," typically ♭5.

These scales are highly versatile and appear across genres.

## 10. Scale Construction Rules

When constructing or analyzing any scale:

1. The tonic defines the root pitch class.
2. Each scale degree must be spelled with a distinct letter name in succession (no repeated letters within one octave).
3. The pattern of whole and half steps (or semitone offsets) determines the scale's identity.
4. Alterations (♭, ♯) show deviation from the diatonic reference.

This makes it possible to derive any mode, variant, or altered scale systematically.

## 11. Summary

- Scales are ordered pitch-class collections with a tonic and a characteristic interval pattern.
- The major scale $W-W-H-W-W-W-H$ is the reference point for the seven diatonic modes.
- Natural, harmonic, and melodic minor each modify the diatonic baseline differently.
- Modes are rotations of the major scale, each with a distinct tonic and mood.
- Semitone offset arrays make scales computable and independent of any instrument.
