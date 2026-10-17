import React, { useEffect, useRef, useState } from 'react';
import { ChordCardItem, NoteName, ChordShape } from '../types';
import { findOrCreateChord, asSafeChord } from '../data/chordsData';
import { INSTRUMENTS, instrumentFor, type InstrumentDefinition } from '../data/instruments';
import { ALL_NOTES, inkOnNoteColor, noteColorFor } from '../utils/musicTheory';
import {
  chordFrequencies,
  isStandardGuitarTuning,
  transposeChordShape,
} from '../utils/chordVoicing';
import { soundEngine, type InstrumentType } from '../utils/audio';
import { ChordFretGrid } from './ChordFretGrid';
import { PianoKeyboard } from './PianoKeyboard';
import { ChipRow, type ChipOption } from './ChipRow';
import { Icon } from './Icon';
import {
  PROGRESSION_PRESETS,
  advanceRun,
  resolveProgression,
  romanNumeralFor,
  startRun,
  toggleRunPause,
  type PlaybackRun,
} from '../utils/progressions';
import { AddChordDialog } from './AddChordDialog';
import { SaveProgressionDialog } from './SaveProgressionDialog';
import { SelectMenu } from './SelectMenu';
import { PREFERENCE_KEYS, readPreference, writePreference } from '../utils/preferences';
import {
  cardsFromSavedCards,
  cardsFromSavedProgression,
  isSavedProgressionList,
  isStudioBoard,
  removeSavedProgression,
  saveProgression,
  suggestProgressionName,
  toSavedCards,
  MAX_SAVED_CARDS,
  type SavedProgression,
  type StudioBoard,
} from '../utils/savedProgressions';

/** How the studio shows the set: as full cards, or as one compact chart of every chord. */
type ViewMode = 'cards' | 'chart';

const VIEW_OPTIONS: readonly ChipOption<ViewMode>[] = [
  { value: 'cards', label: 'Cards', tip: 'Full cards — one diagram and control set per chord' },
  {
    value: 'chart',
    label: 'Chart',
    tip: 'Every chord of the set at once, as a chord chart with its numeral in the key',
  },
];

/** Chip options derived from the registry, so a new instrument appears automatically. */
const INSTRUMENT_OPTIONS: readonly ChipOption<InstrumentType>[] = INSTRUMENTS.map((def) => ({
  value: def.id,
  label: def.label,
  tip:
    def.layout === 'keyboard'
      ? `Draw every card on a ${def.label.toLowerCase()} keyboard`
      : `Finger every card on ${def.label.toLowerCase()} frets`,
}));

/** Chip options for the progression builder, derived so names can never drift. */
const PRESET_OPTIONS: readonly ChipOption<string>[] = PROGRESSION_PRESETS.map((preset) => ({
  value: preset.id,
  label: preset.name,
  tip: preset.tip,
}));

interface ProgressionChartProps {
  cards: ChordCardItem[];
  progressionKey: NoteName;
  presetName?: string;
  instrument: InstrumentDefinition;
  playingCardId: string | null;
  onPlay: (card: ChordCardItem) => void;
}

/**
 * Every chord of the set at once, written the way a chord chart writes one: position,
 * numeral in the key, name, notes, the shape itself, and a play button.
 *
 * The card view is for working on a single chord; this is for reading the whole progression
 * without scrolling past a dozen diagrams — a twelve-bar blues is twelve full cards tall.
 * The numeral is what makes it a chart rather than a list: `V7` says what the chord is doing
 * in the key, which a column of names cannot.
 */
