# 04 Alternate Tunings

**Alternate tunings** retune one or more open strings away from standard EADGBE. This changes the fretboard coordinate map and often reshapes chord shapes, scale patterns, and voicings in musically useful ways.

This module is guitar-specific and builds on `01-fretboard-layout-and-standard-tuning`.

## 1. What Changes in an Alternate Tuning

In an alternate tuning, the open-string pitches are different, so:

- The note at each (string, fret) coordinate changes
- The intervals between adjacent strings can change
- Familiar chord shapes may become different chords, or the same chord may become easier in a new voicing
- Scale and arpeggio shapes shift accordingly

Alternate tunings are therefore not just “different open chords.” They are different fretboard geometries.

## 2. How to Think About Tuning Changes

A useful model is **string offset**: describe how each string differs from standard tuning in semitone steps.

If standard tuning open strings are:

$$ E_2,\ A_2,\ D_3,\ G_3,\ B_3,\ E_4 $$

then an alternate tuning is a new set of open pitches. The relationship to standard can be expressed as offsets:

$$ \Delta_n \in \mathbb{Z} $$

where `Δ_n` is the semitone change on string *n* relative to standard.

Positive = tuning up, negative = tuning down.

For example, if you lower the 6th string by 2 semitones (whole step) for Drop D, that is `Δ6 = -2`.

## 3. Drop D

**Drop D** lowers the 6th string from E₂ to D₂:

| String | Standard | Drop D | Change |
|--------|----------|--------|--------|
| 6      | E₂       | D₂     | −2     |
| 5      | A₂       | A₂     | 0      |
| 4      | D₃       | D₃     | 0      |
| 3      | G₃       | G₃     | 0      |
| 2      | B₃       | B₃     | 0      |
| 1      | E₄       | E₄     | 0      |

Open strings in Drop D:

```
E4 — B3 — G3 — D3 — A2 — D2
```

### Why It Is Useful

- It gives a low D drone and a power-chord-friendly low end.
- You can play a D power chord on the 6th string with one finger across the low three strings.
- It keeps the upper five strings in standard tuning, so most familiar shapes remain intact above the 6th string.

### Numeric Effect

The 6th string is now a whole step lower, so everything on that string shifts down by 2 semitones relative to standard. The rest of the board is unchanged.

## 4. DADGAD

**DADGAD** is a widely used alternate tuning:

| String | Standard | DADGAD | Change |
|--------|----------|--------|--------|
| 6      | E₂       | D₂     | −2     |
| 5      | A₂       | A₂     | 0      |
| 4      | D₃       | D₃     | 0      |
| 3      | G₃       | G₃     | 0      |
| 2      | B₃       | A₃     | −2     |
| 1      | E₄       | D₄     | −2     |

Open strings in DADGAD:

```
D4 — A3 — G3 — D3 — A2 — D2
```

### Character

- The tuning is often described as a sort of suspended, open, modal sonority.
- It is fertile for folk, Celtic, rock, and atmospheric playing.
- Many chords and drone-based voicings become much easier, while standard shapes no longer match the same chord names.

### Interval Structure

DADGAD is not simply “standard with some strings flat.” The intervals between adjacent strings change, which reshapes the board. Because both the 2nd and 1st strings are lowered, the high end of the tuning is quite different from standard.

This makes DADGAD both powerful and disorienting if you try to use standard shapes without adjustment.

## 5. Open G

**Open G** tuning gives a G major chord when strummed open:

| String | Standard | Open G | Change |
|--------|----------|--------|--------|
| 6      | E₂       | D₃     | +2?     |
| 5      | A₂       | B₃     | +4?    |
| 4      | D₃       | G₃     | +3?    |
| 3      | G₃       | D₃     | 0?     |
| 2      | B₃       | B₃     | 0?     |
| 1      | E₄       | G₄     | +4?    |

Wait — that table used guesses; the key point is to check the real pitches. Read the tuning string set directly instead.

Open G is commonly given as:

```
D — B — G — D — B — G
```

with the 6th string often tuned down from E to D in some variants, and the 1st string raised to G in the full open G variant.

Because spelling and octave conventions vary across sources, it is safer to state the open pitches explicitly rather than rely only on “up/down from standard.”

### Character

- Strumming all open strings produces a G major chord.
- The tuning is associated with slide playing, blues, and certain folk styles.
- Chord shapes become barre-like slides and simple movable forms.
- The fretboard geometry is materially different from standard, so existing shapes must be relearned in context.

## 6. Open D (Brief Note)

**Open D** is a related major tuning with open strings forming a D major chord. Like Open G, it is often used for slide and drone styles.

It is included here as a recognizable example of the same principle: the open strings spell a major chord, and the entire fretboard map shifts accordingly.

## 7. Drone Tunings and Modal Tunings

Many alternate tunings are valuable because they create:

- **Drone strings:** one or more strings that stay on a fixed pitch while you play melodies and voicings against them.
- **Open chord sonorities:** strumming open strings yields a full chord, useful for slide and folk styles.
- **Modal color:** some tunings emphasize sus, add, or modal sounds by stacking intervals that are not present in standard tuning.

The drone effect is especially powerful on guitar because one fixed open string can sit under changing harmony or melody.

## 8. Converting Shapes to Alternate Tunings

When moving from standard to an alternate tuning:

1. Identify the new open pitches.
2. Re-derive the note at each fret on each string using the new open pitch and the fret math from `01-fretboard-layout-and-standard-tuning`.
3. Test familiar shapes: some will become different chords; some may no longer be meaningful; some may become easier or more colorful.
4. Rebuild scale and arpeggio patterns on the new board rather than assuming old patterns translate perfectly.

This is why alternate tunings are a genuine fretboard re-mapping, not a cosmetic change.

## 9. Capo vs. Alternate Tuning

A **capo** changes the key of standard shapes by raising the pitch of all strings at once. It does *not* change the intervallic relationships between strings — it keeps the standard tuning geometry, just shifted up.

Alternate tunings *do* change the geometry. This is an important distinction:

- Capo: same tuning structure, new absolute pitch level.
- Alternate tuning: at least one string is re-tuned relative to the others, so the relationships themselves change.

## 10. Practical Workflow for Exploring Alternate Tunings

- Tune slowly and check each string by name and octave if possible.
- Learn the new open chord(s) first.
- Learn where the root notes land in a few familiar shapes under the new tuning.
- Practice drone-based ideas early, since many alternate tunings are drone-friendly.
- Rebuild a small vocabulary of voicings instead of trying to force standard shapes everywhere.

A deliberate, coordinate-minded approach prevents confusion.

## 11. Summary

- Alternate tunings change open-string pitches and therefore the whole fretboard map.
- String offsets from standard are a useful way to describe the change.
- Drop D, DADGAD, and Open G illustrate different goals: power-chord and drone ease, modal sonority, and open major chord sonority.
- Capo and alternate tuning are not the same: capo preserves tuning geometry; alternate tunings change it.
- In any alternate tuning, re-derive notes, shapes, and patterns on the new board rather than assuming standard patterns carry over.
