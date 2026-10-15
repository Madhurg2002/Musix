# Adding a new instrument

Every playable instrument in Musix is two things tied together:

1. **A voice** — the synthesis recipe in the sound engine (`src/utils/audio.ts`).
2. **A registry entry** — one object in `src/data/instruments.ts` that binds the voice to
   a name, a layout family, a tuning, and a fret ceiling.

The registry is the contract. Once an entry exists, the instrument appears in the top
bar's sound selector, in the Chord Studio's instrument chips, and in the preference
validator — no other wiring is needed. This page is the full checklist.

## Step 1 — give the sound engine a voice

The engine picks its recipe by id in `playNote` (`src/utils/audio.ts`):

1. Widen the union:

   ```ts
   export type InstrumentType = 'acoustic-guitar' | 'electric-guitar' | 'piano' | 'bass' | 'ukulele' | 'synth' | 'your-new-id';
   ```

2. Add a `case 'your-new-id':` branch in the `switch` inside `playNote` (around line 103).
   Each existing case shows the shape to follow: an oscillator/noise envelope tuned to
   mimic the instrument. `strumChord` needs no change — it loops over `playNote`.

The id you choose here is the registry's `id`, so keep them identical.

## Step 2 — add the registry entry

Append one object to `INSTRUMENTS` in `src/data/instruments.ts`:

```ts
{
  id: 'your-new-id',            // must match the InstrumentType union
  label: 'Your instrument',     // shown in menus and chips
  layout: 'fretted',            // 'fretted' or 'keyboard'
  strings: [ /* open strings, low pitch → high */ ],
  maxFret: 20,                  // voicing search ceiling (0 for keyboards)
},
```

Field notes:

- **`layout`** decides how chord cards draw the instrument. `'fretted'` renders
  `ChordFretGrid` (string rows, fret numbers, finger dots); `'keyboard'` renders
  `PianoKeyboard` with the chord tones lit. Keyboard instruments set `strings: []` and
  `maxFret: 0`.
- **`strings`** must be ordered so index `i` is `frets[i]` of a chord shape — the data
  convention is low pitch to high (the grid draws the highest string on top, like tab).
  Each entry needs `name`, `octave`, and `baseMidi` (C4 = 60). Copy the pattern of the
  four-string bass or the reentrant ukulele tuning in the registry.
- **Entry order is menu order.** The top bar's `<select>` and the studio's chips render
  the registry top to bottom, so place the new instrument where learners expect it.
- **`maxFret`** caps the voicing search and the studio's fret slider. 15–20 covers real
  instruments.

## What follows automatically

| Surface | Where it reads the registry |
| --- | --- |
| Top bar sound selector | `src/components/TopBar.tsx` (`INSTRUMENTS`, `INSTRUMENT_LABELS`) |
| Chord Studio instrument chips | `src/components/ChordWorkbench.tsx` (`INSTRUMENTS`, `instrumentFor`) |
| Chord card rendering (grid vs keyboard) | `ChordWorkbench` branches on `def.layout` |
| Voicing search against the tuning | `src/utils/chordVoicing.ts` (`getChordPosition`, `chordFrequencies`) |
| Saved-preference validation | `src/App.tsx` (`INSTRUMENT_IDS` — an unknown id degrades to the first entry) |

`instrumentFor(id)` never throws: an unknown id falls back to the acoustic guitar, the
same voice the sound engine falls back to, so a stale saved preference degrades instead
of crashing a render.

## Step 3 — verify

```bash
bunx tsc -b --noEmit   # the union widening and every registry consumer must typecheck
bun test               # src/utils/instruments.test.ts asserts registry/menu consistency
```

Then check the preview, because component behaviour is not covered by the suite:

1. The new name appears in the top bar selector **and** the Chord Studio chips, in the
   registry's position.
2. Pick it in the studio: fretted instruments show the string grid with the tuning's
   open-string names; keyboard instruments show the lit piano strip.
3. Play a chord — the sound matches the new voice, and the voicing only presses frets
   that exist on the instrument (never above `maxFret`).
4. Reload the page: the choice survives (the preference validator accepts the id).

## Checklist

- [ ] `InstrumentType` union widened in `src/utils/audio.ts`
- [ ] `playNote` case added for the new id
- [ ] `INSTRUMENTS` entry added with label, layout, strings, maxFret
- [ ] Entry placed at the right menu position
- [ ] `bunx tsc -b --noEmit` and `bun test` green
- [ ] Preview: menu, chips, drawing, sound, and persistence all checked