export const ProgressionChart: React.FC<ProgressionChartProps> = ({
  cards,
  progressionKey,
  presetName,
  instrument,
  playingCardId,
  onPlay,
}) => (
  <div className="glass-card flex flex-col gap-3">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-[20px] font-bold">Progression Chart</h3>
      <span className="text-[12px] text-ink-muted">
        {cards.length} chord{cards.length === 1 ? '' : 's'} in the key of {progressionKey}
        {presetName ? ` · ${presetName}` : ''}
      </span>
    </div>

    <ol className="flex flex-col gap-3">
      {cards.map((item, index) => {
        const { chord, isMuted } = item;
        const numeral = romanNumeralFor(chord.root, chord.type, progressionKey);
        const safeChord = asSafeChord(chord);

        return (
          <li
            key={item.id}
            className={`grid items-center gap-3 rounded-md border border-[rgba(var(--overlay-rgb),0.08)] bg-[rgba(var(--overlay-rgb),0.03)] p-3 md:grid-cols-[34px_46px_minmax(0,1fr)_minmax(200px,260px)_auto] ${
              isMuted ? 'opacity-50 grayscale-[0.8]' : ''
            } ${
              playingCardId === item.id ? 'shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.55)]' : ''
            }`}
          >
            <span className="font-display text-[13px] text-ink-muted">#{index + 1}</span>
            <span
              className="font-display text-[17px] font-bold text-accent"
              data-tip={`Degree ${numeral} of ${progressionKey}`}
            >
              {numeral}
            </span>

            <div className="flex flex-col gap-1.5">
              <span className="text-[15px] font-bold">{chord.name}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {safeChord.notes.map((note: NoteName, noteIndex: number) => (
                  <span
                    key={`${note}-${noteIndex}`}
                    className="rounded-lg px-2 py-0.5 text-[12px] font-bold"
                    style={{
                      backgroundColor: noteColorFor(note),
                      color: inkOnNoteColor(noteColorFor(note)),
                    }}
                  >
                    {note} <small>({safeChord.intervals[noteIndex] ?? ''})</small>
                  </span>
                ))}
              </div>
            </div>

            {instrument.layout === 'fretted' ? (
              <ChordFretGrid
                compact
                chord={chord}
                cardId={`chart-${item.id}`}
                position={Math.min(item.fretPosition ?? 0, instrument.maxFret)}
                onPositionChange={() => {}}
                instrument={instrument}
              />
            ) : (
              <PianoKeyboard
                variant="compact"
                octaves={1}
                activeNotes={[...safeChord.notes]}
                rootNote={chord.root}
                voice={instrument.id}
              />
            )}

            <button
              className="btn btn-outline btn-sm"
              data-tip={`Strum ${chord.name} as it is drawn`}
              onClick={() => onPlay(item)}
            >
              <Icon name="play" /> Play
            </button>
          </li>
        );
      })}
    </ol>
  </div>
);

interface ProgressionPlaybackControlsProps {
  playing: boolean;
  paused: boolean;
  /** 1-based beat being heard, or 0 when the run is not going. */
  position: number;
  /** Beats in the run — the audible (unmuted) cards only. */
  total: number;
  onPlay: () => void;
  onTogglePause: () => void;
  onStop: () => void;
}

/**
 * Play / Pause / Resume / Stop for the whole progression.
 *
 * A run that can only be started is a run you have to sit through: the old single button
 * restarted from the top on every press, so a wrong chord or a phone call meant starting
 * the twelve-bar blues over. While the run is going, the button *becomes* Pause and a Stop
 * sits beside it, and the readout says which chord you are on.
 */
