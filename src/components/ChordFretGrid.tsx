import React from 'react';
import { ChordShape } from '../types';
import { asSafeChord } from '../data/chordsData';
import type { InstrumentDefinition } from '../data/instruments';
import {
  chordPositionForStrings,
  detectBarre,
  fretWindow,
  isStandardGuitarTuning,
} from '../utils/chordVoicing';

interface ChordFretGridProps {
  chord: ChordShape;
  cardId: string;
  position: number;
  onPositionChange: (position: number) => void;
  /** Definition whose tuning the diagram is drawn against. */
  instrument: InstrumentDefinition;
  /**
   * Drawing only: drops the fret-position slider and its captions. Used by the progression
   * chart, which shows every chord of the set at once — twenty sliders would bury the
   * shapes they are meant to compare.
   */
  compact?: boolean;
}

/** Height of one string row, in pixels — the barre overlay is positioned against it. */
const ROW_HEIGHT = 25;
/** Width of the string-name gutter, matching the `24px` first grid column. */
const GUTTER_WIDTH = 24;
/** Drawn diameter of a fingertip dot, and of a barre. */
const DOT_SIZE = 18;

/**
 * The fret diagram drawn on a chord card: one row per string (highest string on top,
 * like tablature), a five-fret window as columns, and a slider to slide the voicing
 * along the neck. The tuning comes from the instrument registry, so the identical grid
 * draws guitar, bass, and ukulele shapes — only the strings and the ceiling change.
 *
 * Two things here are read from the shape rather than from its label, because the label
 * was where the page used to disagree with itself:
 *
 * - A barre is drawn as one bar across the strings the finger actually covers, found by
 *   `detectBarre`. The old diagram printed a separate dot per string, which read as six
 *   index fingers; and the word "Barre" used to live in some chord names but not others.
 * - The slider says "As written" only when the frets really are the stored shape. Chords
 *   with no stored grip (D♯ Minor, most sevenths) get a searched voicing, and calling that
 *   "Original" claimed an authority the search does not have.
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
  compact = false,
}) => {
  const safeChord = asSafeChord(chord);
  const strings = instrument.strings;
  const { frets, fingers, usedStoredShape } = chordPositionForStrings(
    chord,
    position,
    strings,
    instrument.maxFret
  );
  const { firstFret, fretCount, fretNumbers } = fretWindow(frets);
  const barre = detectBarre(frets, fingers);
  const columns = `${GUTTER_WIDTH}px repeat(${fretCount}, minmax(0, 1fr))`;

  const positionHint = usedStoredShape
    ? 'Slide the fingering up the neck (0 = the shape as written)'
    : isStandardGuitarTuning(strings)
      ? 'No stored grip for this chord — position 0 shows a voicing searched from its notes'
      : 'Slide the voicing up the neck (0 = the open position)';

  const positionLabel =
    position === 0 ? (usedStoredShape ? 'As written' : 'Open') : `Fret ${position}`;

  // Only draw a barre that is inside the visible window.
  const barreColumn = barre ? barre.fret - firstFret : -1;
  const showBarre = barre != null && barreColumn >= 0 && barreColumn < fretCount;

  // Rows are drawn highest string first, so string indexes map to rows upside down.
  const rowOf = (stringIndex: number) => strings.length - 1 - stringIndex;
  const barreTopRow = barre ? rowOf(barre.to) : 0;
  const barreBottomRow = barre ? rowOf(barre.from) : 0;

  // The strings the barre itself stops, so their individual dots are not drawn twice.
  const barredStrings = new Set<number>();
  if (showBarre && barre) {
    for (let string = barre.from; string <= barre.to; string += 1) {
      if (frets[string] === barre.fret && fingers[string] === barre.finger) {
        barredStrings.add(string);
      }
    }
  }

  return (
    <div className="rounded-md border border-[rgba(var(--overlay-rgb),0.08)] bg-[linear-gradient(100deg,#211c18,#131416)] px-3 py-2.5">
      <div className="mb-[7px] flex items-center justify-between gap-2 text-[11px] font-bold uppercase text-ink-muted">
        <span>{instrument.label} fingering</span>
        <span className="flex items-center gap-1.5">
          {showBarre && barre && (
            <span className="rounded-full bg-[rgba(var(--accent-rgb),0.18)] px-1.5 py-0.5 text-[10px] text-accent">
              Barre · fret {barre.fret}
            </span>
          )}
          {firstFret > 1 && (
            <span>
              Frets {firstFret}-{firstFret + fretCount - 1}
            </span>
          )}
        </span>
      </div>
      {!compact && (
      <div className="mb-2 grid gap-[3px]">
        <label
          className="flex items-center justify-between gap-2 text-[11px] text-ink-soft"
          htmlFor={`fret-position-${cardId}`}
        >
          <span>Fret position</span>
          <output className="text-xs font-bold text-accent">{positionLabel}</output>
        </label>
        <input
          id={`fret-position-${cardId}`}
          className="w-full min-w-0 accent-[var(--accent-primary)]"
          type="range"
          min={0}
          max={instrument.maxFret}
          step={1}
          value={position}
          title={positionHint}
          aria-label={`${safeChord.name} fret position`}
          aria-describedby={`fret-position-source-${cardId}`}
          onChange={(event) => onPositionChange(Number(event.currentTarget.value))}
        />
        <div
          className="flex items-center justify-between gap-2 text-[10px] text-ink-muted"
          aria-hidden="true"
        >
          <span id={`fret-position-source-${cardId}`}>
            {usedStoredShape ? 'As written' : 'Searched voicing'}
          </span>
          <span>Fret {instrument.maxFret}</span>
        </div>
      </div>
      )}
      <div
        className="grid pb-[3px] text-center text-[10px] text-ink-muted"
        aria-hidden="true"
        style={{ gridTemplateColumns: columns }}
      >
        <span />
        {fretNumbers.map((fret) => <span key={fret}>{fret}</span>)}
      </div>
      <div className="relative flex flex-col">
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
                  {fret === fretNumber && !barredStrings.has(stringIndex) && (
                    <span className="grid h-[18px] w-[18px] place-items-center rounded-full border border-white bg-accent text-[10px] font-extrabold text-[#071114] shadow-[0_0_8px_rgba(var(--accent-rgb),0.35)]">
                      {finger && finger !== 0 ? finger : ''}
                    </span>
                  )}
                </span>
              ))}
            </div>
          );
        })}

        {/* The barre, drawn once over the rows it covers instead of as one dot per string. */}
        {showBarre && barre && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-[2] flex items-center justify-center rounded-full border border-white bg-accent text-[10px] font-extrabold text-[#071114] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
            style={{
              top: `${barreTopRow * ROW_HEIGHT + 2}px`,
              height: `${(barreBottomRow - barreTopRow + 1) * ROW_HEIGHT - 4}px`,
              width: `${DOT_SIZE}px`,
              left: `calc(${GUTTER_WIDTH}px + (100% - ${GUTTER_WIDTH}px) * ${
                (barreColumn + 0.5) / fretCount
              } - ${DOT_SIZE / 2}px)`,
            }}
          >
            {barre.finger}
          </div>
        )}
      </div>
    </div>
  );
};
