import React, { useEffect, useId, useState } from 'react';
import type { NoteName } from '../types';
import { findOrCreateChord, asSafeChord } from '../data/chordsData';
import { instrumentFor } from '../data/instruments';
import { ALL_NOTES, inkOnNoteColor, noteColorFor } from '../utils/musicTheory';
import type { InstrumentType } from '../utils/audio';
import { ChordFretGrid } from './ChordFretGrid';
import { PianoKeyboard } from './PianoKeyboard';
import { ChipRow, type ChipOption } from './ChipRow';
import { Icon } from './Icon';
import { Modal } from './Modal';

/** The qualities the studio can add. Values are the `ChordShape.type` strings the data uses. */
export const ADD_CHORD_QUALITIES: readonly { value: string; label: string; tip: string }[] = [
  { value: 'Major', label: 'Major', tip: 'Major triad — 1 3 5' },
  { value: 'Minor', label: 'Minor', tip: 'Minor triad — 1 ♭3 5' },
  { value: '7th', label: '7th', tip: 'Dominant seventh — 1 3 5 ♭7' },
  { value: 'Major 7th', label: 'maj7', tip: 'Major seventh — 1 3 5 7' },
];

const QUALITY_OPTIONS: readonly ChipOption<string>[] = ADD_CHORD_QUALITIES.map((quality) => ({
  value: quality.value,
  label: quality.label,
  tip: quality.tip,
}));

interface AddChordPanelProps {
  /** Id of the heading, so the dialog can point `aria-labelledby` at it. */
  titleId: string;
  root: NoteName;
  quality: string;
  instrument: InstrumentType;
  onRootChange: (root: NoteName) => void;
  onQualityChange: (quality: string) => void;
  /** Called with the chosen chord — the panel owns no state, the dialog owns the draft. */
  onAdd: (root: NoteName, quality: string) => void;
  onClose: () => void;
}

/**
 * The body of the chord picker: a root grid, quality chips, and a live preview of the chord
 * you are about to add — name, notes, and the grip itself on the studio's instrument.
 *
 * Two dropdowns plus a button only said which *name* you were adding, not which shape you
 * would get; the preview answers that before the card lands on the board. Split from the
 * dialog around it so the content can be rendered and asserted without a portal target.
 */
export const AddChordPanel: React.FC<AddChordPanelProps> = ({
  titleId,
  root,
  quality,
  instrument,
  onRootChange,
  onQualityChange,
  onAdd,
  onClose,
}) => {
  const preview = findOrCreateChord(root, quality);
  const safePreview = asSafeChord(preview);
  const definition = instrumentFor(instrument);
  // A searched voicing is honest about itself, the same way the card's caption is.
  const hasStoredShape = preview.frets.some((fret) => fret >= 0);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onAdd(root, quality);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-[20px] font-bold">
            Add a chord
          </h3>
          <p className="m-0 text-[12px] text-ink-muted">
            Pick a root and a quality. The card is added when you press Add.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-transparent p-1 text-ink-soft hover:text-ink"
          aria-label="Close without adding a chord"
          data-tip="Close — nothing is added"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
          Root
        </span>
        <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Root note">
          {ALL_NOTES.map((note: NoteName) => (
            <button
              key={note}
              type="button"
              aria-pressed={note === root}
              data-tip={`Root ${note}`}
              className={`cursor-pointer rounded-xl border py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                note === root
                  ? 'border-accent bg-accent text-[color:var(--bg-primary)]'
                  : 'border-hairline bg-chip text-ink hover:border-accent'
              }`}
              onClick={() => onRootChange(note)}
            >
              {note}
            </button>
          ))}
        </div>
      </div>

      <ChipRow label="Quality" options={QUALITY_OPTIONS} value={quality} onChange={onQualityChange} />

      <div className="flex flex-col gap-2 rounded-md border border-[rgba(var(--overlay-rgb),0.08)] bg-[rgba(var(--overlay-rgb),0.03)] p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[17px] font-bold">{preview.name}</span>
          <span className="text-[11px] uppercase tracking-wide text-ink-muted">
            {hasStoredShape ? 'As written' : 'Derived voicing'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {safePreview.notes.map((note: NoteName, noteIndex: number) => (
            <span
              key={`${note}-${noteIndex}`}
              className="rounded-lg px-2 py-0.5 text-[12px] font-bold"
              style={{
                backgroundColor: noteColorFor(note),
                color: inkOnNoteColor(noteColorFor(note)),
              }}
            >
              {note} <small>({safePreview.intervals[noteIndex] ?? ''})</small>
            </span>
          ))}
        </div>

        {definition.layout === 'fretted' ? (
          <ChordFretGrid
            compact
            chord={preview}
            cardId="add-chord-preview"
            position={0}
            onPositionChange={() => {}}
            instrument={definition}
          />
        ) : (
          <PianoKeyboard
            variant="compact"
            octaves={1}
            activeNotes={[...safePreview.notes]}
            rootNote={preview.root}
            voice={definition.id}
          />
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-accent btn-sm" data-tip={`Add ${preview.name}`}>
          <Icon name="plus" /> Add {preview.name}
        </button>
      </div>
    </form>
  );
};

interface AddChordDialogProps {
  open: boolean;
  /** Where the picker starts — the last chord that was added, so repeats are one press. */
  initialRoot: NoteName;
  initialQuality: string;
  /** Instrument the preview is drawn on, so the popup shows the grip you will get. */
  instrument: InstrumentType;
  onAdd: (root: NoteName, quality: string) => void;
  onClose: () => void;
}

/**
 * The add-a-chord picker, as a popup instead of a row of selects that sat in the studio
 * header and shifted the toolbar around with the viewport.
 *
 * The draft lives here: cancelling leaves the board untouched, so a half-made choice never
 * lands in the progression. The shell (`Modal`) portals it to `document.body` so no card or
 * the navigation rail's overflow can clip it.
 *
 * Keyboard: Escape or the scrim closes it, Enter submits the form (so Add is one keystroke),
 * and focus returns to whatever opened it because the caller restores it on close.
 */
export const AddChordDialog: React.FC<AddChordDialogProps> = ({
  open,
  initialRoot,
  initialQuality,
  instrument,
  onAdd,
  onClose,
}) => {
  const titleId = useId();
  const [root, setRoot] = useState<NoteName>(initialRoot);
  const [quality, setQuality] = useState<string>(initialQuality);

  // Every open starts from the last chord added rather than from a stale draft.
  useEffect(() => {
    if (!open) return;
    setRoot(initialRoot);
    setQuality(initialQuality);
  }, [open, initialRoot, initialQuality]);

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <AddChordPanel
        titleId={titleId}
        root={root}
        quality={quality}
        instrument={instrument}
        onRootChange={setRoot}
        onQualityChange={setQuality}
        onAdd={onAdd}
        onClose={onClose}
      />
    </Modal>
  );
};
