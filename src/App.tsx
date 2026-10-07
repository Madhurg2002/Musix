import { useState } from 'react';
import './style.css';
import { NoteName, ChordShape } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import { Header } from './components/Header';
import { GuitarFretboard } from './components/GuitarFretboard';
import { ChordWorkbench } from './components/ChordWorkbench';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ScaleExplorer } from './components/ScaleExplorer';
import { IntervalExplorer } from './components/IntervalExplorer';
import { RhythmMetronome } from './components/RhythmMetronome';
import { TheoryCheatSheet } from './components/TheoryCheatSheet';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('workbench');
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [activeChordForFretboard, setActiveChordForFretboard] = useState<ChordShape | null>(COMPREHENSIVE_CHORDS[0]);
  const [activeScaleNotes, setActiveScaleNotes] = useState<NoteName[]>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);

  const handleSelectChordForFretboard = (chord: ChordShape) => {
    setActiveChordForFretboard(chord);
    setActiveTab('fretboard');
  };

  return (
    <div className="musix-app-root">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content-container">
        {/* Quick Hero Banner */}
        <section className="hero-banner glass-card">
          <div className="hero-text">
            <h2>Learn Music Theory Visually & Interactively</h2>
            <p>
              Compare chords side by side, inspect exact guitar finger press positions, explore piano keys, and listen to real synthesized audio in real time.
            </p>
          </div>
          <div className="hero-quick-keys">
            <span className="quick-label">Active Key:</span>
            <div className="key-badges-row">
              {(['C', 'G', 'D', 'A', 'E', 'F'] as NoteName[]).map((key) => (
                <button
                  key={key}
                  className={`btn-key-chip ${selectedRoot === key ? 'active' : ''}`}
                  onClick={() => setSelectedRoot(key)}
                >
                  Key {key}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Tab 1: Side-by-Side Chord Studio */}
        {activeTab === 'workbench' && (
          <section className="tab-section">
            <ChordWorkbench onSelectChordForFretboard={handleSelectChordForFretboard} />
          </section>
        )}

        {/* Tab 2: Guitar Fretboard Press Visualizer */}
        {activeTab === 'fretboard' && (
          <section className="tab-section">
            {/* Chord Picker Bar for Fretboard */}
            <div className="fretboard-chord-picker glass-card">
              <label>Select Chord to view on Fretboard:</label>
              <div className="chord-picker-buttons">
                {COMPREHENSIVE_CHORDS.map((chord) => (
                  <button
                    key={chord.id}
                    className={`btn-chord-chip ${
                      activeChordForFretboard?.id === chord.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveChordForFretboard(chord)}
                  >
                    {chord.name}
                  </button>
                ))}
              </div>
            </div>

            <GuitarFretboard
              activeChord={activeChordForFretboard}
              activeScaleNotes={activeScaleNotes}
              rootNote={selectedRoot}
            />
          </section>
        )}

        {/* Tab 3: Piano Keyboard */}
        {activeTab === 'piano' && (
          <section className="tab-section">
            <PianoKeyboard
              activeNotes={activeChordForFretboard ? activeChordForFretboard.notes : activeScaleNotes}
              rootNote={selectedRoot}
            />
          </section>
        )}

        {/* Tab 4: Scales & Modes */}
        {activeTab === 'scales' && (
          <section className="tab-section">
            <ScaleExplorer
              selectedRoot={selectedRoot}
              onRootChange={setSelectedRoot}
              onScaleNotesChange={setActiveScaleNotes}
            />
            <div className="dual-visualizers-grid">
              <PianoKeyboard activeNotes={activeScaleNotes} rootNote={selectedRoot} />
              <GuitarFretboard
                activeScaleNotes={activeScaleNotes}
                rootNote={selectedRoot}
              />
            </div>
          </section>
        )}

        {/* Tab 5: Interval Calculator */}
        {activeTab === 'intervals' && (
          <section className="tab-section">
            <IntervalExplorer />
          </section>
        )}

        {/* Tab 6: Rhythm & Metronome */}
        {activeTab === 'rhythm' && (
          <section className="tab-section">
            <RhythmMetronome />
          </section>
        )}

        {/* Tab 7: Beginner Theory Guide */}
        {activeTab === 'guide' && (
          <section className="tab-section">
            <TheoryCheatSheet />
          </section>
        )}
      </main>

      <footer className="musix-footer">
        <p>Musix — Built for music learners. Interactive Guitar & Piano Visualizers.</p>
      </footer>
    </div>
  );
}

export default App;
