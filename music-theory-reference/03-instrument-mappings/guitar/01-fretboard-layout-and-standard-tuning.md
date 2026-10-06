# 01 Fretboard Layout and Standard Tuning

This module is the guitar-specific entry point for the `music-theory-reference` project. Unlike the instrument-agnostic core modules, here the focus is the physical geometry of the six-string guitar: open-string pitches, fret math, coordinates, and the unique major-third shift built into standard tuning.

## 1. The Guitar Fretboard as a Coordinate System

Think of the fretboard as a 2D grid:

- **Strings** run horizontally in most tab/ASCII representations. String 1 is the high E (thinnest), string 6 is the low E (thickest).
- **Frets** run vertically. Fret 0 is the nut (open string). Each successive fret raises the pitch by one semitone in 12-tone equal temperament.

Coordinates are written as **(string, fret)**, where:

- String 1 = high E
- String 6 = low E

For example, (2, 3) means 2nd string (B), 3rd fret.

The grid is the foundation for scale diagrams, chord shapes, CAGED, and every other fretboard system in this repo.

## 2. Standard Tuning: EADGBE

Standard tuning assigns the following open-string pitches:

| String (number) | String (name convention) | Open pitch | Scientific pitch | Octave (C-based numbering) |
|-----------------|--------------------------|------------|------------------|----------------------------|
| 1               | high E                  | E          | E₄               | 4                          |
| 2               | B                       | B          | B₃               | 3                          |
| 3               | G                       | G          | G₃               | 3                          |
| 4               | D                       | D          | D₃               | 3                          |
| 5               | A                       | A          | A₂               | 2                          |
| 6               | low E                   | E          | E₂               | 2                          |

So standard tuning is written top string to bottom string as:

```
E4 — B3 — G3 — D3 — A2 — E2
```

That is:

- String 1: E₄
- String 2: B₃
- String 3: G₃
- String 4: D₃
- String 5: A₂
- String 6: E₂

In guitar tab conventions, the high E is drawn at the top of the diagram and the low E at the bottom, so the diagram's vertical axis corresponds to pitch height from high (top) to low (bottom).

## 3. Why EADGBE Is What It Is

Standard tuning is a practical compromise between:

- Diatonic and chordal reach across the fretboard
- Scale playing efficiency
- The historical evolution of tunings for polyphony, melody, and chordal playing on a six-string, fretted instrument

One of its most important structural features is the **major third between the G and B strings**.

## 4. The Major Third Shift: G → B

Most adjacent string pairs in standard tuning are tuned a perfect fourth apart:

| Pair        | Interval |
|-------------|----------|
| 6 → 5       | P4       |
| 5 → 4       | P4       |
| 4 → 3       | P4       |
| 3 → 2       | P4       |

But the pair 3 → 2 (G → B) is a **major third**, not a perfect fourth.

That one exception has huge consequences:

- It shifts how scales, arpeggios, and chord shapes are voiced across the G/B boundary.
- It is the reason CAGED shapes, scale boxes, and many voicings do not simply “stack” in one uniform pattern across the whole neck.
- It also makes many chord shapes and scale fingerings ergonomically favorable by spreading interval content differently across the hand.

In ASCII representation:

```
String 6: E
          P4
String 5: A
          P4
String 4: D
          P4
String 3: G
          M3  <-- the shift
String 2: B
          P4
String 1: E
```

The G/B major third is the single most important asymmetry in standard tuning and should be top-of-mind whenever you reason about the fretboard.

## 5. Fret Math: How Semitones Map to Frets

Each fret is one semitone higher than the previous fret on the same string. With 12-TET, the frequency of the note at fret *f* on a string with open frequency *f₀* is:

$$ f_{\text{note}} = f_0 \cdot 2^{\,f/12} $$

So:

- Fret 0 = open string
- Fret 1 = +1 semitone
- Fret 12 = +12 semitones = one octave above the open string