export const ProgressionPlaybackControls: React.FC<ProgressionPlaybackControlsProps> = ({
  playing,
  paused,
  position,
  total,
  onPlay,
  onTogglePause,
  onStop,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {!playing ? (
      <button
        className="btn btn-primary"
        data-tip="Strum every unmuted card in order — you can pause or stop it once it starts"
        disabled={total === 0}
        onClick={onPlay}
      >
        <Icon name="play" /> Play Progression
      </button>
    ) : (
      <>
        <button
          className={`btn ${paused ? 'btn-primary' : 'btn-danger'}`}
          aria-pressed={paused}
          data-tip={
            paused
              ? 'Carry on from the chord it stopped on'
              : 'Hold on the current chord — press again to carry on'
          }
          onClick={onTogglePause}
        >
          <Icon name={paused ? 'play' : 'pause'} /> {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          className="btn btn-outline"
          data-tip="Stop the run and go back to the first chord"
          onClick={onStop}
        >
          <Icon name="stop" /> Stop
        </button>
        <span className="text-[12px] text-ink-muted" role="status" aria-live="polite">
          {paused ? 'Paused on' : 'Playing'} chord {position} of {total}
        </span>
      </>
    )}
  </div>
);

interface ChordWorkbenchProps {
  onSelectChordForFretboard?: (chord: ChordShape) => void;
  onOpenTuner?: () => void;
  /**
   * Instrument the shell is using for this screen. The studio starts on it; the chips
   * below switch locally, and the studio re-syncs whenever the shell's choice changes
   * (a top-bar switch, or opening a screen whose default differs).
   */
  instrument?: InstrumentType;
}

export const ChordWorkbench: React.FC<ChordWorkbenchProps> = ({
  onSelectChordForFretboard,
  onOpenTuner,
  instrument = 'acoustic-guitar',
}) => {
  const [studioInstrumentId, setStudioInstrumentId] = useState<InstrumentType>(instrument);

  useEffect(() => setStudioInstrumentId(instrument), [instrument]);

  const studioInstrument = instrumentFor(studioInstrumentId);
  // The fretboard screen draws a guitar board, so only guitars offer the jump.
  const onGuitarBoard =
    studioInstrument.layout === 'fretted' && isStandardGuitarTuning(studioInstrument.strings);

  // The board as it was left last time. Named saves are the library; this is the working
  // set, so opening the studio resumes what you were building rather than resetting to the
  // three demo cards. Read once: it seeds the two states below and is never re-read.
  const [restoredBoard] = useState<StudioBoard | null>(() =>
    readPreference<StudioBoard | null>(PREFERENCE_KEYS.studioBoard, null, isStudioBoard)
  );
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>(() =>
    readPreference<SavedProgression[]>(
      PREFERENCE_KEYS.savedProgressions,
      [],
      isSavedProgressionList
    )
  );

  // Resolve the starting cards by name rather than by array index: the old
  // `COMPREHENSIVE_CHORDS[12]` default was commented "B Minor" but landed on D Major, and
  // any reordering of the data file silently changed what the studio opened with.
  const [cards, setCards] = useState<ChordCardItem[]>(() =>
    restoredBoard
      ? cardsFromSavedCards(restoredBoard.cards, 'card')
      : [
          { id: 'card-1', chord: findOrCreateChord('C', 'Major'), transposeOffset: 0 },
          { id: 'card-2', chord: findOrCreateChord('A', 'Major'), transposeOffset: 0 },
          { id: 'card-3', chord: findOrCreateChord('B', 'Minor'), transposeOffset: 0 },
        ]
  );

  // The add-chord popup: closed by default, and it remembers the last chord added.
  const [addChordOpen, setAddChordOpen] = useState(false);
  const [selectedRootToAdd, setSelectedRootToAdd] = useState<NoteName>('G');
  const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string>('Major');
  const addChordButtonRef = useRef<HTMLButtonElement | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dropTargetCardId, setDropTargetCardId] = useState<string | null>(null);

  // Progression playback state. The run walks one beat at a time through a single tracked
  // timer, so it can be paused (timer cancelled, position kept) instead of only restarted;
  // a queue of one-timer-per-beat could be cancelled but never held.
  const [playingCardId, setPlayingCardId] = useState<string | null>(null);
  const [playback, setPlayback] = useState<PlaybackRun | null>(null);
  const playbackTimer = useRef<number | null>(null);

  // Progression builder: presets resolve against this key, so switching the key reloads
  // the active preset instead of leaving the cards sitting in the old key.
  const [progressionKey, setProgressionKey] = useState<NoteName>(restoredBoard?.key ?? 'C');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // The learner's own library. `activeSavedId` is what the picker shows: it clears as soon
  // as the board is edited, because the set on screen is then no longer the saved one.
  const [activeSavedId, setActiveSavedId] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Keep both slots in step with state. Nothing is written before the learner allows
  // preference storage — `writePreference` holds the value until then.
  useEffect(() => {
    writePreference(PREFERENCE_KEYS.savedProgressions, savedProgressions);
  }, [savedProgressions]);

  useEffect(() => {
    writePreference(PREFERENCE_KEYS.studioBoard, { key: progressionKey, cards: toSavedCards(cards) });
  }, [cards, progressionKey]);

  // A half-pressed Delete must not stay armed while the learner looks away.
  useEffect(() => {
    if (!confirmingDelete) return;
    const timer = window.setTimeout(() => setConfirmingDelete(false), 5000);
    return () => window.clearTimeout(timer);
  }, [confirmingDelete]);
  // A twelve-bar blues is twelve cards tall; the chart view shows the same set in one screen.
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const clearPlaybackTimer = () => {
    if (playbackTimer.current !== null) {
      window.clearTimeout(playbackTimer.current);
      playbackTimer.current = null;
    }
  };

  /**
   * Cancel the run outright — the pending beat would otherwise sound after its card was
   * removed, or after the board was replaced by a preset.
   */
  const stopPlayback = () => {
    clearPlaybackTimer();
    setPlayback(null);
    setPlayingCardId(null);
  };

  useEffect(() => stopPlayback, []);

  const handleLoadPreset = (presetId: string, key: NoteName = progressionKey) => {
    const preset = PROGRESSION_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    stopPlayback();
    setCards(resolveProgression(preset, key));
    setActivePresetId(presetId);
    setActiveSavedId('');
  };

  /** A hand edit means the board is no longer the set that was saved or loaded. */
  const markEdited = () => {
    setActiveSavedId('');
    setActivePresetId(null);
    setConfirmingDelete(false);
  };

  const handleSaveProgression = (name: string) => {
    const { list, saved } = saveProgression(savedProgressions, {
      name,
      key: progressionKey,
      cards: toSavedCards(cards),
    });
    setSavedProgressions(list);
    setActiveSavedId(saved.id);
    setSaveDialogOpen(false);
  };

  const handleOpenSaved = (id: string) => {
    const saved = savedProgressions.find((entry) => entry.id === id);
    if (!saved) return;
    stopPlayback();
    // Rebuilt from roots and qualities, so the shapes are this build's, not the stored ones.
    setCards(cardsFromSavedProgression(saved));
    setProgressionKey(saved.key);
    setActivePresetId(null);
    setActiveSavedId(saved.id);
    setConfirmingDelete(false);
  };

  /** Delete is two-step: the first press arms it, the second removes it. */
  const handleDeleteSaved = () => {
    if (!activeSavedId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSavedProgressions(removeSavedProgression(savedProgressions, activeSavedId));
    setActiveSavedId('');
    setConfirmingDelete(false);
  };

  // Add new card. The popup closes itself on success and hands focus back to its trigger,
  // so the next chord is one keystroke away.
  const handleAddCard = (root: NoteName, quality: string) => {
    // The board is stored whole, so its length is capped here rather than silently clipped
    // when it is written.
    if (cards.length >= MAX_SAVED_CARDS) return;
    const newChord = findOrCreateChord(root, quality);
    const newCard: ChordCardItem = {
      // A timestamp collided when two cards were added within the same millisecond,
      // which gave React duplicate keys and made the wrong card act on a click.
      id: `card-${crypto.randomUUID()}`,
      chord: newChord,
      transposeOffset: 0,
      fretPosition: 0,
    };
    setCards([...cards, newCard]);
    setSelectedRootToAdd(root);
    setSelectedTypeToAdd(quality);
    setAddChordOpen(false);
    addChordButtonRef.current?.focus();
    markEdited();
  };

  const closeAddChord = () => {
    setAddChordOpen(false);
    addChordButtonRef.current?.focus();
  };

  // Remove card
  const handleRemoveCard = (id: string) => {
    // Removing a card mid-run would otherwise leave its queued beat still sounding.
    stopPlayback();
    setCards(cards.filter((c) => c.id !== id));
    markEdited();
  };

  const handleDuplicateCard = (id: string) => {
    const cardIndex = cards.findIndex((card) => card.id === id);
    if (cardIndex < 0) return;

    const duplicate = { ...cards[cardIndex]!, id: `card-${crypto.randomUUID()}` };
    setCards([...cards.slice(0, cardIndex + 1), duplicate, ...cards.slice(cardIndex + 1)]);
    markEdited();
  };

  const handleMoveCard = (id: string, offset: -1 | 1) => {
    markEdited();
    setCards((currentCards) => {
      const index = currentCards.findIndex((card) => card.id === id);
      const targetIndex = index + offset;
      if (index < 0 || targetIndex < 0 || targetIndex >= currentCards.length) return currentCards;

      const reorderedCards = [...currentCards];
      [reorderedCards[index], reorderedCards[targetIndex]] = [reorderedCards[targetIndex]!, reorderedCards[index]!];
      return reorderedCards;
    });
  };

  const handleReorderCard = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    markEdited();

    setCards((currentCards) => {
      const sourceIndex = currentCards.findIndex((card) => card.id === sourceId);
      const targetIndex = currentCards.findIndex((card) => card.id === targetId);
      if (sourceIndex < 0 || targetIndex < 0) return currentCards;

      const reorderedCards = [...currentCards];
      const [movedCard] = reorderedCards.splice(sourceIndex, 1);
      if (!movedCard) return currentCards;
      const insertionIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      reorderedCards.splice(insertionIndex, 0, movedCard);
      return reorderedCards;
    });
  };

  const handleCardPositionChange = (id: string, position: number) => {
    markEdited();
    setCards((currentCards) => currentCards.map((card) =>
      card.id === id ? { ...card, fretPosition: position } : card
    ));
  };

  // Transpose a card. The shape has to move with the name — transposing only the root and
  // notes left the original frets on screen and played the wrong voicing. The transposed
  // card now always carries frets for its own name, so it needs no playback offset.
  const handleTranspose = (id: string, delta: number) => {
    markEdited();
    setCards((currentCards) =>
      currentCards.map((item) => {
        if (item.id !== id) return item;
        const { chord, transposeOffset } = transposeChordShape(item.chord, delta);
        return { ...item, chord, transposeOffset, fretPosition: 0 };
      })
    );
  };

  // Play chord sound — voiced on the instrument the studio is showing, so a bass card
  // sounds in the bass register and a piano card plays a keyboard voicing.
  const handlePlayChord = (card: ChordCardItem) => {
    const frequencies = chordFrequencies(
      card.chord,
      Math.min(card.fretPosition ?? 0, studioInstrument.maxFret),
      card.transposeOffset,
      studioInstrument
    );
    const arpeggio = studioInstrument.layout === 'keyboard' ? 0.03 : 0.07;
    soundEngine.strumChord(frequencies, arpeggio, studioInstrument.id);
  };

  // Play every unmuted card in sequence. Muted cards are filtered out *before* the beat
  // is counted, so muting one closes the gap instead of leaving a silent 1.2s hole — the
  // old loop indexed the full array and simply skipped the sound.
  const BEAT_MS = 1200;
  const audibleCards = cards.filter((card) => !card.isMuted);

  /** Play the current beat, then schedule the next one — one timer for the whole run. */
  useEffect(() => {
    if (!playback || playback.paused) return;

    const card = audibleCards[playback.index];
    if (!card) {
      // The cards moved under the run (removed, muted, or replaced): end it cleanly.
      setPlayback(null);
      setPlayingCardId(null);
      return;
    }

    setPlayingCardId(card.id);
    handlePlayChord(card);

    playbackTimer.current = window.setTimeout(() => {
      playbackTimer.current = null;
      const next = advanceRun(playback, audibleCards.length);
      setPlayback(next);
      if (!next) setPlayingCardId(null);
    }, BEAT_MS);

    return clearPlaybackTimer;
    // `handlePlayChord` is rebuilt every render; the beat is keyed on what actually changes
    // it — the position in the run, the cards themselves, and the instrument voicing.
  }, [playback, cards, studioInstrumentId]);

  const handleStartProgression = () => {
    const run = startRun(audibleCards.length);
    if (!run) return;
    stopPlayback();
    setPlayback(run);
  };

  /**
   * Hold the run where it is. Pausing cancels the pending beat and drops the highlight;
   * resuming re-strums the chord it stopped on so the ear has something to join.
   */
  const handleToggleProgressionPause = () => {
    const next = toggleRunPause(playback);
    if (!next) return;
    if (next.paused) setPlayingCardId(null);
    clearPlaybackTimer();
    setPlayback(next);
  };

  return (
    <div className="flex flex-col">
      <div className="glass-card mb-6 flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-[1_1_300px] flex-col gap-1.5">
          <span className="section-badge inline-flex items-center gap-1.5">
            <Icon name="cards" /> Side-by-Side Studio
          </span>
          <h2>Chord Comparison Cards</h2>
          <p>
            Compare chords side by side: {cards.length} on the board, {cards.filter((card) => !card.isMuted).length} audible.
            See each note formula, exactly how the instrument fingers it, and hear the set as a progression.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* The chord picker lives in a popup: a root, a quality, and a preview of the grip. */}
          <button
            ref={addChordButtonRef}
            type="button"
            className="btn btn-accent"
            aria-haspopup="dialog"
            aria-expanded={addChordOpen}
            disabled={cards.length >= MAX_SAVED_CARDS}
            data-tip={
              cards.length >= MAX_SAVED_CARDS
                ? `The board holds ${MAX_SAVED_CARDS} cards — remove one to add another`
                : 'Open the chord picker — choose a root and quality, preview the grip, then add it'
            }
            onClick={() => setAddChordOpen(true)}
          >
            <Icon name="plus" /> Add Chord
          </button>

          {onOpenTuner && (
            <button
              className="btn btn-outline"
              data-tip="Jump to the microphone tuner"
              onClick={onOpenTuner}
            >
              <Icon name="target" /> Open Tuner
            </button>
          )}

          <ProgressionPlaybackControls
            playing={playback !== null}
            paused={playback?.paused ?? false}
            position={playback ? playback.index + 1 : 0}
            total={audibleCards.length}
            onPlay={handleStartProgression}
            onTogglePause={handleToggleProgressionPause}
            onStop={stopPlayback}
          />
        </div>
      </div>

      {/* Progression builder: named presets load a whole card set in the chosen key */}
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ChipRow
          label="Progression"
          options={PRESET_OPTIONS}
          value={activePresetId ?? ''}
          onChange={(presetId) => handleLoadPreset(presetId)}
        />
        <select
          className="select-input"
          value={progressionKey}
          title="Key the progression presets resolve in"
          onChange={(event) => {
            const key = event.target.value as NoteName;
            setProgressionKey(key);
            if (activePresetId) handleLoadPreset(activePresetId, key);
          }}
        >
          {ALL_NOTES.map((n: NoteName) => (
            <option key={n} value={n}>
              Key {n}
            </option>
          ))}
        </select>
        <ChipRow label="View" options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
      </div>

      {/*
        * The learner's own library. The picker opens a saved set, Save names the board on
        * screen, and Delete only ever targets the entry the picker is showing.
        */}
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
          My progressions
        </span>
        <SelectMenu
          value={activeSavedId}
          ariaLabel="Saved progressions"
          tip={
            savedProgressions.length === 0
              ? 'Nothing saved yet — build a set and press Save'
              : 'Load a progression you saved in this browser'
          }
          className="min-w-[220px]"
          options={[
            {
              id: '',
              label:
                savedProgressions.length === 0
                  ? 'Nothing saved yet'
                  : 'Open a saved progression…',
            },
            ...savedProgressions.map((entry) => ({
              id: entry.id,
              label: `${entry.name} · ${entry.key}`,
            })),
          ]}
          onChange={(id) => {
            if (id) handleOpenSaved(id);
          }}
        />
        <button
          className="btn btn-outline btn-sm"
          data-tip="Name this set and keep it in this browser"
          onClick={() => setSaveDialogOpen(true)}
        >
          <Icon name="plus" /> Save
        </button>
        {activeSavedId && (
          <button
            className={`btn btn-sm ${confirmingDelete ? 'btn-danger' : 'btn-outline'}`}
            data-tip={
              confirmingDelete
                ? 'Press again to remove it from this browser'
                : 'Remove the saved progression the picker is showing'
            }
            onClick={handleDeleteSaved}
          >
            <Icon name="close" /> {confirmingDelete ? 'Confirm delete' : 'Delete'}
          </button>
        )}
        <span className="text-[12px] text-ink-muted">
          {savedProgressions.length} saved
        </span>
      </div>

      {/* Instrument switch: every card redraws and replays on the chosen instrument */}
      <div className="mb-6">
        <ChipRow
          label="Instrument"
          options={INSTRUMENT_OPTIONS}
          value={studioInstrumentId}
          onChange={setStudioInstrumentId}
        />
      </div>

      {/*
        * Chart view: every chord of the set at once, as a chord chart would write it —
        * position, numeral in the current key, name, notes, the shape itself, and a play
        * button. The card view is for working on one chord; this is for reading the whole
        * progression without scrolling past twelve diagrams.
        */}
      {viewMode === 'chart' ? (
        <ProgressionChart
          cards={cards}
          progressionKey={progressionKey}
          presetName={PROGRESSION_PRESETS.find((preset) => preset.id === activePresetId)?.name}
          instrument={studioInstrument}
          playingCardId={playingCardId}
          onPlay={handlePlayChord}
        />
      ) : (
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
        {cards.map((item, index) => {
          const { chord, isMuted } = item;
          return (
            <div
              key={item.id}
              className={`glass-card flex flex-col gap-4 border-t-[3px] border-t-accent ${
                isMuted ? 'opacity-50 grayscale-[0.8]' : ''
              } ${
                playingCardId === item.id ? 'shadow-[0_0_0_2px_rgba(var(--accent-rgb),0.55)]' : ''
              } ${
                draggedCardId === item.id ? 'opacity-[0.55]' : ''
              } ${
                dropTargetCardId === item.id
                  ? 'outline-2 outline-dashed outline-accent outline-offset-2'
                  : ''
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetCardId(item.id);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTargetCardId(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/plain');
                if (sourceId) handleReorderCard(sourceId, item.id);
                setDraggedCardId(null);
                setDropTargetCardId(null);
              }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-[rgba(var(--overlay-rgb),0.1)] px-2 py-0.5 font-display text-xs">
                  #{index + 1}
                </span>
                <span className="rounded-full bg-[rgba(var(--success-rgb),0.15)] px-2 py-0.5 text-[11px] font-bold uppercase text-success">
                  {chord.difficulty}
                </span>
                <div className="flex gap-1.5">
                  <button
                    className="cursor-grab touch-none rounded bg-transparent p-1 text-base text-ink-soft hover:text-accent active:cursor-grabbing"
                    type="button"
                    draggable
                    aria-label={`Drag to reorder ${chord.name}`}
                    aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                    data-tip="Drag to reorder — Alt+↑/↓ also works"
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/plain', item.id);
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedCardId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggedCardId(null);
                      setDropTargetCardId(null);
                    }}
                    onKeyDown={(event) => {
                      if (!event.altKey) return;
                      if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        handleMoveCard(item.id, -1);
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        handleMoveCard(item.id, 1);
                      }
                    }}
                  >
                    <Icon name="grip" />
                  </button>
                  <button
                    className="rounded bg-transparent p-1 text-base text-ink-soft hover:text-accent"
                    type="button"
                    aria-label={`Duplicate ${chord.name}`}
                    data-tip="Duplicate this card"
                    onClick={() => handleDuplicateCard(item.id)}
                  >
                    <Icon name="copy" />
                  </button>
                  <button
                    className="rounded bg-transparent p-1 text-base text-ink-soft hover:text-accent"
                    data-tip={isMuted ? 'Unmute — let this card play again' : 'Mute — skip this card during playback'}
                    type="button"
                    onClick={() => {
                      markEdited();
                      setCards(
                        cards.map((c) => (c.id === item.id ? { ...c, isMuted: !c.isMuted } : c))
                      );
                    }}
                  >
                    {isMuted ? <Icon name="volume-off" /> : <Icon name="volume" />}
                  </button>
                  <button
                    className="rounded bg-transparent p-1 text-base text-ink-soft hover:text-alert"
                    type="button"
                    aria-label={`Remove ${chord.name}`}
                    data-tip="Remove this card"
                    onClick={() => handleRemoveCard(item.id)}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3.5">
                <h3 className="text-[22px] font-bold">{chord.name}</h3>

                {/* Notes Pill Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] text-ink-muted">Notes:</span>
                  {asSafeChord(chord).notes.map((note: NoteName, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-xl px-2.5 py-1 text-[13px] font-bold shadow-[0_2px_8px_rgba(var(--inset-rgb),0.3)]"
                      style={{ backgroundColor: noteColorFor(note), color: inkOnNoteColor(noteColorFor(note)) }}
                    >
                      {note} <small>({asSafeChord(chord).intervals[idx] ?? ''})</small>
                    </span>
                  ))}
                </div>

                {studioInstrument.layout === 'fretted' ? (
                  <ChordFretGrid
                    chord={chord}
                    cardId={item.id}
                    position={Math.min(item.fretPosition ?? 0, studioInstrument.maxFret)}
                    onPositionChange={(position) => handleCardPositionChange(item.id, position)}
                    instrument={studioInstrument}
                  />
                ) : (
                  <div className="rounded-md border border-[rgba(var(--overlay-rgb),0.08)] bg-[linear-gradient(100deg,#211c18,#131416)] px-3 py-2.5">
                    <div className="mb-[7px] flex justify-between gap-2 text-[11px] font-bold uppercase text-ink-muted">
                      <span>{studioInstrument.label} voicing</span>
                    </div>
                    <PianoKeyboard
                      variant="compact"
                      octaves={1}
                      activeNotes={[...asSafeChord(chord).notes]}
                      rootNote={chord.root}
                      voice={studioInstrument.id}
                    />
                  </div>
                )}

                {/* Transpose & Action Footer */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="mr-1 text-xs text-ink-muted">Transpose:</span>
                    <button
                      className="btn-nano"
                      onClick={() => handleTranspose(item.id, -1)}
                      data-tip="Down one semitone — the shape moves with the name"
                    >
                      -1
                    </button>
                    <button
                      className="btn-nano"
                      onClick={() => handleTranspose(item.id, 1)}
                      data-tip="Up one semitone — the shape moves with the name"
                    >
                      +1
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    {onSelectChordForFretboard && onGuitarBoard && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectChordForFretboard(chord)}
                        data-tip={`Show ${chord.name} on the full fretboard`}
                      >
                        <Icon name="guitar" /> Open Fretboard
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      data-tip="Strum this voicing as it is drawn"
                      onClick={() => handlePlayChord(item)}
                    >
                      <Icon name="play" /> Play Audio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {cards.length === 0 && (
        <div className="glass-card flex flex-col items-start gap-2">
          <span className="section-badge inline-flex items-center gap-1.5">
            <Icon name="cards" /> Empty board
          </span>
          <h3>No cards yet</h3>
          <p>
            Press Add Chord to pick a root and a quality, or load a progression preset to
            fill the board in one go.
          </p>
        </div>
      )}

      <SaveProgressionDialog
        open={saveDialogOpen}
        initialName={
          // Saving the set you just opened should offer its own name, so one press replaces
          // it instead of adding a duplicate under a generated title.
          savedProgressions.find((entry) => entry.id === activeSavedId)?.name ??
          suggestProgressionName(
            PROGRESSION_PRESETS.find((preset) => preset.id === activePresetId)?.name,
            progressionKey,
            savedProgressions.map((entry) => entry.name)
          )
        }
        cardCount={cards.length}
        existingNames={savedProgressions.map((entry) => entry.name)}
        onSave={handleSaveProgression}
        onClose={() => setSaveDialogOpen(false)}
      />

      <AddChordDialog
        open={addChordOpen}
        initialRoot={selectedRootToAdd}
        initialQuality={selectedTypeToAdd}
        instrument={studioInstrumentId}
        onAdd={handleAddCard}
        onClose={closeAddChord}
      />
    </div>
  );
};
