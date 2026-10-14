#!/usr/bin/env python3
"""
generate_fretboard_data.py

Builds a fretboard coordinate map and writes it as JSON.

Standard tuning is used by default:
  string 1 (high E): E4
  string 2:          B3
  string 3:          G3
  string 4:          D3
  string 5:          A2
  string 6 (low E):  E2

Usage examples:
  python generate_fretboard_data.py
      -> writes music-theory-reference/04-data/guitar-fretboard-map.json
         using standard tuning.

  python generate_fretboard_data.py --low E2 A2 D3 G3 B3 E4
      -> same output, but with an explicit tuning.

  python generate_fretboard_data.py --output custom.json
      -> writes to custom.json instead.

Notes:
  - String 1 is the thinnest/high string; string 6 is the thickest/low string.
  - Fret 0 is the open string; each fret adds one semitone.
  - Pitches use scientific pitch notation and MIDI note numbers.
  - Frequencies are computed in 12-tone equal temperament with A4 = 440 Hz.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys
from typing import List, Tuple

# ---------------------------------------------------------------------------
# Reference constants
# ---------------------------------------------------------------------------

A4_MIDI = 69
A4_FREQ = 440.0


# ---------------------------------------------------------------------------
# Pitch helpers
# ---------------------------------------------------------------------------

# Natural note names used to spell pitches; C = 0 in pitch-class indexing.
_PITCH_CLASS_NAMES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
]


def semitone_to_pitch_class(semitone: int, use_flats: bool = False) -> str:
    """Return a pitch-class name for a semitone offset modulo 12.

    The default spelling is sharp-based (C, C#, D, ...). If use_flats is
    True, a simple flat-based spelling is returned for some classes.
    """
    pc = semitone % 12
    if use_flats and pc in (1, 6, 8, 10):
        return _FLAT_NAMES[pc]
    return _PITCH_CLASS_NAMES[pc]


# A simple flat alternative spelling for common pitch classes.
_flat_names_lookup = {
    1: "Db",
    3: "Eb",
    6: "Gb",
    8: "Ab",
    10: "Bb",
}


def scientific_pitch(midi_note: int) -> str:
    """Return scientific pitch notation, e.g. 69 -> "A4".

    Octave number changes at C: C0 is MIDI 12, so octave = midi // 12 - 1
    for most notes, with the C-based octave boundary.
    """
    # C0 corresponds to MIDI 12. Octave number = (midi // 12) - 1 for notes
    # on or above C0, but the convention is that octave changes at C.
    pc = midi_note % 12
    octave = midi_note // 12 - 1
    name = semitone_to_pitch_class(midi_note)
    return f"{name}{octave}"


def midi_to_freq(midi_note: int) -> float:
    """Convert a MIDI note number to a frequency in Hz (12-TET, A4=440)."""
    return A4_FREQ * (2.0 ** ((midi_note - A4_MIDI) / 12.0))


def parse_tuning(tuning_str: str) -> List[Tuple[str, int]]:
    """Parse a tuning specification into [(pitch_name, midi_number), ...].

    Expected order: string 6 first (lowest) down to string 1 last (highest),
    which matches how guitarists often speak about tuning, e.g.:
        E2 A2 D3 G3 B3 E4

    Returns the list in string 6 -> string 1 order.
    """
    tokens = tuning_str.split()
    if len(tokens) != 6:
        raise ValueError(
            f"Expected 6 open-string pitches, got {len(tokens)}: {tokens}"
        )

    parsed: List[Tuple[str, int]] = []
    for token in tokens:
        name, octave = _split_pitch_token(token)
        midi = _pitch_name_to_midi(name, int(octave))
        parsed.append((token, midi))
    return parsed


def _split_pitch_token(token: str) -> Tuple[str, int]:
    """Split a token like 'E2' or 'F#3' into (note_name, octave_int)."""
    i = 0
    while i < len(token) and token[i].isalpha():
        i += 1
    if i == 0 or i == len(token):
        raise ValueError(f"Cannot parse pitch token: {token!r}")
    note = token[:i]
    try:
        octave = int(token[i:])
    except ValueError as exc:
        raise ValueError(f"Cannot parse octave in token: {token!r}") from exc
    return note, octave


def _pitch_name_to_midi(name: str, octave: int) -> int:
    """Convert a pitch name and octave to a MIDI note number."""
    pc = _name_to_pitch_class(name)
    return pc + (octave + 1) * 12


def _name_to_pitch_class(name: str) -> int:
    """Return the pitch-class index for a string like 'C', 'F#', 'Eb'."""
    base = name[0].upper()
    if base < "A" or base > "G":
        raise ValueError(f"Invalid note name: {name!r}")
    base_pc = ord(base) - ord("C")
    if base_pc >= 3:  # C D E F G A B -> 0 1 2 3 4 5 6 7
        base_pc -= 1
    pc = base_pc % 7
    # Map from natural-note index to chromatic pitch class:
    # C=0 D=2 E=4 F=5 G=7 A=9 B=11
    natural_pc = [0, 2, 4, 5, 7, 9, 11]
    pc = natural_pc[pc]
    if len(name) > 1:
        accidental = name[1]
        if accidental == "#" or accidental == "♯":
            pc += 1
        elif accidental == "b" or accidental == "♭":
            pc -= 1
        else:
            raise ValueError(f"Unknown accidental in note name: {name!r}")
    return pc % 12


# ---------------------------------------------------------------------------
# Fretboard map builder
# ---------------------------------------------------------------------------

FREQ_FORMAT = "%.2f"

StringIdx = int  # 1-based, string 1 = high E, string 6 = low E


def build_fretboard_map(
    tuning: List[Tuple[str, int]],
    min_fret: int = 0,
    max_fret: int = 24,
) -> dict:
    """Build a fretboard coordinate map for the given tuning.

    Returns a dict like:
        {
          "meta": { ... },
          "byString": {
            1: [ {fret, note, scientificPitch, midi, frequencyHz}, ... ],
            ...
          }
        }

    `tuning` must be ordered string 6 first, string 1 last (low -> high).
    """
    if len(tuning) != 6:
        raise ValueError("Tuning must specify 6 strings.")

    meta = {
        "version": 1,
        "referencePitch": {
            "name": "A4",
            "midi": A4_MIDI,
            "frequencyHz": A4_FREQ,
        },
        "temperament": "12-TET",
        "stringsHighToLow": [
            {"string": 1, "tuningToken": tuning[5][0]},
            {"string": 2, "tuningToken": tuning[4][0]},
            {"string": 3, "tuningToken": tuning[3][0]},
            {"string": 4, "tuningToken": tuning[2][0]},
            {"string": 5, "tuningToken": tuning[1][0]},
            {"string": 6, "tuningToken": tuning[0][0]},
        ],
        "fretRange": {"min": min_fret, "max": max_fret},
    }

    by_string: dict = {}
    # tuning order is string 6..string 1. Convert to string 1..string 6.
    open_midi = [tuning[5][1], tuning[4][1], tuning[3][1], tuning[2][1],
                 tuning[1][1], tuning[0][1]]

    for string_index in range(1, 7):
        base_midi = open_midi[string_index - 1]
        entries = []
        for fret in range(min_fret, max_fret + 1):
            midi = base_midi + fret
            entries.append({
                "string": string_index,
                "fret": fret,
                "note": semitone_to_pitch_class(midi),
                "scientificPitch": scientific_pitch(midi),
                "midi": midi,
                "frequencyHz": float(FREQ_FORMAT % midi_to_freq(midi)),
            })
        by_string[string_index] = entries

    # Also expose a flat coordinate index keyed by "string,fret".
    coordinate_index = {}
    for string_index in range(1, 7):
        for entry in by_string[string_index]:
            key = f"{entry['string']},{entry['fret']}"
            coordinate_index[key] = entry

    return {
        "meta": meta,
        "byString": by_string,
        "coordinateIndex": coordinate_index,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def _default_output_path() -> pathlib.Path:
    """Default output path relative to the repository root.

    The script is stored under scripts/, so we walk up to the repo root
    and write into 04-data/guitar-fretboard-map.json.
    """
    script_dir = pathlib.Path(__file__).resolve().parent
    repo_root = script_dir.parent
    return repo_root / "04-data" / "guitar-fretboard-map.json"


STANDARD_TUNING = "E2 A2 D3 G3 B3 E4"


def main(argv: List[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Generate a guitar fretboard coordinate map as JSON."
    )
    parser.add_argument(
        "tuning",
        nargs="?",
        default=STANDARD_TUNING,
        help=(
            "Open string pitches from string 6 to string 1. "
            f"Default: {STANDARD_TUNING}"
        ),
    )
    parser.add_argument(
        "--output",
        "-o",
        type=pathlib.Path,
        default=None,
        help="Output JSON path. Default: 04-data/guitar-fretboard-map.json",
    )
    parser.add_argument(
        "--min-fret",
        type=int,
        default=0,
        help="Lowest fret to include (default: 0)",
    )
    parser.add_argument(
        "--max-fret",
        type=int,
        default=24,
        help="Highest fret to include (default: 24)",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        default=True,
        help="Write indented JSON (default on).",
    )
    parser.add_argument(
        "--compact",
        action="store_true",
        default=False,
        help="Write compact JSON.",
    )
    args = parser.parse_args(argv)

    if args.compact:
        indent = None
    else:
        indent = 2

    tuning = parse_tuning(args.tuning)
    data = build_fretboard_map(
        tuning,
        min_fret=args.min_fret,
        max_fret=args.max_fret,
    )

    output = args.output if args.output else _default_output_path()
    output.parent.mkdir(parents=True, exist_ok=True)

    json_text = json.dumps(data, indent=indent, ensure_ascii=False)
    output.write_text(json_text, encoding="utf-8")

    print(f"Wrote {output}")
    print(f"  strings: 1..6 (high E..low E)")
    print(f"  frets:   {args.min_fret}..{args.max_fret}")
    print(f"  tuning:  {args.tuning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
