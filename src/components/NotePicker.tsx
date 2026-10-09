import React from 'react';
import { NoteName } from '../types';
import { ALL_NOTES, NOTE_COLORS } from '../utils/musicTheory';

interface NotePickerProps {
  /** Which note the picker currently has selected. */
  value: NoteName;
  onChange: (note: NoteName) => void;
  /**
   * How selection is painted: `border` outlines the chip in the note's colour (the scale
   * explorer's look), `fill` floods it (the interval explorer's look).
   */
  variant?: 'border' | 'fill';
  /** Layout utilities supplied by the host screen (wrap row vs four-column grid). */
  containerClassName?: string;
  /** Tooltip factory — says what pressing a note does in this context. */
  tipFor?: (note: NoteName) => string;
  /** Accessible name for the group of chips. */
  ariaLabel?: string;
}

/**
 * The twelve-note chip grid, shared by the scale explorer's root selector and both
 * pickers in the interval explorer. One place owns the note colours, the selected state,
 * and the tooltip pattern instead of three near-identical copies.
 */
export const NotePicker: React.FC<NotePickerProps> = ({
  value,
  onChange,
  variant = 'border',
  containerClassName,
  tipFor,
  ariaLabel,
}) => (
  <div className={containerClassName} role="group" aria-label={ariaLabel}>
    {ALL_NOTES.map((note) => (
      <button
        key={note}
        className={`flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-hairline font-bold transition-all duration-200 ${
          note === value
            ? 'bg-accent text-black shadow-[0_0_12px_var(--accent-primary)]'
            : 'bg-chip text-white'
          }`}
        data-tip={tipFor ? tipFor(note) : undefined}
        onClick={() => onChange(note)}
        style={
          variant === 'fill'
            ? { backgroundColor: note === value ? NOTE_COLORS[note] : undefined }
            : { borderColor: note === value ? NOTE_COLORS[note] : undefined }
        }
      >
        {note}
      </button>
    ))}
  </div>
);
