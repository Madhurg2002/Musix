# 04 Roman Numeral Analysis

**Roman numeral analysis** is a method for labeling chords in relation to a key, rather than by their absolute note names. It reveals harmonic function, scale-degree relationships, and the structure of progressions in a way that is independent of transposition.

This module is instrument-agnostic.

## 1. Why Roman Numerals?

A chord name like "C major" tells you *what* the notes are but not *what the chord is doing* in the key. In C major, C major is the tonic; in G major, that same chord would be the IV and function completely differently.

Roman numeral analysis encodes:

- The chord's **scale degree** (the number)
- The chord's **quality** (major, minor, diminished, augmented)
- **Inversions** and **alterations** when needed

This makes analysis portable: the same progression in a different key has the same Roman numerals.

## 2. The Basic Numeral System

Scale degrees are represented by Roman numerals:

| Degree | Roman numeral | Meaning (in major)       |
|--------|---------------|--------------------------|
| 1      | I             | Tonic, major             |
| 2      | ii            | Supertonic, minor        |
| 3      | iii           | Mediant, minor           |
| 4      | IV            | Subdominant, major       |
| 5      | V             | Dominant, major          |
| 6      | vi            | Submediant, minor        |
| 7      | vii°          | Leading-tone, diminished |

**Case matters**:

- **Uppercase** (I, IV, V) indicates a *major* chord.
- **Lowercase** (ii, iii, vi) indicates a *minor* chord.
- **Diminished** chords use the lowercase symbol with a degree symbol or similar marking: vii°, ii° depending on context.

## 3. Chord Quality in the Numeral Notation

In a major key, the diatonic triad qualities are fixed:

| Scale degree | Triad quality | Typical numeral |
|--------------|---------------|-----------------|
| 1            | Major         | I               |
| 2            | Minor         | ii              |
| 3            | Minor         | iii             |
| 4            | Major         | IV              |
| 5            | Major         | V               |
| 6            | Minor         | vi              |
| 7            | Diminished    | vii°            |

When you see a numeral, its case immediately tells you the quality relative to the key.

## 4. Inversions

Roman numeral analysis notates inversions with **figured-bass-style symbols** or by indicating which chord tone is in the bass:

### Triads

| Position         | Symbol (common) | Bass note        |
|------------------|-----------------|------------------|
| Root position    | none (or 5/3)   | Root             |
| First inversion  | 6 (or 6/3)      | Third            |
| Second inversion | 6/4             | Fifth            |

For example:

- I⁶ means a tonic triad in first inversion.
- IV⁶/₄ means subdominant in second inversion.

### Seventh Chords

Seventh chords have four positions:

| Position         | Bass note     | Common symbol       |
|------------------|---------------|---------------------|
| Root position    | Root          | none (7/5/3 implied)|
| First inversion  | Third         | 6/5                |
| Second inversion  | Fifth         | 4/3                |
| Third inversion   | Seventh       | 4/2                |

Example: V⁷ is a dominant seventh in root position; V⁶/₅ is first inversion.

The exact figured symbols vary by convention, but the principle is consistent: the figures state the intervals above the bass.

## 5. Seventh Chords in Roman Numerals

Seventh chords are often written explicitly:

- Imaj⁷: tonic major seventh
- ii⁷: supertonic minor seventh
- V⁷: dominant seventh
- viiø⁷ (or vii°⁷ depending on context): half-diminished or diminished seventh depending on the key and scale

In major keys, the diatonic seventh chord on V is a dominant seventh because the seventh of that chord is naturally ♭7 relative to the scale, creating a major triad with a minor seventh.

## 6. Minor Keys

In minor keys, the scale is often altered in practice, especially the leading tone. As a result:

- The key signature is one of the minor key's relative major.
- The V chord is often **major** (V, not v) because of the raised leading tone from harmonic minor.
- The vii° is usually a diminished seventh chord built from the raised 7.

