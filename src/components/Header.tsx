import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
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
    </header>
  );
};
