# 04 Chord Construction

A **chord** is a combination of three or more pitch classes sounded simultaneously. Chords are built by stacking intervals on top of a root note. This module explains how chords are constructed from intervals and scale degrees, purely in abstract harmonic terms.

This module is instrument-agnostic.

## 1. Root Position and Chord Formula

Every chord has a **root** — the pitch class that gives the chord its name and gravitational center. From the root, chord tones are built by stacking intervals.

A chord is commonly expressed as a **formula** over the root. For example:

- Major triad: $1 - 3 - 5$
- Minor seventh chord: $1 - ♭3 - 5 - ♭7$

In this notation, the numbers refer to scale degrees relative to the root, with accidentals indicating alterations. This is sometimes called **stacking thirds** because diatonic chords typically skip every other scale degree.

## 2. Triads

A **triad** is a three-note chord built from a root, a third, and a fifth. There are four primary triad types:

### Major Triad

$$ 1 - 3 - 5 $$

- Root to third: major third (4 semitones)
- Third to fifth: minor third (3 semitones)
- Root to fifth: perfect fifth (7 semitones)

Example in C: C – E – G.

### Minor Triad

$$ 1 - ♭3 - 5 $$

- Root to third: minor third (3 semitones)
- Third to fifth: major third (4 semitones)
- Root to fifth: perfect fifth (7 semitones)

Example in C minor: C – E♭ – G.

### Diminished Triad

$$ 1 - ♭3 - ♭5 $$

- Root to third: minor third (3 semitones)
- Third to fifth: minor third (3 semitones)
- Root to fifth: diminished fifth (6 semitones, a tritone)

Example in C diminished: C – E♭ – G♭.

The diminished triad is highly unstable and dissonant due to the tritone.

### Augmented Triad

$$ 1 - 3 - ♯5 $$

- Root to third: major third (4 semitones)
- Third to fifth: major third (4 semitones)
- Root to fifth: augmented fifth (8 semitones)

Example in C augmented: C – E – G♯.

The augmented triad is symmetric: its notes are equally spaced by major thirds, which gives it special properties in modulation and symmetric harmony.

## 3. Triad Summary

| Triad type | Formula           | Semitone intervals        | Character              |
|------------|-------------------|---------------------------|------------------------|
| Major      | $1 - 3 - 5$       | 4 + 3                     | Stable, bright         |
| Minor      | $1 - ♭3 - 5$      | 3 + 4                     | Stable, darker         |
| Diminished | $1 - ♭3 - ♭5$     | 3 + 3                     | Unstable, tense        |
| Augmented  | $1 - 3 - ♯5$      | 4 + 4                     | Symmetric, ambiguous   |

## 4. Seventh Chords

Seventh chords add a third on top of a triad — that is, they stack another third above the fifth. This yields four-note chords.

### Major Seventh (Maj7)

$$ 1 - 3 - 5 - 7 $$

- Built on a major triad plus a major seventh
- Semitone stack: 4 + 3 + 4
- Example in C: C – E – G – B

The major seventh chord has a luminous, dreamy, and somewhat unstable quality due to the major seventh interval.

### Dominant Seventh (7)

$$ 1 - 3 - 5 - ♭7 $$

- Built on a major triad plus a minor seventh
- Semitone stack: 4 + 3 + 3
- Example in C: C – E – G – B♭

The dominant seventh chord is strongly dissonant because of the tritone between the third and ♭7 (e.g., E and B♭). This creates a powerful tendency to resolve, typically to a tonic chord.

In a tonal context, a dominant seventh usually implies resolution to a tonic chord a fifth below (or a fourth above).

### Minor Seventh (m7)

$$ 1 - ♭3 - 5 - ♭7 $$

- Built on a minor triad plus a minor seventh
- Semitone stack: 3 + 4 + 3
- Example in C: C – E♭ – G – B♭

The minor seventh chord is softer and more subdued than a major seventh, often associated with minor tonalities and modal sounds.

### Minor Major Seventh (mMaj7)

$$ 1 - ♭3 - 5 - 7 $$

- Built on a minor triad plus a major seventh
- Semitone stack: 3 + 4 + 4
- Example in C: C – E♭ – G – B

This combines the minor triad's darkness with the major seventh's brightness, creating a tense, cinematic, or exotic color.

### Diminished Seventh (dim7)

$$ 1 - ♭3 - ♭5 - ♭♭7 $$

- The "seventh" is doubly flat, so the chord is fully symmetric
- Semitone stack: 3 + 3 + 3
- Example in C: C – E♭ – G♭ – B♭♭ (which is enharmonically A)

Because all intervals are minor thirds, a diminished seventh chord is symmetric: any note can be treated as the root depending on harmonic context.

### Half-Diminished Seventh (m7♭5 / ø7)

