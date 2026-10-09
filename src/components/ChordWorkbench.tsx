import React, { useState } from 'react';
import { ChordCardItem, NoteName, ChordShape } from '../types';
import {
  COMPREHENSIVE_CHORDS,
  findOrCreateChord,
  asSafeChord,
} from '../data/chordsData';
import {
  ALL_NOTES,
  GUITAR_STRINGS,
  transposeNote,
  noteColorFor,
  getFretMidi,
  midiToFrequency,
} from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';

const CardFretboard: React.FC<{ chord: ChordShape; voicingOffset?: number }> = ({
  chord,
  voicingOffset = 0,
}) => {
  const safeChord = asSafeChord(chord);
  const frets = safeChord.frets.map((fret) => fret >= 0 ? fret + voicingOffset : fret);
  const fingers = safeChord.fingers?.map((finger, index) =>
    safeChord.frets[index] === 0 && voicingOffset > 0 ? 1 : finger
  );
  const pressedFrets = frets.filter((fret) => fret > 0);
  const lowestFret = pressedFrets.length > 0 ? Math.min(...pressedFrets) : 1;
  const highestFret = Math.max(0, ...pressedFrets);
  const firstFret = highestFret > 5
    ? highestFret - lowestFret > 4 ? lowestFret : highestFret - 4
    : 1;
  const fretCount = Math.max(5, highestFret - firstFret + 1);
  const fretNumbers = Array.from({ length: fretCount }, (_, index) => firstFret + index);

  return (
    <div className="card-fretboard" role="img" aria-label={`${safeChord.name} guitar fingering, high E to low E`}>
      <div className="card-fretboard-heading">
        <span>{voicingOffset > 0 ? 'Octave higher voicing' : 'Guitar fingering'}</span>
        {firstFret > 1 && <span>Frets {firstFret}-{firstFret + fretCount - 1}</span>}
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
  const [cards, setCards] = useState<ChordCardItem[]>([
    { id: 'card-1', chord: COMPREHENSIVE_CHORDS[0] ?? COMPREHENSIVE_CHORDS[0]!, transposeOffset: 0 }, // C Major
    { id: 'card-2', chord: COMPREHENSIVE_CHORDS[4] ?? COMPREHENSIVE_CHORDS[4]!, transposeOffset: 0 }, // A Major
    { id: 'card-3', chord: COMPREHENSIVE_CHORDS[12] ?? COMPREHENSIVE_CHORDS[12]!, transposeOffset: 0 }, // B Minor
  ]);

  const [selectedRootToAdd, setSelectedRootToAdd] = useState<NoteName>('G');
  const [selectedTypeToAdd, setSelectedTypeToAdd] = useState<string>('Major');
  const [selectedVoicing, setSelectedVoicing] = useState<'standard' | 'octave'>('standard');

  // Add new card
  const handleAddCard = () => {
    const newChord = findOrCreateChord(selectedRootToAdd, selectedTypeToAdd);
    const newCard: ChordCardItem = {
      id: `card-${Date.now()}`,
      chord: newChord,
      transposeOffset: 0,
      voicingOffset: selectedVoicing === 'octave' ? 12 : 0,
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
        const newNotes = item.chord.notes.map((n: NoteName) => transposeNote(n, delta));
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
    const notes = asSafeChord(card.chord).notes;
    const frets = asSafeChord(card.chord).frets;

    frets.forEach((fret: number, sIdx: number) => {
      if (fret >= 0) {
        const midi = getFretMidi(sIdx, fret);
        freqs.push(midiToFrequency(midi + card.transposeOffset + (card.voicingOffset ?? 0)));
      }
    });

    // Fallback if frets empty
    if (freqs.length === 0) {
      notes.forEach((n: NoteName, i: number) => {
        const idx = ALL_NOTES.indexOf(n);
        freqs.push(midiToFrequency(60 + idx + i * 3 + card.transposeOffset + (card.voicingOffset ?? 0)));
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

            <select
              className="select-input"
              aria-label="Guitar voicing"
              value={selectedVoicing}
              onChange={(e) => setSelectedVoicing(e.target.value as 'standard' | 'octave')}
            >
              <option value="standard">Original position</option>
              <option value="octave">Octave higher</option>
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

                <CardFretboard chord={chord} voicingOffset={item.voicingOffset} />

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
