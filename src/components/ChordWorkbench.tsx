import React, { useState } from 'react';
import { ChordCardItem, NoteName, ChordShape } from '../types';
import { findOrCreateChord, asSafeChord } from '../data/chordsData';
import {
  ALL_NOTES,
  GUITAR_STRINGS,
  noteColorFor,
  getFretMidi,
  midiToFrequency,
} from '../utils/musicTheory';
import {
  fretWindow,
  getChordPosition,
  transposeChordShape,
} from '../utils/chordVoicing';
import { soundEngine } from '../utils/audio';

const CardFretboard: React.FC<{
  chord: ChordShape;
  cardId: string;
  position: number;
  onPositionChange: (position: number) => void;
}> = ({ chord, cardId, position, onPositionChange }) => {
  const safeChord = asSafeChord(chord);
  const { frets, fingers } = getChordPosition(chord, position);
  const { firstFret, fretCount, fretNumbers } = fretWindow(frets);

  return (
    <div className="card-fretboard">
      <div className="card-fretboard-heading">
        <span>Guitar fingering</span>
        {firstFret > 1 && <span>Frets {firstFret}-{firstFret + fretCount - 1}</span>}
      </div>
      <div className="card-fret-position-control">
        <label htmlFor={`fret-position-${cardId}`}>
          <span>Fret position</span>
          <output>{position === 0 ? 'Original' : `Fret ${position}`}</output>
        </label>
        <input
          id={`fret-position-${cardId}`}
          type="range"
          min={0}
          max={20}
          step={1}
          value={position}
          aria-label={`${safeChord.name} fret position`}
          onChange={(event) => onPositionChange(Number(event.currentTarget.value))}
        />
        <div className="card-fret-position-endpoints" aria-hidden="true">
          <span>Original</span>
          <span>Fret 20</span>
        </div>
      </div>
      <div
        className="card-fretboard-numbers"
        aria-hidden="true"
        style={{ gridTemplateColumns: `24px repeat(${fretCount}, minmax(0, 1fr))` }}
      >
        <span />
        {fretNumbers.map((fret) => <span key={fret}>{fret}</span>)}
      </div>
      <div className="card-fretboard-strings">
        {GUITAR_STRINGS.slice().reverse().map((stringInfo, displayIndex) => {
          const stringIndex = safeChord.frets.length - displayIndex - 1;
          const fret = frets[stringIndex] ?? -1;
          const finger = fingers?.[stringIndex];

          return (
            <div
              className="card-fretboard-string-row"
              key={`${stringInfo.name}-${displayIndex}`}
              style={{ gridTemplateColumns: `24px repeat(${fretCount}, minmax(0, 1fr))` }}
            >
              <span className="card-string-name">
                {stringInfo.name}
                <small>{fret === -1 ? '×' : fret === 0 ? '○' : ''}</small>
              </span>
              {fretNumbers.map((fretNumber) => (
                <span className="card-fret-cell" key={fretNumber}>
                  {fret === fretNumber && (
                    <span className="card-fret-marker">{finger && finger !== 0 ? finger : ''}</span>
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

interface ChordWorkbenchProps {
  onSelectChordForFretboard?: (chord: ChordShape) => void;
  onOpenTuner?: () => void;
}

export const ChordWorkbench: React.FC<ChordWorkbenchProps> = ({ onSelectChordForFretboard, onOpenTuner }) => {
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
  };

  // Remove card
  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
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

  // Play chord sound
  const handlePlayChord = (card: ChordCardItem) => {
    const freqs: number[] = [];
    const notes = asSafeChord(card.chord).notes;
    const { frets } = getChordPosition(card.chord, card.fretPosition ?? 0);

    frets.forEach((fret: number, sIdx: number) => {
      if (fret >= 0) {
        const midi = getFretMidi(sIdx, fret);
        freqs.push(midiToFrequency(midi + card.transposeOffset));
      }
    });

    // Fallback if frets empty
    if (freqs.length === 0) {
      notes.forEach((n: NoteName, i: number) => {
        const idx = ALL_NOTES.indexOf(n);
        freqs.push(midiToFrequency(60 + idx + i * 3 + card.transposeOffset));
      });
    }
    soundEngine.strumChord(freqs, 0.07, 'acoustic-guitar');
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
    <div className="chord-workbench-section">
      <div className="workbench-header glass-card">
        <div className="header-left">
          <span className="section-badge">🎴 Side-by-Side Studio</span>
          <h2>Chord Comparison Cards</h2>
          <p>
            Compare chords side by side! Compare A Chord vs B Minor vs C Major, see note formulas, guitar string presses, and hear progression harmony.
          </p>
        </div>

        <div className="workbench-actions">
          {/* Add Chord Controls */}
          <div className="add-chord-box">
            <select
              className="select-input"
              value={selectedRootToAdd}
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
              onChange={(e) => setSelectedTypeToAdd(e.target.value)}
            >
              <option value="Major">Major</option>
              <option value="Minor">Minor</option>
              <option value="7th">7th</option>
              <option value="Major 7th">Major 7th</option>
            </select>

            <button className="btn btn-accent" onClick={handleAddCard}>
              + Add Card
            </button>
          </div>

          {onOpenTuner && (
            <button className="btn btn-outline" onClick={onOpenTuner}>
              🎯 Open Tuner
            </button>
          )}

          <button className="btn btn-primary" onClick={handlePlayProgression}>
            ▶ Play Progression
          </button>
        </div>
      </div>

      {/* Side by Side Grid */}
      <div className="cards-grid">
        {cards.map((item, index) => {
          const { chord, isMuted } = item;
          return (
            <div
              key={item.id}
              className={`chord-card glass-card ${isMuted ? 'muted-card' : ''} ${draggedCardId === item.id ? 'dragging' : ''} ${dropTargetCardId === item.id ? 'drag-over' : ''}`}
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
              <div className="card-top-bar">
                <span className="card-index-badge">#{index + 1}</span>
                <span className="difficulty-tag">{chord.difficulty}</span>
                <div className="card-window-controls">
                  <button
                    className="btn-icon card-drag-handle"
                    type="button"
                    draggable
                    aria-label={`Drag to reorder ${chord.name}`}
                    aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                    title="Drag to reorder; Alt+Up/Down also works"
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
                    ⠿
                  </button>
                  <button
                    className="btn-icon"
                    type="button"
                    aria-label={`Duplicate ${chord.name}`}
                    title="Duplicate chord card"
                    onClick={() => handleDuplicateCard(item.id)}
                  >
                    ⧉
                  </button>
                  <button
                    className="btn-icon"
                    title={isMuted ? 'Unmute' : 'Mute'}
                    type="button"
                    onClick={() =>
                      setCards(
                        cards.map((c) => (c.id === item.id ? { ...c, isMuted: !c.isMuted } : c))
                      )
                    }
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <button
                    className="btn-icon close-btn"
                    type="button"
                    aria-label={`Remove ${chord.name}`}
                    title="Remove Card"
                    onClick={() => handleRemoveCard(item.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="chord-card-body">
                <h3 className="chord-title">{chord.name}</h3>

                {/* Notes Pill Badges */}
                <div className="chord-notes-row">
                  <span className="notes-label">Notes:</span>
                  {asSafeChord(chord).notes.map((note: NoteName, idx: number) => (
                    <span
                      key={idx}
                      className="note-pill"
                      style={{ backgroundColor: noteColorFor(note) }}
                    >
                      {note} <small>({asSafeChord(chord).intervals[idx] ?? ''})</small>
                    </span>
                  ))}
                </div>

                <CardFretboard
                  chord={chord}
                  cardId={item.id}
                  position={item.fretPosition ?? 0}
                  onPositionChange={(position) => handleCardPositionChange(item.id, position)}
                />

                {/* Transpose & Action Footer */}
                <div className="chord-card-actions">
                  <div className="transpose-group">
                    <span className="trans-label">Transpose:</span>
                    <button
                      className="btn-nano"
                      onClick={() => handleTranspose(item.id, -1)}
                      title="Key -1 Semitone"
                    >
                      -1
                    </button>
                    <button
                      className="btn-nano"
                      onClick={() => handleTranspose(item.id, 1)}
                      title="Key +1 Semitone"
                    >
                      +1
                    </button>
                  </div>

                  <div className="card-play-btns">
                    {onSelectChordForFretboard && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectChordForFretboard(chord)}
                        title={`Open ${chord.name} on the full fretboard`}
                      >
                        🎸 Open Fretboard
                      </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={() => handlePlayChord(item)}>
                      ▶ Play Audio
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
