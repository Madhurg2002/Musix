import React, { useEffect, useState } from 'react';
import { NoteName } from '../types';
import { COMPREHENSIVE_SCALES } from '../data/scalesData';
import { ALL_NOTES, transposeNote, NOTE_COLORS, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { PREFERENCE_KEYS, isOneOf, readPreference, writePreference } from '../utils/preferences';
import { Icon } from './Icon';

// Validating against the real scale ids means a saved scale that no longer exists (or a
// hand-edited value) falls back to Major instead of rendering an empty selector.
const SCALE_IDS = COMPREHENSIVE_SCALES.map((scale) => scale.id);
const isScaleId = isOneOf(...SCALE_IDS);

// The scale dropdown groups the everyday scales before the modes; "Mode" in the name
// (which scalesData uses consistently) is what tells the two apart.
const SCALE_GROUPS: { label: string; isMode: boolean }[] = [
  { label: 'Scales', isMode: false },
  { label: 'Modes', isMode: true },
];

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
    <div className="glass-card flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-badge inline-flex items-center gap-1.5">
            <Icon name="staff" /> Scale & Mode Navigator
          </span>
          <h2>{selectedRoot} {currentScaleDef.name}</h2>
          <p>{currentScaleDef.description}</p>
        </div>

        <button
          className="btn btn-primary"
          data-tip="Play the scale note by note, then land on the octave above"
          onClick={handlePlayScale}
        >
          <Icon name="play" /> Play Scale Ascending
        </button>
      </div>

      {/* Selectors — two standard dropdowns, the same pattern as the theme and instrument pickers */}
      <div className="flex flex-col gap-4 rounded-xl bg-[rgba(var(--inset-rgb),0.3)] p-4 min-[600px]:flex-row min-[600px]:items-end min-[600px]:gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-soft">Key root</span>
          <select
            className="select-input min-[600px]:w-[150px]"
            value={selectedRoot}
            title="Starting note — the same key drives the hero chips, fretboard, and piano"
            onChange={(event) => onRootChange(event.target.value as NoteName)}
          >
            {ALL_NOTES.map((note) => (
              <option key={note} value={note}>
                {note}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1.5">
          <span className="text-[13px] font-bold text-ink-soft">Scale / mode</span>
          <select
            className="select-input w-full"
            value={selectedScaleId}
            title="Choose the scale or mode — everyday scales first, then the seven modes"
            onChange={(event) => setSelectedScaleId(event.target.value)}
          >
            {SCALE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {COMPREHENSIVE_SCALES.filter(
                  (scale) => scale.name.includes('Mode') === group.isMode
                ).map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {/* The scale, degree by degree */}
      <div className="flex flex-wrap gap-4">
        {scaleNotes.map((note, idx) => (
          <div
            key={idx}
            className="flex min-w-[80px] flex-col items-center gap-1.5 rounded-xl bg-[rgba(var(--overlay-rgb),0.04)] px-4 py-3"
          >
            <span className="text-[11px] font-bold text-ink-muted">
              {currentScaleDef.shortFormula[idx] || `Degree ${idx + 1}`}
            </span>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-black shadow-[0_4px_12px_rgba(var(--inset-rgb),0.4)]"
              style={{ backgroundColor: NOTE_COLORS[note] }}
            >
              {note}
            </div>
            <span className="text-[10px] text-ink-soft">
              {currentScaleDef.intervals[idx] ?? 0} semitones
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
