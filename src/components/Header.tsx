import React, { useState } from 'react';
import { ROUTES, type NavGroupLabel } from '../routes';
import { THEMES, applyTheme, readTheme, type ThemeId } from '../utils/theme';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedVisualizer: 'piano' | 'guitar';
  setSelectedVisualizer: (visualizer: 'piano' | 'guitar') => void;
}

const GROUP_ORDER: NavGroupLabel[] = ['Practice', 'Fretboard', 'Harmony', 'Learn', 'Project'];

const GROUP_LABELS: Record<NavGroupLabel, string> = {
  Practice: 'Practice',
  Fretboard: 'Fretboard',
  Harmony: 'Harmony',
  Learn: 'Learn',
  Project: 'Project',
};

/**
 * The rail is built from the route table, grouped by what a learner is trying to do rather
 * than dumped into one flat row, so it reads as a study plan instead of a toolbar.
 */
export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedVisualizer,
  setSelectedVisualizer,
}) => {
  const [theme, setTheme] = useState<ThemeId>(() => readTheme());

  // Piano and Fretboard are two views of the same idea, so only the selected one is listed.
  const visibleRoutes = ROUTES.filter(
    (route) => !route.visibleFor || route.visibleFor === selectedVisualizer
  );

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
        {GROUP_ORDER.map((group) => {
          const items = visibleRoutes.filter((route) => route.group === group);
          if (items.length === 0) return null;

          return (
            <div className="nav-group" key={group}>
              <span className="nav-group__label">{GROUP_LABELS[group]}</span>
              {items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`rail-item ${isActive ? 'active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    data-tip={`${item.label} — ${item.hint}`}
                    data-tip-pos="right"
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
            title="Studio theme — repaints every screen at once"
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
              data-tip="Light up notes on the piano — swaps the Fretboard tab for Piano"
              onClick={() => setSelectedVisualizer('piano')}
            >
              Piano
            </button>
            <button
              type="button"
              aria-pressed={selectedVisualizer === 'guitar'}
              className={selectedVisualizer === 'guitar' ? 'active' : ''}
              data-tip="Light up notes on the guitar neck — swaps the Piano tab for Fretboard"
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
