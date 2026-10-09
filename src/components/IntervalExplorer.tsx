import React, { useState } from 'react';
import { NoteName } from '../types';
import { COMPREHENSIVE_INTERVALS } from '../data/scalesData';
import { ALL_NOTES, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { NotePicker } from './NotePicker';
import { Icon } from './Icon';

/** Quality → palette token, replacing the four `.quality-tag.*` rules. */
const QUALITY_COLORS: Record<string, string> = {
  perfect: 'text-success',
  major: 'text-highlight',
  minor: 'text-terracotta',
  tritone: 'text-alert',
};

export const IntervalExplorer: React.FC = () => {
  const [note1, setNote1] = useState<NoteName>('C');
  const [note2, setNote2] = useState<NoteName>('G');

  const idx1 = ALL_NOTES.indexOf(note1);
  const idx2 = ALL_NOTES.indexOf(note2);

  const semitones = (idx2 - idx1 + 12) % 12;
  const intervalInfo = COMPREHENSIVE_INTERVALS.find((i) => i.semitones === semitones);
  const safeIntervalInfo = intervalInfo ?? COMPREHENSIVE_INTERVALS[0]!;

  const playInterval = (mode: 'melodic' | 'harmonic') => {
    const f1 = midiToFrequency(60 + idx1);
    const f2 = midiToFrequency(60 + idx1 + semitones);

    if (mode === 'melodic') {
      soundEngine.playNote(f1, 1.0, 'piano');
      setTimeout(() => soundEngine.playNote(f2, 1.2, 'piano'), 600);
    } else {
      soundEngine.playNote(f1, 1.5, 'piano');
      soundEngine.playNote(f2, 1.5, 'piano');
    }
  };

  return (
    <div className="glass-card flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-badge inline-flex items-center gap-1.5">
            <Icon name="ruler" /> Interval Distance Solver
          </span>
          <h2 className="text-xl font-bold">Ear Training & Interval Calculator</h2>
          <p className="mt-1 text-[0.92rem] text-ink-soft">
            Pick two notes to hear and visualize the exact musical distance between them.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            className="btn btn-outline"
            data-tip="Play the two notes one after the other"
            onClick={() => playInterval('melodic')}
          >
            <Icon name="notes" /> Play Melodic (One by One)
          </button>
          <button
            className="btn btn-primary"
            data-tip="Play both notes at once so the interval rings together"
            onClick={() => playInterval('harmonic')}
          >
            <Icon name="staff" /> Play Harmonic (Together)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 max-[900px]:grid-cols-1">
        <div className="flex flex-col rounded-xl bg-[rgba(var(--overlay-rgb),0.04)] p-3.5">
          <label>First Note (Root):</label>
          <NotePicker
            value={note1}
            onChange={setNote1}
            variant="fill"
            containerClassName="mt-3 grid grid-cols-4 gap-1.5"
            tipFor={(note) => `Use ${note} as the starting note`}
            ariaLabel="First note"
          />
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-accent bg-[rgba(var(--accent-rgb),0.05)] p-6 text-center">
          <div className="mb-3 rounded-xl bg-accent px-3 py-1 text-sm font-extrabold text-black">
            {semitones} Semitones
          </div>
          <h3 className="text-xl font-bold">
            {safeIntervalInfo.name} ({safeIntervalInfo.short})
          </h3>
          <span
            className={`my-1.5 text-[11px] font-bold uppercase ${QUALITY_COLORS[safeIntervalInfo.quality] ?? ''}`}
          >
            {safeIntervalInfo.quality}
          </span>
          <p className="mt-2 text-[0.88rem] text-ink-soft">{safeIntervalInfo.description}</p>
        </div>

        <div className="flex flex-col rounded-xl bg-[rgba(var(--overlay-rgb),0.04)] p-3.5">
          <label>Second Note (Target):</label>
          <NotePicker
            value={note2}
            onChange={setNote2}
            variant="fill"
            containerClassName="mt-3 grid grid-cols-4 gap-1.5"
            tipFor={(note) => `Use ${note} as the target note`}
            ariaLabel="Second note"
          />
        </div>
      </div>
    </div>
  );
};
