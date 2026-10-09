import { useState, useEffect } from 'react';
import './style.css';
import { NoteName, ChordShape } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import { Header } from './components/Header';
import { TopBar } from './components/TopBar';
import { GuitarFretboard } from './components/GuitarFretboard';
import { ChordWorkbench } from './components/ChordWorkbench';
import { PianoKeyboard } from './components/PianoKeyboard';
import { ScaleExplorer } from './components/ScaleExplorer';
import { IntervalExplorer } from './components/IntervalExplorer';
import { RhythmMetronome } from './components/RhythmMetronome';
import { TheoryCheatSheet } from './components/TheoryCheatSheet';
import { GuitarTuner } from './components/GuitarTuner';
import { soundEngine, InstrumentType } from './utils/audio';

// Default instrument for each tab — what sounds most natural on that page
const TAB_DEFAULT_INSTRUMENT: Record<string, InstrumentType> = {
  workbench: 'acoustic-guitar',
  tuner: 'acoustic-guitar',
  fretboard: 'acoustic-guitar',
  piano: 'piano',
  scales: 'acoustic-guitar',
  intervals: 'piano',
  rhythm: 'acoustic-guitar',
  guide: 'acoustic-guitar',
};

const VALID_TABS = ['workbench', 'tuner', 'fretboard', 'piano', 'scales', 'intervals', 'rhythm', 'guide'];

function getTabFromHash(): string {
  const hash = window.location.hash.replace('#', '').trim().toLowerCase();
  return VALID_TABS.includes(hash) ? hash : 'workbench';
}

export function App() {
  const [activeTab, setActiveTabState] = useState<string>(() => getTabFromHash());
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [activeChordForFretboard, setActiveChordForFretboard] = useState<ChordShape | null>(COMPREHENSIVE_CHORDS[0] ?? null);
  const [selectedVisualizer, setSelectedVisualizer] = useState<'piano' | 'guitar'>(() =>
    getTabFromHash() === 'fretboard' ? 'guitar' : 'piano'
  );
  const [activeScaleNotes, setActiveScaleNotes] = useState<NoteName[]>(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
  // 'auto' = follow tab defaults; anything else = user explicitly chose an instrument
  const [userOverride, setUserOverride] = useState<InstrumentType | 'auto'>('auto');

  // When tab changes AND user has not locked an instrument manually → auto-select
  useEffect(() => {
    if (userOverride === 'auto') {
      const defaultInst = TAB_DEFAULT_INSTRUMENT[activeTab] || 'acoustic-guitar';
      soundEngine.setInstrument(defaultInst);
    }
  }, [activeTab, userOverride]);

  // Sync state with URL hash and listen for browser back/forward navigation
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  const handleVisualizerChange = (visualizer: 'piano' | 'guitar') => {
    setSelectedVisualizer(visualizer);
    if (visualizer === 'piano' && activeTab === 'fretboard') setActiveTab('piano');
    if (visualizer === 'guitar' && activeTab === 'piano') setActiveTab('fretboard');
  };

  useEffect(() => {
    const handleHashChange = () => {
      const currentTab = getTabFromHash();
      setActiveTabState(currentTab);
      if (currentTab === 'fretboard') setSelectedVisualizer('guitar');
      if (currentTab === 'piano') setSelectedVisualizer('piano');
    };

    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  const handleSelectChordForFretboard = (chord: ChordShape) => {
    setActiveChordForFretboard(chord);
    setSelectedVisualizer('guitar');
    setActiveTab('fretboard');
  };

  return (
    <div className="musix-app-root">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVisualizer={selectedVisualizer}
        setSelectedVisualizer={handleVisualizerChange}
      />

      <div className="musix-main-column">
        <TopBar
          activeTab={activeTab}
          userOverride={userOverride}
          setUserOverride={setUserOverride}
          tabDefaultInstrument={TAB_DEFAULT_INSTRUMENT[activeTab] || 'acoustic-guitar'}
        />

        <main className="main-content-container">
          {/* Screen hero: one idea, one action, one secondary control */}
          <section className="screen-hero">
            <p className="screen-hero__eyebrow">Music theory, made visible</p>
            <h2 className="screen-hero__title">
              Learn it by seeing it and hearing it
            </h2>
            <p className="screen-hero__lede">
              Compare chords side by side, read exact guitar press positions, tune with
              microphone pitch detection, and play every concept back in real time.
            </p>
            <div className="screen-hero__actions">
              <button className="btn btn-primary" onClick={() => setActiveTab('guide')}>
                Start with the basics
              </button>
              <div className="key-selector">
                <span className="key-selector__label">Key</span>
                <div className="key-badges-row">
                  {(['C', 'G', 'D', 'A', 'E', 'F'] as NoteName[]).map((key) => (
                    <button
                      key={key}
                      className={`btn-key-chip ${selectedRoot === key ? 'active' : ''}`}
                      aria-pressed={selectedRoot === key}
                      onClick={() => setSelectedRoot(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Tab 0: Tuner */}
          {activeTab === 'tuner' && (
            <section className="tab-section">
              <GuitarTuner />
            </section>
          )}

          {/* Tab 1: Side-by-Side Chord Studio */}
          {activeTab === 'workbench' && (
            <section className="tab-section">
              <ChordWorkbench
                onSelectChordForFretboard={handleSelectChordForFretboard}
                onOpenTuner={() => setActiveTab('tuner')}
              />
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
                {selectedVisualizer === 'piano' ? (
                  <PianoKeyboard activeNotes={activeScaleNotes} rootNote={selectedRoot} />
                ) : (
                  <GuitarFretboard
                    activeScaleNotes={activeScaleNotes}
                    rootNote={selectedRoot}
                  />
                )}
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
          <p>Musix — a warm studio for learning music theory. Guitar, tuner &amp; piano visualizers.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
