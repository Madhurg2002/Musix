import React from 'react';
import { NoteName } from '../types';
import { ALL_NOTES, midiToFrequency, noteColorFor } from '../utils/musicTheory';
import { soundEngine, type InstrumentType } from '../utils/audio';
import { Icon } from './Icon';

interface PianoKeyboardProps {
  activeNotes?: NoteName[];
  rootNote?: NoteName;
  octaves?: number;
  /**
   * `full` draws the header, legend, and card chrome; `compact` renders just the key
   * strip so a chord card can embed the same keyboard.
   */
  variant?: 'full' | 'compact';
  /** Voice a clicked key plays — a synth card should not sound like a grand piano. */
  voice?: InstrumentType;
}

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  activeNotes = [],
  rootNote = 'C',
  octaves = 2,
  variant = 'full',
  voice = 'piano',
}) => {
  // Generate keys array across octaves (starting at C3 / MIDI 48)
  const baseMidi = 48;
  const totalKeys = octaves * 12;

  const handleKeyClick = (midi: number) => {
    soundEngine.playNote(midiToFrequency(midi), 1.2, voice);
  };

  const keyboard = (
    <div
      className="piano-keyboard"
      style={variant === 'compact' ? { height: 104 } : undefined}
    >
      {Array.from({ length: totalKeys }).map((_, i) => {
          const midi = baseMidi + i;
          const noteIndex = i % 12;
          const noteName = ALL_NOTES[noteIndex] ?? 'C';
          const isBlackKey = noteName.includes('♯');
          const isActive = activeNotes.includes(noteName);
          const isRoot = noteName === rootNote;

          let keyClass = isBlackKey ? 'piano-key black-key' : 'piano-key white-key';
          if (isActive) keyClass += ' active-key';
          if (isRoot) keyClass += ' root-key';

          return (
            <div
              key={i}
              className={keyClass}
              data-tip={`${noteName}${Math.floor(midi / 12) - 1} · ${midiToFrequency(midi).toFixed(1)} Hz${isActive ? ' · in the current scale' : ''}`}
              onClick={() => handleKeyClick(midi)}
              style={{ borderColor: isActive ? noteColorFor(noteName) : undefined }}
            >
              <div className="key-badge">
                <span>{noteName}</span>
                {isRoot && <span className="root-tag">ROOT</span>}
              </div>
            </div>
          );
        })}
    </div>
  );

  // A compact card embeds just the key strip — no header, legend, or card chrome.
  if (variant === 'compact') return keyboard;

  return (
    <div className="piano-container glass-card">
      <div className="piano-header">
        <div>
          <h3 className="flex items-center gap-2">
            <Icon name="piano" /> Interactive Piano Visualizer
          </h3>
          <p>Click keys to play. Active notes in current chord/scale light up dynamically.</p>
        </div>
        <div className="piano-legend">
          <span className="legend-item"><span className="dot root-dot" /> Root ({rootNote})</span>
          <span className="legend-item"><span className="dot active-dot" /> Scale / Chord Note</span>
        </div>
      </div>

      {keyboard}
    </div>
  );
};
