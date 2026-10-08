import React, { useState } from 'react';
import { NoteName, ChordShape } from '../types';
import {
  GUITAR_STRINGS,
  noteNameAt,
  getFretNote,
  getFretMidi,
  midiToFrequency,
  noteColorFor,
  getGuitarStringInfo,
} from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { asSafeChord } from '../data/chordsData';

interface GuitarFretboardProps {
  activeChord?: ChordShape | null;
  activeScaleNotes?: NoteName[];
  rootNote?: NoteName;
  fretsCount?: number;
}

export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  activeChord,
  activeScaleNotes = [],
  rootNote = 'C',
  fretsCount = 12,
}) => {
  const [hoveredNote, setHoveredNote] = useState<{ stringIdx: number; fret: number; note: NoteName } | null>(null);

  // Strum the full chord audio
  const handleStrum = () => {
    if (!activeChord) return;
    const freqs: number[] = [];
    activeChord.frets.forEach((fret, sIdx) => {
      if (fret >= 0) {
        const midi = getFretMidi(sIdx, fret);
        freqs.push(midiToFrequency(midi));
      }
    });
    soundEngine.strumChord(freqs, 0.06, 'acoustic-guitar');
  };

  const handleNoteClick = (stringIdx: number, fret: number) => {
    const midi = getFretMidi(stringIdx, fret);
    soundEngine.playNote(midiToFrequency(midi), 1.2, 'acoustic-guitar');
  };

  const fretsList = Array.from({ length: fretsCount + 1 }, (_, i) => i);
  // Fret marker dots (single dot on 3, 5, 7, 9, 15; double dot on 12)
  const singleMarkers = [3, 5, 7, 9, 15];
  const doubleMarkers = [12];

  return (
    <div className="guitar-visualizer-container glass-card">
      <div className="fretboard-header">
        <div className="fretboard-title-group">
          <span className="badge-icon">🎸</span>
          <div>
            <h3 className="fretboard-heading">
              {activeChord ? `${activeChord.name} — Guitar Finger Position` : `Guitar Fretboard (${rootNote})`}
            </h3>
            <p className="fretboard-subtitle">
              {activeChord
                ? `Strings: Low E (Bottom) to High E (Top). Numbers inside badges indicate Finger (1=Index, 2=Middle, 3=Ring, 4=Pinky, O=Open, X=Mute)`
                : 'Click any fret to play sound. Highlighted notes match selected scale or key.'}
            </p>
          </div>
        </div>

        {activeChord && (
          <button className="btn btn-primary strum-btn" onClick={handleStrum}>
            <span>🔊</span> Strum Chord
          </button>
        )}
      </div>

      {/* String Head Stock / Nut Status (X / O indicators) */}
      {activeChord && (
        <div className="nut-indicators">
          <span className="nut-label">String Press:</span>
          <div className="nut-badges">
            {GUITAR_STRINGS.map((str, idx) => {
              const chordFret = activeChord ? asSafeChord(activeChord).frets[idx] : -1;
              const finger = activeChord ? asSafeChord(activeChord).fingers?.[idx] ?? '?' : '?';
              const fret = chordFret ?? -1;
              let statusText = 'O';
              let statusClass = 'open';
              if (fret === -1) {
                statusText = '✕ Mute';
                statusClass = 'muted';
              } else if (fret === 0) {
                statusText = '○ Open';
                statusClass = 'open';
              } else {
                statusText = `Fret ${fret} (Finger ${finger})`;
                statusClass = 'pressed';
              }
              return (
                <div key={idx} className={`nut-badge ${statusClass}`}>
                  <span className="string-name">{str.name}</span>
                  <span className="press-info">{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Fretboard Graphic */}
      <div className="fretboard-wrapper">
        {/* Fret Markers Row */}
        <div className="fret-numbers-row">
          <div className="nut-spacer">Nut</div>                {fretsList.slice(1).map((f) => (
                    <div key={f} className="fret-number-cell">
                      <span>{f}</span>
                      {singleMarkers.includes(f) && <span className="fret-dot-single" />}
                      {doubleMarkers.includes(f) && <span className="fret-dot-double" />}
                    </div>
                  ))}
        </div>

        {/* 6 Guitar Strings (from High E (String 1) to Low E (String 6)) */}
        <div className="fretboard-neck">
          {[...GUITAR_STRINGS].reverse().map((stringInfo, revIdx) => {
            const actualStringIdx = GUITAR_STRINGS.length - 1 - revIdx;
            const chordFret = activeChord ? asSafeChord(activeChord).frets[actualStringIdx] : -2;
            const finger = activeChord ? asSafeChord(activeChord).fingers?.[actualStringIdx] : undefined;

            if (actualStringIdx === undefined) return null;

            return (
              <div key={actualStringIdx} className="fretboard-string-row">
                <div className="string-head-label">
                  <span className="string-num">{6 - actualStringIdx}</span>
                  <span className="string-note">{stringInfo.name}</span>
                </div>

                {/* String wire line representation */}
                <div
                  className="string-line"
                  style={{ height: `${1.5 + (5 - actualStringIdx) * 0.5}px` }}
                />

                {/* Frets for this string */}
                {fretsList.slice(1).map((fretNum) => {
                  const note = getFretNote(actualStringIdx, fretNum);
                  const isChordPress = chordFret === fretNum;
                  const isScaleNote = activeScaleNotes.includes(note);
                  const isRoot = note === rootNote;

                  let markerClass = '';
                  if (isChordPress) markerClass = 'chord-press-active';
                  else if (isRoot) markerClass = 'root-active';
                  else if (isScaleNote) markerClass = 'scale-active';

                  return (
                    <div
                      key={fretNum}
                      className="fret-cell"
                      onClick={() => handleNoteClick(actualStringIdx, fretNum)}
                      onMouseEnter={() => setHoveredNote({ stringIdx: actualStringIdx, fret: fretNum, note })}
                      onMouseLeave={() => setHoveredNote(null)}
                    >
                      {/* Fret wire vertical bar */}
                      <div className="fret-wire" />

                      {markerClass && (
                        <div
                          className={`note-press-badge ${markerClass}`}
                          style={{
                            backgroundColor: isChordPress
                              ? '#00F0FF'
                              : noteColorFor(note),
                          }}
                        >
                          <span className="badge-note-name">{note}</span>
                          {isChordPress && finger !== undefined && (
                            <span className="badge-finger">F:{finger}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fretboard-footer-info">
        {hoveredNote ? (
          <>
            <span>Note: <strong>{hoveredNote.note}</strong></span>
            <span>String: <strong>{6 - hoveredNote.stringIdx} ({getGuitarStringInfo(hoveredNote.stringIdx).name})</strong></span>
            <span>Fret: <strong>{hoveredNote.fret}</strong></span>
            <span>Frequency: <strong>{midiToFrequency(getFretMidi(hoveredNote.stringIdx, hoveredNote.fret)).toFixed(1)} Hz</strong></span>
          </>
        ) : (
          <span className="placeholder-info">💡 Hover over any string & fret to inspect note pitch, string number, and exact Hz frequency.</span>
        )}
      </div>
    </div>
  );
};
