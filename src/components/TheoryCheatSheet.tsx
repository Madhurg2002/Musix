import React from 'react';

export const TheoryCheatSheet: React.FC = () => {
  return (
    <div className="cheat-sheet-container glass-card">
      <div className="cheat-header">
        <span className="section-badge">📚 Beginner Starter Guide</span>
        <h2>Visual Music Theory Basics</h2>
        <p>Everything you need to understand guitar cards, scale formulas, and pitch movement.</p>
      </div>

      <div className="cheat-grid">
        <div className="cheat-card">
          <div className="card-icon">🎸</div>
          <h3>Reading Guitar Cards</h3>
          <ul>
            <li><strong>Strings 6 to 1:</strong> String 6 is the thickest (Low E, bottom). String 1 is the thinnest (High E, top).</li>
            <li><strong>Fret Numbers:</strong> Numbers like <code>1, 2, 3</code> tell you which fret space to press.</li>
            <li><strong>Finger Numbers:</strong> 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky.</li>
            <li><strong>Symbols:</strong> <code>○</code> means play string open. <code>✕</code> means mute the string.</li>
          </ul>
        </div>

        <div className="cheat-card">
          <div className="card-icon">🎹</div>
          <h3>Half Steps & Whole Steps</h3>
          <ul>
            <li><strong>Half Step (Semitone):</strong> Moving 1 key on piano or 1 fret on guitar (e.g. C ➔ C♯, or E ➔ F).</li>
            <li><strong>Whole Step (Tone):</strong> Moving 2 keys on piano or 2 frets on guitar (e.g. C ➔ D, or F ➔ G).</li>
            <li><strong>Sharps (♯):</strong> Raise note by 1 half step.</li>
            <li><strong>Flats (♭):</strong> Lower note by 1 half step.</li>
          </ul>
        </div>

        <div className="cheat-card">
          <div className="card-icon">🎼</div>
          <h3>Building Chords</h3>
          <ul>
            <li><strong>Major Triad:</strong> Root (1) + Major 3rd (4 semitones) + Perfect 5th (7 semitones). Happy sound.</li>
            <li><strong>Minor Triad:</strong> Root (1) + Minor 3rd (3 semitones) + Perfect 5th (7 semitones). Sad/Somber sound.</li>
            <li><strong>Dominant 7th:</strong> Major Triad + Flat 7th. Bluesy, tense sound pointing back to root.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
