import React from 'react';
import { soundEngine, InstrumentType } from '../utils/audio';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userOverride: InstrumentType | 'auto';
  setUserOverride: (val: InstrumentType | 'auto') => void;
  selectedVisualizer: 'piano' | 'guitar';
  setSelectedVisualizer: (visualizer: 'piano' | 'guitar') => void;
}

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

const INSTRUMENT_LABELS: Record<InstrumentType | 'auto', string> = {
  'auto': '🪄 Auto',
  'acoustic-guitar': '🎸 Acoustic Guitar',
  'electric-guitar': '⚡ Electric Guitar',
  'piano': '🎹 Grand Piano',
  'bass': '🎸 Bass Guitar',
  'ukulele': '🪕 Ukulele',
  'synth': '🎛️ Synth Pad',
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userOverride,
  setUserOverride,
  selectedVisualizer,
  setSelectedVisualizer,
}) => {
  const tabs = [
    { id: 'tuner', label: '🎯 Instrument Tuner' },
    { id: 'fretboard', label: '🎸 Guitar Fretboard' },
    { id: 'workbench', label: '🎴 Side-by-Side Cards' },
    { id: 'piano', label: '🎹 Piano Visualizer' },
    { id: 'scales', label: '🎼 Scales & Modes' },
    { id: 'intervals', label: '📏 Intervals' },
    { id: 'rhythm', label: '⏱️ Rhythm & Metronome' },
    { id: 'guide', label: '📚 Beginner Guide' },
  ];
  const visibleTabs = tabs.filter((tab) =>
    (tab.id !== 'piano' || selectedVisualizer === 'piano') &&
    (tab.id !== 'fretboard' || selectedVisualizer === 'guitar')
  );

  // The currently active instrument (auto resolved or user-picked)
  const effectiveInstrument: InstrumentType =
    userOverride === 'auto'
      ? (TAB_DEFAULT_INSTRUMENT[activeTab] || 'acoustic-guitar')
      : userOverride;

  const handleInstrumentChange = (val: string) => {
    const inst = val as InstrumentType | 'auto';
    setUserOverride(inst);

    if (inst === 'auto') {
      // Revert to tab default immediately
      const defaultInst = TAB_DEFAULT_INSTRUMENT[activeTab] || 'acoustic-guitar';
      soundEngine.setInstrument(defaultInst);
    } else {
      soundEngine.setInstrument(inst);
      // Play a quick preview note to confirm sound
      soundEngine.playNote(261.63, 1.0, inst);
    }
  };

  return (
    <header className="main-header glass-header">
      <div className="header-brand">
        <span className="brand-logo">♫</span>
        <div className="brand-titles">
          <h1>Musix</h1>
          <p className="tagline">Interactive Music Theory Studio</p>
        </div>
      </div>

      <nav className="header-nav">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Sound Engine Selector */}
      <div className="header-sound-selector">
        <span className="sound-label">🔊</span>
        <div className="sound-selector-inner">
          <select
            className="select-input sound-select"
            value={userOverride}
            onChange={(e) => handleInstrumentChange(e.target.value)}
          >
            <option value="auto">🪄 Auto (Follow Page)</option>
            <option value="acoustic-guitar">🎸 Acoustic Guitar</option>
            <option value="electric-guitar">⚡ Electric Guitar</option>
            <option value="piano">🎹 Grand Piano</option>
            <option value="bass">🎸 Bass Guitar</option>
            <option value="ukulele">🪕 Ukulele</option>
            <option value="synth">🎛️ Synth Pad</option>
          </select>
          {/* Live indicator showing what is actually playing right now */}
          <span className="sound-active-chip small">
            {userOverride === 'auto' ? '⚡ Auto: ' : '🔒 Locked: '}
            <strong>{INSTRUMENT_LABELS[effectiveInstrument]}</strong>
          </span>
        </div>
      </div>

      <div className="header-visualizer-control" role="group" aria-label="Choose instrument view">
        <span className="header-visualizer-label">Show</span>
        <div className="header-visualizer-options">
          <button
            type="button"
            aria-pressed={selectedVisualizer === 'piano'}
            className={selectedVisualizer === 'piano' ? 'active' : ''}
            onClick={() => setSelectedVisualizer('piano')}
          >
            Piano
          </button>
          <button
            type="button"
            aria-pressed={selectedVisualizer === 'guitar'}
            className={selectedVisualizer === 'guitar' ? 'active' : ''}
            onClick={() => setSelectedVisualizer('guitar')}
          >
            Guitar
          </button>
        </div>
      </div>
    </header>
  );
};
