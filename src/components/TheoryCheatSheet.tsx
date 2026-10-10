import React from 'react';
import { Icon } from './Icon';

export const TheoryCheatSheet: React.FC = () => {
  return (
    <div className="glass-card">
      <div>
        <span className="section-badge inline-flex items-center gap-1.5">
          <Icon name="book" /> Beginner Starter Guide
        </span>
        <h2>Visual Music Theory Basics</h2>
        <p>Everything you need to understand guitar cards, scale formulas, and pitch movement.</p>
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5">
          <div className="mb-2 text-accent">
            <Icon name="guitar" size={32} />
          </div>
          <h3 className="mb-3 text-[18px]">Reading Guitar Cards</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Strings 6 to 1:</strong> String 6 is the thickest (Low E, bottom). String 1 is the thinnest (High E, top).</li>
            <li><strong>Fret Numbers:</strong> Numbers like <code>1, 2, 3</code> tell you which fret space to press.</li>
            <li><strong>Finger Numbers:</strong> 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky.</li>
            <li><strong>Symbols:</strong> <code>○</code> means play string open. <code>✕</code> means mute the string.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5">
          <div className="mb-2 text-accent">
            <Icon name="piano" size={32} />
          </div>
          <h3 className="mb-3 text-[18px]">Half Steps & Whole Steps</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Half Step (Semitone):</strong> Moving 1 key on piano or 1 fret on guitar (e.g. C ➔ C♯, or E ➔ F).</li>
            <li><strong>Whole Step (Tone):</strong> Moving 2 keys on piano or 2 frets on guitar (e.g. C ➔ D, or F ➔ G).</li>
            <li><strong>Sharps (♯):</strong> Raise note by 1 half step.</li>
            <li><strong>Flats (♭):</strong> Lower note by 1 half step.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5">
          <div className="mb-2 text-accent">
            <Icon name="staff" size={32} />
          </div>
          <h3 className="mb-3 text-[18px]">Building Chords</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Major Triad:</strong> Root (1) + Major 3rd (4 semitones) + Perfect 5th (7 semitones). Happy sound.</li>
            <li><strong>Minor Triad:</strong> Root (1) + Minor 3rd (3 semitones) + Perfect 5th (7 semitones). Sad/Somber sound.</li>
            <li><strong>Dominant 7th:</strong> Major Triad + Flat 7th. Bluesy, tense sound pointing back to root.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