Common minor-key numerals:

| Function         | Typical numeral(s) |
|------------------|--------------------|
| Tonic            | i (sometimes imaj⁷)|
| Predominant      | ii°, iv, sometimes ♭VI |
| Dominant         | V (major), vii°    |
| Leading-tone area| vii°               |

When a chord borrows from the parallel major or uses ♭6, ♭7, ♭♭, etc., accidentals appear in the analysis.

## 7. Accidentals and Alterations

If a chord is **chromatic** relative to the key, accidentals are added to the numeral:

- ♭VI: a major chord built on the lowered sixth degree
- ♭VII: a major chord built on the lowered seventh
- II7: a secondary dominant (often V of V), written with an accidental to show it is not diatonic
- It⁺: an augmented tonic, if used

Accidentals clarify the relationship to the key and the source of the alteration.

## 8. Secondary Dominants and Applied Chords

A **secondary dominant** temporarily tonicizes another scale degree. It is written as:

- V/V (five of five): dominant of the dominant
- V/ii: dominant of the supertonic
- V/vi: dominant of the submediant
- etc.

These are analyzed as *applied dominants* — they have a temporary tonal center and resolve as a V → I would, but to a different degree.

For example, V/V in C major is D7, resolving to G (V).

## 9. Borrowed Chords and Modal Interchange

**Modal interchange** borrows chords from the parallel mode:

- In a major key, using chords from the parallel minor.
- Example: ♭VI, ♭VII, iv in a major context.

The analysis uses accidentals on the numeral to indicate the borrowed quality.

This explains why a chord can feel "familiar but different": it belongs to the same pitch center but a different mode.

## 10. Reading a Roman Numeral Progression

A Roman numeral progression tells you the structural motion regardless of key. For example:

$$ I \rightarrow vi \rightarrow ii \rightarrow V \rightarrow I $$

means:

- Start on tonic
- Move to submediant (a tonic substitute or predominant)
- Move to supertonic (predominant)
- Move to dominant (tension)
- Resolve to tonic

In any key, this sequence uses the same functional roles and very similar voice-leading patterns.

## 11. The Role of Analysis in Composition and Listening

Roman numeral analysis helps:

- Identify functional areas within a piece: tonic, predominant, dominant.
- See repeated structural patterns across keys.
- Predict likely resolutions based on harmonic function.
- Discuss music in a way that separates pitch names from structural behavior.

It is a descriptive tool, not a rulebook — it explains what is happening, not necessarily what must happen.

## 12. Variants and Conventions

Notations vary:

- Some sources use uppercase/lowercase strictly by quality; others use uppercase for all triads and indicate quality with symbols.
- Some use ° for diminished, + for augmented, ø for half-diminished.
- Figured-bass inversion symbols may be simplified or omitted depending on the style of analysis.

Consistency within a given analysis or textbook matters more than any single standard.

## 13. Example Analysis Outline

In C major:

| Chord | Roman numeral | Function |
|-------|---------------|----------|
| C     | I             | Tonic    |
| Dm    | ii            | Predominant |
| Em    | iii           | Tonic substitute / passing |
| F     | IV            | Predominant |
| G     | V             | Dominant |
| Am    | vi            | Predominant / tonic substitute |
| Bdim  | vii°          | Dominant-area |

A common cadence V → I would be notated:

$$ V \rightarrow I $$

A deceptive cadence:

$$ V \rightarrow vi $$

A plagal cadence:

$$ IV \rightarrow I $$

## 14. Summary

- Roman numeral analysis labels chords by scale degree, quality, and inversion.
- Uppercase vs. lowercase encodes major vs. minor; ° and other symbols encode diminished/augmented.
- Inversions are shown with figured symbols indicating the bass interval structure.
- Chromatic chords use accidentals or applied-chord notation (V/V, etc.).
- The system reveals functional structure independently of transposition.
- It is the standard analytical language for tonal Western music.
