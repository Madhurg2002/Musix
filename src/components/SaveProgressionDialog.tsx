import React, { useId, useState } from 'react';
import { MAX_PROGRESSION_NAME } from '../utils/savedProgressions';
import { Modal } from './Modal';
import { Icon } from './Icon';

interface SaveProgressionPanelProps {
  titleId: string;
  /** Prefilled name — a loaded preset and key, or the next free "My progression". */
  initialName: string;
  /** How many chords are being saved, so the form says what it is keeping. */
  cardCount: number;
  /** Names already in the library — typing one of them replaces that entry. */
  existingNames: readonly string[];
  onSave: (name: string) => void;
  onClose: () => void;
}

/**
 * The naming form itself, split from the dialog around it so its markup can be rendered and
 * asserted without a portal target.
 */
export const SaveProgressionPanel: React.FC<SaveProgressionPanelProps> = ({
  titleId,
  initialName,
  cardCount,
  existingNames,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();
  // Read from the name being typed, not from the suggestion: the hint has to stay true
  // when the learner renames it to something that already exists.
  const overwrites = existingNames.some(
    (existing) => existing.toLowerCase() === trimmed.toLowerCase()
  );

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed) onSave(trimmed);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 id={titleId} className="text-[20px] font-bold">
            Save this progression
          </h3>
          <p className="m-0 text-[12px] text-ink-muted">
            {cardCount} chord{cardCount === 1 ? '' : 's'} kept in this browser, so the set is
            here next time you open the studio.
          </p>
        </div>
        <button
          type="button"
          className="rounded bg-transparent p-1 text-ink-soft hover:text-ink"
          aria-label="Close without saving"
          data-tip="Close — nothing is saved"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
          Name
        </span>
        <input
          className="select-input"
          value={name}
          maxLength={MAX_PROGRESSION_NAME}
          autoFocus
          aria-describedby={`${titleId}-hint`}
          onChange={(event) => setName(event.currentTarget.value)}
        />
      </label>

      <p id={`${titleId}-hint`} className="m-0 text-[11px] text-ink-muted">
        {overwrites
          ? 'A saved progression already has this name — saving replaces it.'
          : `Up to ${MAX_PROGRESSION_NAME} characters. Saving under an existing name replaces it.`}
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-accent btn-sm"
          disabled={trimmed.length === 0}
          data-tip={overwrites ? 'Replace that saved progression' : 'Keep this progression for later'}
        >
          <Icon name="check" /> {overwrites ? 'Replace' : 'Save'}
        </button>
      </div>
    </form>
  );
};

interface SaveProgressionDialogProps {
  open: boolean;
  initialName: string;
  cardCount: number;
  existingNames: readonly string[];
  onSave: (name: string) => void;
  onClose: () => void;
}

/**
 * The Save-as popup. The name is the only choice, so it is prefilled with something
 * sensible (`12-bar blues in C`, or the next free `My progression N`) and the form saves on
 * Enter. A blank name cannot be submitted: a nameless saved progression would be
 * indistinguishable in the picker.
 */
export const SaveProgressionDialog: React.FC<SaveProgressionDialogProps> = ({
  open,
  initialName,
  cardCount,
  existingNames,
  onSave,
  onClose,
}) => {
  const titleId = useId();

  // `Modal` renders nothing while closed, so the panel mounts fresh on every open and the
  // input starts from the current suggestion rather than the previous save's name.
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId}>
      <SaveProgressionPanel
        titleId={titleId}
        initialName={initialName}
        cardCount={cardCount}
        existingNames={existingNames}
        onSave={onSave}
        onClose={onClose}
      />
    </Modal>
  );
};
