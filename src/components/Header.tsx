import React, { useState } from 'react';
import { THEMES, applyTheme, readTheme, type ThemeId } from '../utils/theme';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedVisualizer: 'piano' | 'guitar';
  setSelectedVisualizer: (visualizer: 'piano' | 'guitar') => void;
}

interface NavItem {
  id: string;
  label: string;
  hint: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The tool list is grouped by what a learner is trying to do rather than dumped into one
 * flat row, so the rail reads as a study plan instead of a toolbar.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Practice',
    items: [
      { id: 'tuner', label: 'Tuner', hint: 'Mic pitch detection' },
      { id: 'rhythm', label: 'Rhythm', hint: 'Metronome & tempo' },
    ],
  },
  {
    label: 'Fretboard',
    items: [
      { id: 'fretboard', label: 'Fretboard', hint: 'Press positions' },
      { id: 'scales', label: 'Scales', hint: 'Modes & formulas' },
      { id: 'intervals', label: 'Intervals', hint: 'Distance & ear training' },
    ],
  },
  {
    label: 'Harmony',
    items: [
      { id: 'workbench', label: 'Chord Studio', hint: 'Compare side by side' },
      { id: 'piano', label: 'Piano', hint: 'Keyboard visualizer' },
    ],
  },
  {
    label: 'Learn',
    items: [{ id: 'guide', label: 'Guide', hint: 'Start here' }],
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedVisualizer,
  setSelectedVisualizer,
}) => {
  // Piano and Fretboard are two views of the same idea, so only the selected one is listed.
  const isVisible = (id: string) =>
    (id !== 'piano' || selectedVisualizer === 'piano') &&
    (id !== 'fretboard' || selectedVisualizer === 'guitar');

  const [theme, setTheme] = useState<ThemeId>(() => readTheme());

  const handleThemeChange = (value: string) => {
    const next = value as ThemeId;
    setTheme(next);
    applyTheme(next);
  };

  return (
    <nav className="nav-rail" aria-label="Musix sections">
      <div className="nav-rail__brand header-brand">
        <span className="brand-logo" aria-hidden="true">
          ♫
        </span>
        <div className="brand-titles">
          <h1>Musix</h1>
          <p className="tagline">Analog studio for theory</p>
        </div>
      </div>

      <div className="nav-rail__groups">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => isVisible(item.id));
          if (items.length === 0) return null;

          return (
            <div className="nav-group" key={group.label}>
              <span className="nav-group__label">{group.label}</span>
              {items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`rail-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="rail-item__label">{item.label}</span>
                    <span className="rail-item__hint">{item.hint}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="nav-rail__footer">
        <label className="rail-field">
          <span className="rail-field__label">Theme</span>
          <select
            className="select-input rail-theme-select"
            value={theme}
            onChange={(event) => handleThemeChange(event.target.value)}
          >
            {THEMES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="header-visualizer-control" role="group" aria-label="Choose visualizer">
          <span className="header-visualizer-label">Visualizer</span>
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
      </div>
    </nav>
  );
};
