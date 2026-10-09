import React from 'react';
import { ChordShape } from '../types';
import { asSafeChord } from '../data/chordsData';
import type { InstrumentDefinition } from '../data/instruments';
import { chordPositionForStrings, fretWindow, isStandardGuitarTuning } from '../utils/chordVoicing';

interface ChordFretGridProps {
  chord: ChordShape;
  cardId: string;
  position: number;
  onPositionChange: (position: number) => void;
  /** Definition whose tuning the diagram is drawn against. */
  instrument: InstrumentDefinition;
}

/**
 * The fret diagram drawn on a chord card: one row per string (highest string on top,
 * like tablature), a five-fret window as columns, and a slider to slide the voicing
 * along the neck. The tuning comes from the instrument registry, so the identical grid
 * draws guitar, bass, and ukulele shapes — only the strings and the ceiling change.
 *
 * Extracted from the chord studio so the component is reusable and the drawing rules
 * live next to the voicing maths they render.
 */
export const ChordFretGrid: React.FC<ChordFretGridProps> = ({
  chord,
  cardId,
  position,
  onPositionChange,
  instrument,
}) => {
  const safeChord = asSafeChord(chord);
  const { frets, fingers } = chordPositionForStrings(
    chord,
    position,
    instrument.strings,
    instrument.maxFret
  );
  const { firstFret, fretCount, fretNumbers } = fretWindow(frets);
  const strings = instrument.strings;
  const columns = `24px repeat(${fretCount}, minmax(0, 1fr))`;

  // Guitars hold stored shapes, so "Original" means the shape as written; the other
  // tunings always search, so position 0 is simply the open position.
  const positionHint = isStandardGuitarTuning(strings)
    ? 'Slide the fingering up the neck (0 = the shape as written)'
    : 'Slide the voicing up the neck (0 = the open position)';

  return (
    <div className="rounded-md border border-[rgba(var(--overlay-rgb),0.08)] bg-[linear-gradient(100deg,#211c18,#131416)] px-3 py-2.5">
      <div className="mb-[7px] flex justify-between gap-2 text-[11px] font-bold uppercase text-ink-muted">
        <span>{instrument.label} fingering</span>
        {firstFret > 1 && <span>Frets {firstFret}-{firstFret + fretCount - 1}</span>}
      </div>
      <div className="mb-2 grid gap-[3px]">
        <label
          className="flex items-center justify-between gap-2 text-[11px] text-ink-soft"
          htmlFor={`fret-position-${cardId}`}
        >
          <span>Fret position</span>
          <output className="text-xs font-bold text-accent">
            {position === 0 ? 'Original' : `Fret ${position}`}
          </output>
        </label>
        <input
          id={`fret-position-${cardId}`}
          className="h-[18px] w-full min-w-0 cursor-pointer accent-[var(--accent-primary)]"
          type="range"
          min={0}
          max={instrument.maxFret}
          step={1}
          value={position}
          title={positionHint}
          aria-label={`${safeChord.name} fret position`}
          onChange={(event) => onPositionChange(Number(event.currentTarget.value))}
        />
        <div
          className="flex items-center justify-between gap-2 text-[10px] text-ink-muted"
          aria-hidden="true"
        >
          <span>Original</span>
          <span>Fret {instrument.maxFret}</span>
        </div>
      </div>
      <div
        className="grid pb-[3px] text-center text-[10px] text-ink-muted"
        aria-hidden="true"
        style={{ gridTemplateColumns: columns }}
      >
        <span />
        {fretNumbers.map((fret) => <span key={fret}>{fret}</span>)}
      </div>
      <div className="flex flex-col">
        {strings.slice().reverse().map((stringInfo, displayIndex) => {
          const stringIndex = strings.length - displayIndex - 1;
          const fret = frets[stringIndex] ?? -1;
          const finger = fingers?.[stringIndex];

          return (
            <div
              className="relative grid h-[25px] items-stretch after:absolute after:left-6 after:right-0 after:top-1/2 after:h-px after:bg-[#a99b87] after:content-['']"
              key={`${stringInfo.name}-${displayIndex}`}
              style={{ gridTemplateColumns: columns }}
            >
              <span className="z-[1] flex items-center justify-between pr-1 font-display text-[10px] font-bold text-ink-soft">
                {stringInfo.name}
                <small className="text-[11px] text-highlight">
                  {fret === -1 ? '×' : fret === 0 ? '○' : ''}
                </small>
              </span>
              {fretNumbers.map((fretNumber) => (
                <span
                  className="z-[1] grid place-items-center border-r border-r-[rgba(220,220,220,0.3)] last:border-r-2"
                  key={fretNumber}
                >
                  {fret === fretNumber && (
                    <span className="grid h-[18px] w-[18px] place-items-center rounded-full border border-white bg-accent text-[10px] font-extrabold text-[#071114] shadow-[0_0_8px_rgba(var(--accent-rgb),0.35)]">
                      {finger && finger !== 0 ? finger : ''}
                    </span>
                  )}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
