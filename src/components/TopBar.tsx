import React from 'react';
import { soundEngine, InstrumentType } from '../utils/audio';

interface TopBarProps {
  activeTab: string;
  userOverride: InstrumentType | 'auto';
  setUserOverride: (value: InstrumentType | 'auto') => void;
  /** Instrument the current page would use in Auto mode. */
  tabDefaultInstrument: InstrumentType;
}

const TAB_TITLES: Record<string, string> = {
  workbench: 'Chord Studio',
  tuner: 'Instrument Tuner',
  fretboard: 'Guitar Fretboard',
  piano: 'Piano Visualizer',
  scales: 'Scales & Modes',
  intervals: 'Interval Explorer',
  rhythm: 'Rhythm & Metronome',
  guide: 'Beginner Guide',
};

const INSTRUMENT_LABELS: Record<InstrumentType | 'auto', string> = {
  'auto': 'Follow page',
  'acoustic-guitar': 'Acoustic guitar',
  'electric-guitar': 'Electric guitar',
  'piano': 'Grand piano',
  'bass': 'Bass guitar',
  'ukulele': 'Ukulele',
  'synth': 'Synth pad',
};

/**
 * The instrument control lives here rather than in the navigation rail so the rail stays a
 * pure table of contents, and the page title always sits next to the sound that page uses.
 */
export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  userOverride,
  setUserOverride,
  tabDefaultInstrument,
}) => {
  const effectiveInstrument: InstrumentType =
    userOverride === 'auto' ? tabDefaultInstrument : userOverride;

  const handleInstrumentChange = (value: string) => {
    const next = value as InstrumentType | 'auto';
    const resolved: InstrumentType = next === 'auto' ? tabDefaultInstrument : next;

    setUserOverride(next);
    soundEngine.setInstrument(resolved);
    // Confirm the choice audibly so the learner knows what they just picked.
    soundEngine.playNote(261.63, 1.0, resolved);
  };

  return (
    <header className="topbar">
      <div className="topbar__heading">
        <span className="topbar__eyebrow">Now viewing</span>
        <h2 className="topbar__title">{TAB_TITLES[activeTab] ?? 'Musix'}</h2>
      </div>

      <div className="header-sound-selector">
        <span className="sound-label" aria-hidden="true">
          ♪
        </span>
        <div className="sound-selector-inner">
          <select
            className="select-input sound-select"
            aria-label="Instrument sound"
            value={userOverride}
            onChange={(event) => handleInstrumentChange(event.target.value)}
          >
            <option value="auto">Auto — follow page</option>
            <option value="acoustic-guitar">Acoustic guitar</option>
            <option value="electric-guitar">Electric guitar</option>
            <option value="piano">Grand piano</option>
            <option value="bass">Bass guitar</option>
            <option value="ukulele">Ukulele</option>
            <option value="synth">Synth pad</option>
          </select>
          <span className="sound-active-chip small">
            {userOverride === 'auto' ? 'Auto · ' : 'Locked · '}
            <strong>{INSTRUMENT_LABELS[effectiveInstrument]}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
