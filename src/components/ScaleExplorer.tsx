import React, { useEffect, useState } from 'react';
import { NoteName } from '../types';
import { COMPREHENSIVE_SCALES } from '../data/scalesData';
import { ALL_NOTES, transposeNote, NOTE_COLORS, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { PREFERENCE_KEYS, isOneOf, readPreference, writePreference } from '../utils/preferences';

// Validating against the real scale ids means a saved scale that no longer exists (or a
// hand-edited value) falls back to Major instead of rendering an empty selector.
const SCALE_IDS = COMPREHENSIVE_SCALES.map((scale) => scale.id);
const isScaleId = isOneOf(...SCALE_IDS);

interface ScaleExplorerProps {
  selectedRoot: NoteName;
  onRootChange: (root: NoteName) => void;
  onScaleNotesChange?: (notes: NoteName[]) => void;
}

export const ScaleExplorer: React.FC<ScaleExplorerProps> = ({
  selectedRoot,
  onRootChange,
  onScaleNotesChange,
}) => {
  const [selectedScaleId, setSelectedScaleId] = useState<string>(() =>
    readPreference(PREFERENCE_KEYS.scaleId, SCALE_IDS[0] ?? 'major', isScaleId)
  );

  useEffect(() => writePreference(PREFERENCE_KEYS.scaleId, selectedScaleId), [selectedScaleId]);

  const currentScaleDef = COMPREHENSIVE_SCALES.find((s) => s.id === selectedScaleId) ?? COMPREHENSIVE_SCALES[0]!;

  // Compute exact notes of scale based on root and intervals
  const scaleNotes: NoteName[] = currentScaleDef.intervals.map((semitone) =>
    transposeNote(selectedRoot, semitone)
  );

  // Play scale ascending
  const handlePlayScale = () => {
    const rootIndex = ALL_NOTES.indexOf(selectedRoot);
    const baseMidi = 60 + rootIndex; // C4 range

    currentScaleDef.intervals.forEach((semitone, i) => {
      setTimeout(() => {
        soundEngine.playNote(midiToFrequency(baseMidi + semitone), 0.8, 'acoustic-guitar');
      }, i * 350);
    });

    // Play top octave
    setTimeout(() => {
      soundEngine.playNote(midiToFrequency(baseMidi + 12), 1.2, 'acoustic-guitar');
    }, currentScaleDef.intervals.length * 350);
  };

  // Notify parent component if scale notes change
  React.useEffect(() => {
    if (onScaleNotesChange) {
      onScaleNotesChange(scaleNotes);
    }
  }, [selectedRoot, selectedScaleId]);

  return (
    <div className="scale-explorer-container glass-card">
      <div className="scale-header">
        <div>
          <span className="section-badge">🎼 Scale & Mode Navigator</span>
          <h2>{selectedRoot} {currentScaleDef.name}</h2>
          <p>{currentScaleDef.description}</p>
        </div>

        <button className="btn btn-primary" onClick={handlePlayScale}>
          ▶ Play Scale Ascending
        </button>
      </div>

      {/* Selectors Row */}
      <div className="scale-controls-bar">
        <div className="control-group">
          <label>Select Key Root:</label>
          <div className="root-notes-buttons">
            {ALL_NOTES.map((n) => (
              <button
                key={n}
                className={`btn-note ${n === selectedRoot ? 'selected' : ''}`}
                onClick={() => onRootChange(n)}
                style={{
                  borderColor: n === selectedRoot ? NOTE_COLORS[n] : undefined,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Select Scale / Mode:</label>
          <select
            className="select-input scale-select"
            value={selectedScaleId}
            onChange={(e) => setSelectedScaleId(e.target.value)}
          >
            {COMPREHENSIVE_SCALES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.formula})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formula & Notes Display Grid */}
      <div className="scale-formula-display">
        <div className="formula-box">
          <span className="formula-label">Step Pattern:</span>
          <span className="formula-value">{currentScaleDef.formula}</span>
        </div>

        <div className="notes-breakdown-row">
          {scaleNotes.map((note, idx) => (
            <div key={idx} className="scale-note-card">
              <span className="degree-tag">{currentScaleDef.shortFormula[idx] || `Degree ${idx + 1}`}</span>
              <div
                className="note-circle"
                style={{ backgroundColor: NOTE_COLORS[note] }}
              >
                {note}
              </div>
              <span className="interval-subtext">{currentScaleDef.intervals[idx] ?? 0} semitones</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