Because each octave is 12 frets, the 12th fret repeats the open string pitch class one octave higher. This makes the octave a natural reference point for learning the fretboard.

For example, on the low E string (string 6):

- Fret 0 = E₂
- Fret 12 = E₃

## 6. Reading Fretboard Coordinates

A compact coordinate for any fretboard location is:

$$ (\text{string}, \text{fret}) \rightarrow \text{note} $$

Mapping examples in standard tuning:

| (string, fret) | Note    | Scientific pitch |
|----------------|---------|------------------|
| (6, 0)         | E       | E₂               |
| (6, 1)         | F       | F₂               |
| (6, 2)         | F♯/G♭   | F♯₂ / G♭₂        |
| (6, 12)        | E       | E₃               |
| (1, 0)         | E       | E₄               |
| (1, 12)        | E       | E₅               |
| (2, 0)         | B       | B₃               |
| (3, 0)         | G       | G₃               |

Because of the G/B shift, the note layout across frets is not a uniform “striped” pattern between all string pairs; the B string sits one semitone closer to the G string than the other fourths.

## 7. ASCII Fretboard Snippet (Open Position)

A compact vertical ASCII layout of open strings (read top = 1st string, bottom = 6th string):

```
E4 ─────────────────────────
B3 ─────────────────────────
G3 ─────────────────────────
D3 ─────────────────────────
A2 ─────────────────────────
E2 ─────────────────────────
```

With frets labeled at the left edge:

```
      0   1   2   3   4   5   6   7   8   9  10  11  12
E4 ───●──────────────────────────────────────────────────
B3 ──────●────────────────────────────────────────────────
G3 ──────────●────────────────────────────────────────────
D3 ──────────────●────────────────────────────────────────
A2 ──────────────────●────────────────────────────────────
E2 ──────────────────────●────────────────────────────────
```

The `●` marks here are placeholders illustrating that each open string starts at fret 0 on its own line — not a real position map.

A more realistic “open position on each string” view uses one marker per string at fret 0:

```
E4 ●
B3 ●
G3 ●
D3 ●
A2 ●
E2 ●
```

This is the “zero fret” axis from which all positions are counted.

## 8. Octave Shapes and Fretboard Landmarks

Because frets repeat pitch classes every 12 frets, octave relationships create useful landmarks:

- Fret 12 = open string pitch one octave higher
- Fret 7 on a lower string often relates to an octave of a note found on an adjacent higher string, depending on the tuning interval

These relationships are best learned positionally and note-by-note rather than as simple numeric formulas, precisely because the G/B major third shifts the “expected” pattern.

## 9. Position Thinking

Guitarists often think in **positions**: a hand placement covering a few frets at a time, with a designated “position” number (often defined by where the first finger sits relative to a fret).

Positions are a practical abstraction over the coordinate grid:

- They make scale and chord shapes portable.
- They connect naturally to CAGED and 5-box / 3NPS systems (see later modules).
- They coexist with the true underlying (string, fret) → note mapping.

A position does *not* change the tuning; it is just a way of grouping notes close together under one hand frame.

## 10. Practical Navigation Tips

- Learn open-string pitches by name and octave first.
- Learn the 5th and 7th frets as landmarks — especially the “octave from open string” at fret 12 and the common “fifth” relationship across strings under fourths.
- Always be aware of where the 3rd string meets the 2nd string; the major third changes the pattern there.
- Practice reading coordinates out loud: “string 5, fret 7, that’s …” rather than just “that shape.”

The coordinate view is what turns memorized shapes into an actual fretboard map.

## 11. What Comes Next

This module defines the board itself. The remaining guitar modules build on it:

- **02 CAGED system and movable shapes** — the five chord-shape families and how they move across this grid
- **03 Scale box patterns and 3NPS** — how scales are chunked and diagrammed on this board
- **04 Alternate tunings** — how the coordinate map changes when open-string pitches change
- **05 Triads and drop chords** — how chord tones are arranged and re-voiced across string groups

All of them assume the coordinate/tuning foundation established here.
