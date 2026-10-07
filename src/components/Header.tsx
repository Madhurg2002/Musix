import React, { useState } from 'react';
import { soundEngine, InstrumentType } from '../utils/audio';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [selectedInst, setSelectedInst] = useState<InstrumentType | 'auto'>('auto');

  const tabs = [
    { id: 'tuner', label: '🎯 Instrument Tuner', icon: '🎯' },
    { id: 'fretboard', label: '🎸 Guitar Fretboard', icon: '🎸' },
    { id: 'workbench', label: '🎴 Side-by-Side Cards', icon: '🎴' },
    { id: 'piano', label: '🎹 Piano Visualizer', icon: '🎹' },
    { id: 'scales', label: '🎼 Scales & Modes', icon: '🎼' },
    { id: 'intervals', label: '📏 Intervals', icon: '📏' },
    { id: 'rhythm', label: '⏱️ Rhythm & Metronome', icon: '⏱️' },
    { id: 'guide', label: '📚 Beginner Guide', icon: '📚' },
  ];

  const handleInstrumentChange = (inst: InstrumentType | 'auto') => {
    setSelectedInst(inst);
    soundEngine.setInstrument(inst);
    // Play test note to demonstrate sound
    if (inst !== 'auto') {
      soundEngine.playNote(261.63, 1.2, inst);
    }
  };

  return (
    <header className="main-header glass-header">
      <div className="header-brand">
        <span className="brand-logo">♫</span>
        <div className="brand-titles">
          <h1>Musix</h1>
          <p className="tagline">Interactive Visual Music Theory Studio</p>
        </div>
      </div>

      <nav className="header-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="header-sound-selector">
        <span className="sound-label">🔊 Sound Engine:</span>
        <select
          className="select-input sound-select"
          value={selectedInst}
          onChange={(e) => handleInstrumentChange(e.target.value as InstrumentType | 'auto')}
        >
          <option value="auto">🪄 Auto (Match Active View)</option>
          <option value="acoustic-guitar">🎸 Acoustic Guitar</option>
          <option value="electric-guitar">⚡ Electric Guitar</option>
          <option value="piano">🎹 Grand Piano</option>
          <option value="bass">🎸 Bass Guitar</option>
          <option value="ukulele">🪕 Ukulele</option>
          <option value="synth">🎛️ Synth Pad</option>
        </select>
      </div>
    </header>
  );
};
