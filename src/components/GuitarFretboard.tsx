import React, { useState } from 'react';
import { NoteName, ChordShape } from '../types';
import {
  GUITAR_STRINGS,
  getFretNote,
  getFretMidi,
  midiToFrequency,
  noteColorFor,
  stringInfoAt,
} from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { asSafeChord } from '../data/chordsData';
import { Icon } from './Icon';

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

  // Resolve what to draw. App owns the selected chord and keeps passing it for as long as
  // the learner stays on this tab, so the fretboard does not need a second copy of it.
  const displayedChord: ChordShape | null = activeChord ?? null;
  const passedChord: ChordShape | null = displayedChord;

  const fretsList = Array.from({ length: fretsCount + 1 }, (_, i) => i);

  // Strum the full chord audio
  const handleStrum = () => {
    if (!passedChord) return;
    const freqs: number[] = [];
    passedChord.frets.forEach((fret, sIdx) => {
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

  // The nut status and fretboard markers use the chord that is actually shown, so the
  // fretboard never silently follows a workbench chord that the side-by-side cards are
  // hiding.
  const singleMarkers = [3, 5, 7, 9, 15];
  const doubleMarkers = [12];

  return (
    <div className="glass-card flex flex-col gap-5 overflow-x-auto">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon name="guitar" size={28} className="shrink-0" />
          <div>
            <h3 className="text-xl font-bold">
              {activeChord ? `${activeChord.name} — Guitar Finger Position` : `Guitar Fretboard (${rootNote})`}
            </h3>
            <p className="text-[13px] text-ink-soft">
              {activeChord
                ? `Strings: Low E (Bottom) to High E (Top). Numbers inside badges indicate Finger (1=Index, 2=Middle, 3=Ring, 4=Pinky, O=Open, X=Mute)`
                : 'Click any fret to play sound. Highlighted notes match selected scale or key.'}
            </p>
          </div>
        </div>

        {activeChord && (
          <button
            className="btn btn-primary"
            data-tip="Strum every pressed string in this shape"
            onClick={() => handleStrum()}
          >
            <Icon name="volume" /> Strum Chord
          </button>
        )}
      </div>

      {/* String Head Stock / Nut Status (X / O indicators) */}
      {passedChord && (
        <div className="flex flex-wrap items-center gap-3 rounded-[10px] bg-[rgba(var(--inset-rgb),0.3)] px-4 py-2.5">
          <span className="text-[13px] font-bold text-ink-soft">String Press:</span>
          <div className="flex flex-wrap gap-2">
            {GUITAR_STRINGS.map((str, idx) => {
              const chordFret = passedChord ? asSafeChord(passedChord).frets[idx] : -1;
              const finger = displayedChord ? asSafeChord(displayedChord).fingers?.[idx] ?? '?' : '?';
              const fret = chordFret ?? -1;
              let statusText = 'O';
              let statusUtilities = 'bg-[rgba(var(--success-rgb),0.15)] text-success';
              if (fret === -1) {
                statusText = '✕ Mute';
                statusUtilities = 'bg-[rgba(var(--alert-rgb),0.15)] text-alert';
              } else if (fret === 0) {
                statusText = '○ Open';
              } else {
                statusText = `Fret ${fret} (Finger ${finger})`;
                statusUtilities =
                  'border border-accent bg-[rgba(var(--accent-rgb),0.2)] text-accent';
              }
              return (
                <div
                  key={idx}
                  className={`flex gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${statusUtilities}`}
                >
                  <span className="font-extrabold">{str.name}</span>
                  <span className="text-[11px] opacity-85">{statusText}</span>
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
          <div className="nut-spacer">Nut</div>
          {fretsList.slice(1).map((f) => (
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
            const finger = displayedChord ? asSafeChord(displayedChord).fingers?.[actualStringIdx] ?? undefined : undefined;

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
                              ? '#e0a458'
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

      <div className="flex min-h-[42px] items-center gap-6 rounded-lg border border-[rgba(var(--overlay-rgb),0.05)] bg-[rgba(var(--inset-rgb),0.4)] px-4 py-2.5 text-[13px] text-ink-soft">
        {hoveredNote ? (
          <>
            <span>Note: <strong>{hoveredNote.note}</strong></span>
            <span>String: <strong>{6 - hoveredNote.stringIdx} ({stringInfoAt(hoveredNote.stringIdx).name})</strong></span>
            <span>Fret: <strong>{hoveredNote.fret}</strong></span>
            <span>Frequency: <strong>{midiToFrequency(getFretMidi(hoveredNote.stringIdx, hoveredNote.fret)).toFixed(1)} Hz</strong></span>
          </>
        ) : (
          <span className="italic text-ink-muted">
            <Icon name="bulb" /> Hover over any string &amp; fret to inspect note pitch, string
            number, and exact Hz frequency.
          </span>
        )}
      </div>
    </div>
  );
};

