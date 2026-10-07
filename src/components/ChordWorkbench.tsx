import React, { useState } from 'react';
import { ChordCardItem, NoteName, ChordShape } from '../types';
import { COMPREHENSIVE_CHORDS, findOrCreateChord } from '../data/chordsData';
import { ALL_NOTES, transposeNote, NOTE_COLORS, getFretMidi, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';

interface ChordWorkbenchProps {
  onSelectChordForFretboard?: (chord: ChordShape) => void;
  onOpenTuner?: () => void;
}

export const ChordWorkbench: React.FC<ChordWorkbenchProps> = ({ onSelectChordForFretboard, onOpenTuner }) => {
  const [cards, setCards] = useState<ChordCardItem[]>([
    { id: 'card-1', chord: COMPREHENSIVE_CHORDS[0], transposeOffset: 0 }, // C Major
    { id: 'card-2', chord: COMPREHENSIVE_CHORDS[4], transposeOffset: 0 }, // A Major
    { id: 'card-3', chord: COMPREHENSIVE_CHORDS[12], transposeOffset: 0 }, // B Minor
  ]);

  const [selectedRootToAdd, setSelectedRootToAdd] = useState<NoteName>('G');
  const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string>('Major');

  // Add new card
  const handleAddCard = () => {
    const newChord = findOrCreateChord(selectedRootToAdd, selectedTypeToAdd);
    const newCard: ChordCardItem = {
      id: `card-${Date.now()}`,
      chord: newChord,
      transposeOffset: 0,
    };
    setCards([...cards, newCard]);
  };

  // Remove card
  const handleRemoveCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id));
  };

  // Transpose a card
  const handleTranspose = (id: string, delta: number) => {
    setCards(
      cards.map((item) => {
        if (item.id !== id) return item;
        const newRoot = transposeNote(item.chord.root, delta);
        const newNotes = item.chord.notes.map((n) => transposeNote(n, delta));
        return {
          ...item,
          transposeOffset: item.transposeOffset + delta,
          chord: {
            ...item.chord,
            root: newRoot,
            name: `${newRoot} ${item.chord.type}`,
            notes: newNotes,
          },
        };
      })
    );
  };

  // Play chord sound
  const handlePlayChord = (card: ChordCardItem) => {
    const freqs: number[] = [];
    card.chord.frets.forEach((fret, sIdx) => {
      if (fret >= 0) {
        const midi = getFretMidi(sIdx, fret);
        freqs.push(midiToFrequency(midi + card.transposeOffset));
      }
    });
    // Fallback if frets empty
    if (freqs.length === 0) {
      card.chord.notes.forEach((n, i) => {
        const idx = ALL_NOTES.indexOf(n);
        freqs.push(midiToFrequency(60 + idx + i * 3));
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
              {ALL_NOTES.map((n) => (
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
            <div key={item.id} className={`chord-card glass-card ${isMuted ? 'muted-card' : ''}`}>
              <div className="card-top-bar">
                <span className="card-index-badge">#{index + 1}</span>
                <span className="difficulty-tag">{chord.difficulty}</span>
                <div className="card-window-controls">
                  <button
                    className="btn-icon"
                    title={isMuted ? 'Unmute' : 'Mute'}
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
                  {chord.notes.map((note, idx) => (
                    <span
                      key={idx}
                      className="note-pill"
                      style={{ backgroundColor: NOTE_COLORS[note] || '#555' }}
                    >
                      {note} <small>({chord.intervals[idx] || ''})</small>
                    </span>
                  ))}
                </div>

                {/* Guitar String Press Box Diagram */}
                <div className="guitar-mini-box">
                  <div className="mini-box-title">Guitar Press Pattern (Low E ➔ High E)</div>
                  <div className="string-press-grid">
                    {chord.frets.map((fret, stringIdx) => {
                      const finger = chord.fingers ? chord.fingers[stringIdx] : undefined;
                      let label = 'O';
                      let cssClass = 'open';
                      if (fret === -1) {
                        label = '✕';
                        cssClass = 'muted';
                      } else if (fret > 0) {
                        label = `${fret} (F:${finger ?? '?'})`;
                        cssClass = 'pressed';
                      }

                      return (
                        <div key={stringIdx} className={`string-press-cell ${cssClass}`}>
                          <span className="str-name">S{6 - stringIdx}</span>
                          <span className="str-press">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                    {onOpenTuner && (
                      <button className="btn btn-outline btn-sm" onClick={onOpenTuner} title="Open Instrument Tuner">
                        🎯 Tuner
                      </button>
                    )}
                    {onSelectChordForFretboard && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => onSelectChordForFretboard(chord)}
                      >
                        🎸 Fretboard
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
