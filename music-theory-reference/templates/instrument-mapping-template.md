# Instrument Mapping Template

This template is for adding a new instrument mapping to this repository while preserving the strict separation between instrument-agnostic theory and instrument-specific mechanics.

## 1. Where to Place a New Instrument

New instruments live under:

```
03-instrument-mappings/<instrument>/
```

For example:

```
03-instrument-mappings/piano/
03-instrument-mappings/bass/
03-instrument-mappings/violin/
```

Each instrument should have its own folder with an index file and modules describing its physical system.

## 2. Repository Rule

Do not introduce guitar-, piano-, valve-, fret-, bow-, or other instrument-specific assumptions into the core theory modules:

- `01-foundations/`
- `02-harmony-and-analysis/`
- `04-data/` (except instrument-specific data, if any)

Theory data may remain fully general. Instrument data and instrument documentation live only in `03-instrument-mappings/`.

## 3. Required Starting Files

Each new instrument should include at minimum:

- `01-<instrument>-system-and-pitch-realization.md` — how pitches are produced and organized on the instrument.
- `README.md` (optional per instrument) — map of that instrument's modules.

If the instrument has coordinate geometry, include a small coordinate system explanation early, so the rest of the instrument's docs can reference it.

## 4. Template Module Outline

You may use the following outline as a starting point:

```
<instrument>/
├── 01-<instrument>-system-and-pitch-realization.md
├── 02-<instrument>-coordinate-system.md
├── 03-<instrument>-chord-vocabulary.md
├── 04-<instrument>-scale-and-patter-naming.md
└── README.md
```

Adjust the module list to the instrument's actual mechanics.

## 5. Coordinate System Section

If the instrument has a spatial/positional layout, define:

- What the coordinates are (axes, numbering, orientation)
- What zero means
- How one step in each axis changes pitch or function
- What the mapping is from coordinates to pitch classes or note names
- Any important asymmetries in the layout

Make the coordinate explanation concrete. Future readers should be able to translate a coordinate into a pitch without guessing.

## 6. Chord and Scale Sections

When documenting chord or scale material:

- Be explicit about what changes versus standard theory and what is identical
- Show how the abstract interval/chord/scale maps onto the instrument
- Use diagrams, tables, or coordinate examples as appropriate
- If a concept exists in the abstract theory but is impractical or impossible on the instrument, say so

Do not duplicate the abstract formulas from `01-foundations/` unless restating them adds instrument-specific clarity.

## 7. Data Files (If Applicable)

If the instrument benefits from machine-readable data:

- Place it under `04-data/` with a clear naming scheme, e.g. `piano-key-map.json`
- Document the schema inside the README or a `schemas/` note
- Keep data disciplined: consistent keys, consistent naming, and a documented coordinate/pitch convention

If there is a generator script, place it under `scripts/` and document its usage.

## 8. Naming and Style

- Use the instrument name in lowercase folder names, e.g. `piano`, not `Piano`.
- Prefer stable, descriptive filenames with numeric prefixes if ordering matters.
- Use the same Markdown conventions and LaTeX usage already present in the repository.
- Keep ASCII diagrams clean and scannable.
- If adding a new data format, mirror the conventions already used in `04-data/` where possible.

## 9. Cross-References

In the instrument docs, cross-reference the relevant theory modules instead of re-explaining them:

- intervals → `01-foundations/02-intervals.md`
- scale formulas → `01-foundations/03-scale-formulas.md`
- chord construction → `01-foundations/04-chord-construction.md`
- diatonic harmony / Roman numeral analysis → `02-harmony-and-analysis/`

This keeps instrument mappings focused on the instrument and surfaces the link to the general theory.

## 10. Checklist Before Submitting

- [ ] New instrument folder created under `03-instrument-mappings/`
- [ ] No instrument-specific assumptions leaked into `01-foundations/` or `02-harmony-and-analysis/`
- [ ] Coordinate system defined before pattern/chord/scale sections
- [ ] Diagrams are clear and labeled
- [ ] Any data files are valid JSON (or other documented format) and match the documented schema
- [ ] Generator scripts, if any, run and produce the documented output
- [ ] Cross-references point to the existing theory modules

## 11. Example Stub

A minimal piano mapping stub might start as:

```markdown
# Piano

This module describes the piano as an instrument mapping for music theory.

## 1. The Piano as a Pitch System

The piano realizes the chromatic scale as a repeating set of keys arranged in
a linear layout of black and white keys. Each octave contains 12 chromatic
steps, and the keyboard repeats that pattern across the instrument's range.

## 2. Coordinate System

- Axis: keys left to right, lowest pitch to highest pitch
- One step = one semitone
- Octaves are labeled using scientific pitch notation

...
```

Adapt the stub to the instrument you are documenting.