$$ 1 - ♭3 - ♭5 - ♭7 $$

- Built on a diminished triad plus a minor seventh
- Semitone stack: 3 + 3 + 4
- Example in C: C – E♭ – G♭ – B♭

The half-diminished chord is common as a ii chord in minor keys and has a distinctively dark, diminished-but-softer quality than a full dim7.

## 5. Seventh Chord Summary

| Chord type         | Formula                  | Semitone stack | Character                              |
|--------------------|--------------------------|----------------|----------------------------------------|
| Major seventh      | $1, 3, 5, 7$            | 4 + 3 + 4      | Bright, dreamy, somewhat unstable      |
| Dominant seventh   | $1, 3, 5, ♭7$           | 4 + 3 + 3      | Strong tension, resolves to tonic      |
| Minor seventh      | $1, ♭3, 5, ♭7$          | 3 + 4 + 3      | Smooth, commonly used in minor/modal   |
| Minor major seventh| $1, ♭3, 5, 7$           | 3 + 4 + 4      | Dark + bright, cinematic/exotic        |
| Diminished seventh | $1, ♭3, ♭5, ♭♭7$        | 3 + 3 + 3      | Fully symmetric, highly unstable       |
| Half-diminished    | $1, ♭3, ♭5, ♭7$         | 3 + 3 + 4      | Dark, ii–v in minor, softer than dim7  |

## 6. Extensions and Alterations

Beyond seventh chords, chords can be **extended** by adding more thirds above the root:

### Extensions

Extensions are built by continuing the stacking-third pattern beyond the seventh:

- 9th = two octaves plus a third above the root
- 11th = an additional third above the 9th
- 13th = an additional third above the 11th

In practice, extensions are often "brought down" by octaves or selectively voiced so that all notes lie within a playable range. For example, a 13th chord normally includes 1, 3, 5, ♭7, and 13, often omitting the 9 and 11 for clarity.

### Altered Chords

Altered dominant chords modify the upper extensions to increase tension:

- ♭9, ♯9, ♭5 / ♯11, ♭13 are common alterations
- Altered dominants strongly resolve to a tonic, often in jazz and dramatic harmonic contexts

An altered dominant is often written as C7(alt) and implies a set of available alterations, usually drawn from the altered scale (a mode of melodic minor).

## 7. Chord Quality and Function

Chords are also classified by **quality**, which describes the arrangement of major and minor thirds within the chord:

- **Major quality:** major triad or its extensions with a major seventh
- **Minor quality:** minor triad or its extensions with a minor seventh
- **Diminished quality:** fully diminished or half-diminished structures
- **Augmented quality:** augmented triad and its symmetric extensions
- **Dominant quality:** major triad with a minor seventh (and often alterations)

Quality is a shorthand for the chord's internal interval makeup and is independent of its harmonic function in a progression.

## 8. Diatonic vs. Non-Diatonic Chords

- **Diatonic chords** are built from notes within a given scale. For example, in a major scale, a chord on scale degree 5 (built from 5, 7, 2, 4) is naturally a dominant seventh.
- **Non-diatonic chords** borrow notes from outside the current scale — chromaticism, borrowed chords, modulations, and altered tones all fall into this category.

Understanding diatonic harmony first (see `02-harmony-and-analysis`) makes it easier to analyze when and why non-diatonic chords are used.

## 9. Inversion

A chord is in **root position** when its root is the lowest note. If a different chord tone is in the bass, the chord is **inverted**:

- First inversion: third in the bass
- Second inversion: fifth in the bass
- Third inversion (for seventh chords): seventh in the bass

Inversions change the harmonic function and voice-leading implications without changing the chord's pitch-class content.

Chord inversions can be notated with slash notation: for example, C/E means a C major triad with E in the bass.

## 10. Chord Construction Procedure

A systematic way to build any chord:

1. Choose a root pitch class.
2. Determine the chord type/quality (major, minor, dominant, diminished, etc.).
3. Apply the chord formula relative to the root using major scale degrees and accidentals as needed.
4. Stack the intervals step by step, being careful to spell correctly (each stacked third should move by letter name).
5. Add extensions or alterations if required, again observing correct spelling and function.

Correct spelling is essential for analysis, even when two notes sound the same enharmonically.

## 11. Summary

- Chords are built by stacking intervals on a root, most commonly in thirds.
- Triads (major, minor, diminished, augmented) are the core building blocks.
- Seventh chords add another third, yielding richer colors and stronger harmonic functions, especially the dominant seventh and its tritone.
- Extensions and alterations expand chord vocabulary into jazz and contemporary idioms.
- Quality, diatonic context, and inversion all affect a chord's role in harmony.
- This material is instrument-agnostic and forms the basis for diatonic harmony and Roman numeral analysis.
