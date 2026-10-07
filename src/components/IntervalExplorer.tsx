import React, { useState } from 'react';
import { NoteName } from '../types';
import { COMPREHENSIVE_INTERVALS } from '../data/scalesData';
import { ALL_NOTES, NOTE_COLORS, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';

export const IntervalExplorer: React.FC = () => {
  const [note1, setNote1] = useState<NoteName>('C');
  const [note2, setNote2] = useState<NoteName>('G');

  const idx1 = ALL_NOTES.indexOf(note1);
  const idx2 = ALL_NOTES.indexOf(note2);

  const semitones = (idx2 - idx1 + 12) % 12;
  const intervalInfo = COMPREHENSIVE_INTERVALS.find((i) => i.semitones === semitones) || COMPREHENSIVE_INTERVALS[0];

  const playInterval = (mode: 'melodic' | 'harmonic') => {
    const f1 = midiToFrequency(60 + idx1);
    const f2 = midiToFrequency(60 + idx1 + semitones);

    if (mode === 'melodic') {
      soundEngine.playNote(f1, 1.0, 'piano');
      setTimeout(() => soundEngine.playNote(f2, 1.2, 'piano'), 600);
    } else {
      soundEngine.playNote(f1, 1.5, 'piano');
      soundEngine.playNote(f2, 1.5, 'piano');
    }
  };

  return (
    <div className="interval-explorer-container glass-card">
      <div className="interval-header">
        <div>
          <span className="section-badge">📏 Interval Distance Solver</span>
          <h2>Ear Training & Interval Calculator</h2>
          <p>Pick two notes to hear and visualize the exact musical distance between them.</p>
        </div>

        <div className="interval-actions">
          <button className="btn btn-outline" onClick={() => playInterval('melodic')}>
            🎵 Play Melodic (One by One)
          </button>
          <button className="btn btn-primary" onClick={() => playInterval('harmonic')}>
            🎶 Play Harmonic (Together)
          </button>
        </div>
      </div>

      <div className="interval-pickers">
        <div className="note-picker-card">
          <label>First Note (Root):</label>
          <div className="note-buttons-grid">
            {ALL_NOTES.map((n) => (
              <button
                key={n}
                className={`btn-note ${n === note1 ? 'selected' : ''}`}
                onClick={() => setNote1(n)}
                style={{ backgroundColor: n === note1 ? NOTE_COLORS[n] : undefined }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="interval-result-card">
          <div className="distance-badge">{semitones} Semitones</div>
          <h3 className="interval-title">{intervalInfo.name} ({intervalInfo.short})</h3>
          <span className={`quality-tag ${intervalInfo.quality}`}>{intervalInfo.quality}</span>
          <p className="interval-desc">{intervalInfo.description}</p>
        </div>

        <div className="note-picker-card">
          <label>Second Note (Target):</label>
          <div className="note-buttons-grid">
            {ALL_NOTES.map((n) => (
              <button
                key={n}
                className={`btn-note ${n === note2 ? 'selected' : ''}`}
                onClick={() => setNote2(n)}
                style={{ backgroundColor: n === note2 ? NOTE_COLORS[n] : undefined }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
