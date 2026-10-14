# 01 Pitch and Frequencies

This module establishes the physics and notation foundations of musical pitch. It is instrument-agnostic and applies equally to any sound-producing system.

## 1. Note Names and Pitch Classes

Western music uses an alphabetic naming convention for discrete pitch levels:

```
A   B   C   D   E   F   G
```

After G, the sequence repeats at a higher register. Each discrete pitch within a register is a **note**. The set of twelve distinct pitch classes within an octave is:

```
C   C♯/D♭   D   D♯/E♭   E   F   F♯/G♭   G   G♯/A♭   A   A♯/B♭   B
```

Pitches that share the same pitch class but differ by one or more octaves are **enharmonically equivalent** in equal temperament — for example, C♯ and D♭ occupy the same key on a keyboard but may carry different functional meanings in notation and harmony.

## 2. Pitch Classes and Integers

A **pitch class** is the set of all notes with the same name across all octaves. In analytical work, pitch classes are often mapped to integers modulo 12 using **pitch-class set theory**:

| Pitch Class | Integer |
|-------------|---------|
| C           | 0       |
| C♯ / D♭     | 1       |
| D           | 2       |
| D♯ / E♭     | 3       |
| E           | 4       |
| F           | 5       |
| F♯ / G♭     | 6       |
| G           | 7       |
| G♯ / A♭     | 8       |
| A           | 9       |
| A♯ / B♭     | 10      |
| B           | 11      |

This mapping is typically written with C = 0 and wraps modulo 12. It is the foundation for set-class analysis, serial techniques, and computational music theory.

## 3. The Octave and Frequency Ratios

An **octave** is the interval between one pitch and another with double (or half) its frequency. If a pitch has frequency *f*, the pitch one octave higher has frequency *2f*, and one octave lower has frequency *f*/2.

The octave corresponds to a frequency ratio of:

$$ \frac{f_2}{f_1} = 2 $$

This simple ratio is why notes separated by an octave sound highly consonant and are perceived as "the same" note at different registers.

## 4. Equal Temperament

Modern Western music predominantly uses **12-tone equal temperament (12-TET)**. In this system:

- The octave is divided into 12 equal semitone steps.
- Each semitone multiplies frequency by the same constant ratio.

The ratio between adjacent semitones is the **twelfth root of two**:

$$ r = \sqrt[12]{2} \approx 1.059463094 $$

If *f₀* is the frequency of a reference pitch, the frequency *n* semitones higher is:

$$ f = f₀ \cdot r^n = f₀ \cdot 2^{n/12} $$

### Reference Pitch

The standard reference is **A₄ = 440 Hz**. Using the formula above, all other pitches in 12-TET can be derived.

For example, C₄ (middle C) is 9 semitones below A₄:

$$ f_{C4} = 440 \cdot 2^{-9/12} \approx 261.63 \text{ Hz} $$

## 5. Scientific Pitch Notation

**Scientific pitch notation** identifies each note by its letter name, accidental, and octave number. The octave number changes at each C:

- C₄ is "middle C"
- A₄ = 440 Hz (standard reference)
- C₀ ≈ 16.35 Hz, near the lower limit of human hearing

Octave numbering makes it unambiguous which register is intended, independent of the tuning system.

## 6. The Semitone and the Cent

The **semitone** is the smallest standard interval in 12-TET — the distance between adjacent keys on a keyboard or adjacent positions in the chromatic scale.

For finer granularity, the **cent** is used:

- 1 octave = 1200 cents
- 1 semitone = 100 cents

A frequency ratio *r* corresponds to:

$$ \text{cents} = 1200 \cdot \log_2(r) $$

This is useful for comparing tunings, intonation, and microtonal intervals.

## 7. Intervals, Frequency Ratios, and Consonance

Two pitches sound more consonant when their frequency ratio is simple (small integers). Classic examples include:

| Interval       | Frequency Ratio | Approximate Cents (Just) |
|----------------|-----------------|--------------------------|
| Octave         | 2 : 1           | 1200                     |
| Perfect Fifth  | 3 : 2           | ≈ 702                    |
| Perfect Fourth | 4 : 3           | ≈ 498                    |
| Major Third    | 5 : 4           | ≈ 386                    |
| Minor Third    | 6 : 5           | ≈ 316                    |

In 12-TET, these are approximated by equal-tempered semitone steps; for example, a perfect fifth is 7 semitones:

$$ 2^{7/12} \approx 1.4983 \approx 3:2 $$

## 8. Absolute vs. Relative Pitch

- **Absolute pitch** (sometimes called perfect pitch) is the ability to identify or reproduce a specific frequency without external reference.
- **Relative pitch** is the ability to identify or produce intervals and relationships between pitches.

Music theory works entirely in relative terms: scales, intervals, and harmony are defined by relationships between pitches, not by any single absolute frequency.

## 9. Pitch, Timbre, and Harmonics

A pitched sound is rarely a pure sine wave. Most instruments produce a **harmonic spectrum**:

$$ f_n = n \cdot f_0, \quad n = 1, 2, 3, \dots $$

where *f₀* is the **fundamental frequency** and the higher *fₙ* are **overtones** or **harmonics**. The fundamental determines the perceived pitch; the harmonic content determines **timbre**.

This is why a C₄ played on different instruments can sound different while still being perceived as the same pitch.

## 10. Summary

- Pitch is organized into **pitch classes** that repeat every octave.
- The octave is a 2:1 frequency ratio and the foundation of octave equivalence.
- 12-TET divides the octave into 12 equal semitones using the ratio $\sqrt[12]{2}$.
- Scientific pitch notation and the A₄ = 440 Hz standard make pitch unambiguous.
- Simple integer frequency ratios underpin consonance and the harmonic series.
- Interval-based relationships, not absolute frequencies, are the core of music theory.
