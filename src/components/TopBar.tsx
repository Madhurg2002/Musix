import React from 'react';
import { routeFor } from '../routes';
import { INSTRUMENTS, INSTRUMENT_LABELS } from '../data/instruments';
import { soundEngine, InstrumentType } from '../utils/audio';

interface TopBarProps {
  activeTab: string;
  userOverride: InstrumentType | 'auto';
  setUserOverride: (value: InstrumentType | 'auto') => void;
  /** Instrument the current screen would use in Auto mode. */
  tabDefaultInstrument: InstrumentType;
}

/**
 * The instrument control lives here rather than in the navigation rail so the rail stays a
 * pure table of contents, and the screen title always sits next to the sound it uses.
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

    setUserOverride(next);

    if (next === 'auto') {
      // Hand the choice back to the tools: each one plays its own voice again.
      soundEngine.setInstrument('auto');
      soundEngine.playNote(261.63, 1.0, tabDefaultInstrument);
    } else {
      soundEngine.setInstrument(next);
      // Confirm the choice audibly so the learner knows what they just picked.
      soundEngine.playNote(261.63, 1.0, next);
    }
  };

  return (
    <header className="print:hidden sticky top-0 z-[60] flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-glass px-7 py-3 backdrop-blur-[18px] max-[900px]:static max-[900px]:px-4 max-[900px]:py-2.5">
      <div className="flex flex-col gap-px">
        <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-ink-muted">
          Now viewing
        </span>
        <h2 className="text-[17px] font-bold tracking-[-0.2px] text-ink">
          {routeFor(activeTab).title}
        </h2>
      </div>

      <div className="flex items-center gap-2 rounded-[14px] border border-hairline bg-tint px-3 py-1.5 max-[700px]:w-full max-[700px]:justify-center">
        <span className="text-[13px] font-semibold text-ink-soft" aria-hidden="true">
          ♪
        </span>
        <div className="flex flex-col gap-[3px]">
          <select
            className="select-input cursor-pointer rounded-[10px] bg-field px-2.5 py-1.5 text-[13px] font-semibold text-accent outline-none"
            aria-label="Instrument sound"
            title="Sound every tool plays — Auto follows the screen you are on"
            value={userOverride}
            onChange={(event) => handleInstrumentChange(event.target.value)}
          >
            <option value="auto">Auto — follow page</option>
            {INSTRUMENTS.map((def) => (
              <option key={def.id} value={def.id}>
                {def.label}
              </option>
            ))}
          </select>
          <span className="pl-0.5 text-[10px] text-ink-muted [&_strong]:font-bold [&_strong]:text-success">
            {userOverride === 'auto' ? 'Auto · ' : 'Locked · '}
            <strong>{INSTRUMENT_LABELS[effectiveInstrument]}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
