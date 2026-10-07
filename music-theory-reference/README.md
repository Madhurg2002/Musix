# Music Theory Reference

Handwritten reference copy for the Musix app. Keep the canonical notes here, and use
the matching structured pages in `04-data/` for the chord, scale, interval, and
fretboard displays.

## Directory map

```text
01-foundations/     # Pitch & frequencies, intervals, scale formulas, chord construction, rhythm & meter
02-harmony-and-analysis/ # Circle of fifths, diatonic harmony, voice leading, Roman numeral analysis
03-instrument-mappings/guitar/ # Fretboard layout, Caged, 3NP patterns, alternate tunings
04-data/            # Structured JSON: intervals, scale formulas, chord formulas, guitar map
templates/          # Hand-writing template for new instrument mapping pages
```

## Adding a new concept

1. Add or edit Markdown in `01-foundations/`, `02-harmony-and-analysis/`,
   or `03-instrument-mappings/guitar/`. Keep headings short and action-oriented.
2. Regenerate the app data copy:
   ```bash
   node scripts/build-pages.ts
   ```
3. Rebuild and preview:
   ```bash
   bun build
   bun preview
   ```
