import React, { useEffect, useState } from 'react';
import { ChordCardItem, NoteName, ChordShape } from '../types';
import { findOrCreateChord, asSafeChord } from '../data/chordsData';
import { INSTRUMENTS, instrumentFor } from '../data/instruments';
import { ALL_NOTES, noteColorFor } from '../utils/musicTheory';
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
import { PROGRESSION_PRESETS, resolveProgression } from '../utils/progressions';

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

  // Resolve the starting cards by name rather than by array index: the old
  // `COMPREHENSIVE_CHORDS[12]` default was commented "B Minor" but landed on D Major, and
  // any reordering of the data file silently changed what the studio opened with.
  const [cards, setCards] = useState<ChordCardItem[]>(() => [
    { id: 'card-1', chord: findOrCreateChord('C', 'Major'), transposeOffset: 0 },
    { id: 'card-2', chord: findOrCreateChord('A', 'Major'), transposeOffset: 0 },
    { id: 'card-3', chord: findOrCreateChord('B', 'Minor'), transposeOffset: 0 },
  ]);

  const [selectedRootToAdd, setSelectedRootToAdd] = useState<NoteName>('G');
  const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string>('Major');
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dropTargetCardId, setDropTargetCardId] = useState<string | null>(null);

  // Progression builder: presets resolve against this key, so switching the key reloads
  // the active preset instead of leaving the cards sitting in the old key.
  const [progressionKey, setProgressionKey] = useState<NoteName>('C');
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const handleLoadPreset = (presetId: string, key: NoteName = progressionKey) => {
    const preset = PROGRESSION_PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    setCards(resolveProgression(preset, key));
    setActivePresetId(presetId);
  };

  // Add new card
  const handleAddCard = () => {
    const newChord = findOrCreateChord(selectedRootToAdd, selectedTypeToAdd);
    const newCard: ChordCardItem = {
      id: `card-${Date.now()}`,
      chord: newChord,
      transposeOffset: 0,
      fretPosition: 0,
    };
    setCards([...cards, newCard]);
    // Hand-editing the set means it is no longer the preset that was loaded.
    setActivePresetId(null);
  };

  // Remove card
  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
    setActivePresetId(null);
  };

  const handleDuplicateCard = (id: string) => {
    const cardIndex = cards.findIndex((card) => card.id === id);
    if (cardIndex < 0) return;

    const duplicate = { ...cards[cardIndex]!, id: `card-${crypto.randomUUID()}` };
    setCards([...cards.slice(0, cardIndex + 1), duplicate, ...cards.slice(cardIndex + 1)]);
  };

  const handleMoveCard = (id: string, offset: -1 | 1) => {
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
    setCards((currentCards) => currentCards.map((card) =>
      card.id === id ? { ...card, fretPosition: position } : card
    ));
  };

  // Transpose a card. The shape has to move with the name — transposing only the root and
  // notes left the original frets on screen and played the wrong voicing.
  const handleTranspose = (id: string, delta: number) => {
    setCards((currentCards) =>
      currentCards.map((item) => {
        if (item.id !== id) return item;
        const { chord, transposeOffset } = transposeChordShape(
          item.chord,
          delta,
          item.transposeOffset
        );
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

  // Play all active cards in sequence (Progression playback!)
  const handlePlayProgression = () => {
    cards.forEach((card, cardIdx) => {
      if (card.isMuted) return;
      setTimeout(() => {
        handlePlayChord(card);
      }, cardIdx * 1200);
    });
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
            Compare chords side by side! Compare A Chord vs B Minor vs C Major, see note formulas, exactly how each instrument plays it, and hear progression harmony.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Add Chord Controls */}
          <div className="flex gap-2">
            <select
              className="select-input"
              value={selectedRootToAdd}
              title="Root note of the chord you are adding"
              onChange={(e) => setSelectedRootToAdd(e.target.value as NoteName)}
            >
              {ALL_NOTES.map((n: NoteName) => (
                <option key={n} value={n}>
                  Key {n}
                </option>
              ))}
            </select>

            <select
              className="select-input"
              value={selectedTypeToAdd}
              title="Chord quality — major, minor, or a seventh"
              onChange={(e) => setSelectedTypeToAdd(e.target.value)}
            >
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="7th">7th</option>
              <option value="Major 7th">Major 7th</option>
            </select>

            <button
              className="btn btn-accent"
              data-tip={`Add ${selectedRootToAdd} ${selectedTypeToAdd} as another card`}
              onClick={handleAddCard}
            >
              <Icon name="plus" /> Add Card
            </button>
          </div>

          {onOpenTuner && (
            <button
              className="btn btn-outline"
              data-tip="Jump to the microphone tuner"
              onClick={onOpenTuner}
            >
              <Icon name="target" /> Open Tuner
            </button>
          )}

          <button
            className="btn btn-primary"
            data-tip="Strum every card in order so you can hear them as a progression"
            onClick={handlePlayProgression}
          >
            <Icon name="play" /> Play Progression
          </button>
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

      {/* Side by Side Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
        {cards.map((item, index) => {
          const { chord, isMuted } = item;
          return (
            <div
              key={item.id}
              className={`glass-card flex flex-col gap-4 border-t-[3px] border-t-accent ${
                isMuted ? 'opacity-50 grayscale-[0.8]' : ''
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
                    className="cursor-grab touch-none rounded bg-transparent p-1 text-base text-ink-soft hover:text-white active:cursor-grabbing"
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
                    className="rounded bg-transparent p-1 text-base text-ink-soft hover:text-white"
                    type="button"
                    aria-label={`Duplicate ${chord.name}`}
                    data-tip="Duplicate this card"
                    onClick={() => handleDuplicateCard(item.id)}
                  >
                    <Icon name="copy" />
                  </button>
                  <button
                    className="rounded bg-transparent p-1 text-base text-ink-soft hover:text-white"
                    data-tip={isMuted ? 'Unmute — let this card play again' : 'Mute — skip this card during playback'}
                    type="button"
                    onClick={() =>
                      setCards(
                        cards.map((c) => (c.id === item.id ? { ...c, isMuted: !c.isMuted } : c))
                      )
                    }
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
                      className="rounded-xl px-2.5 py-1 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(var(--inset-rgb),0.3)]"
                      style={{ backgroundColor: noteColorFor(note) }}
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
    </div>
  );
};
