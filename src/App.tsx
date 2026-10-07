import './style.css';
import { useState } from 'react';

const SECTIONS = [
  {
    id: 'learn',
    label: 'Learn',
    href: '#learn',
    heading: 'Music Theory, Compressed',
    description:
      'Every concept is one tap away. Pick a note, a chord, or a rhythm and the app shows the exact pitches, fingerings, and beats you need before your hands do the work.',
  },
  {
    id: 'pitch',
    label: 'Pitch & Frequencies',
    href: '#pitch',
    heading: 'Pitch & Frequencies',
    description: 'The visible, audible foundation of music. Scan the chromatic staff and hear how every semitone moves.',
  },
  {
    id: 'intervals',
    label: 'Intervals',
    href: '#intervals',
    heading: 'Intervals',
    description: 'See every interval between two notes, from unison to the tritone, with its semitone distance and quality.',
  },
  {
    id: 'scales',
    label: 'Scales & Modes',
    href: '#scales',
    heading: 'Scales & Modes',
    description: 'Change the root or the mode and watch the whole formula rebuild the scale on screen.',
  },
  {
    id: 'chords',
    label: 'Chords',
    href: '#chords',
    heading: 'Chords & Comparison Cards',
    description: 'Put two or three chords side by side, mute one, and feel how each one moves. The chord builder names every note in the stack.',
  },
  {
    id: 'guitar',
    label: 'Guitar Fretboard',
    href: '#guitar',
    heading: 'Guitar Fretboard Press Visualizer',
    description: 'Pick a shape and see exactly which strings and frets to press. Press the fretboard to hear the notes.',
  },
  {
    id: 'rhythm',
    label: 'Rhythm',
    href: '#rhythm',
    heading: 'Rhythm & Metronome',
    description: 'Tap a beat, set the tempo, and follow the visual beat clock. Audio triggers on click so every stroke counts.',
  },
];

const PITCH = [
  { name: 'C', freq: 261.63 },
  { name: 'C♯/D♭', freq: 277.18 },
  { name: 'D', freq: 293.66 },
  { name: 'D♯/E♭', freq: 311.13 },
  { name: 'E', freq: 329.63 },
  { name: 'F', freq: 349.23 },
  { name: 'F♯/G♭', freq: 369.99 },
  { name: 'G', freq: 392.00 },
  { name: 'G♯/A♭', freq: 415.30 },
  { name: 'A', freq: 440.00 },
  { name: 'A♯/B♭', freq: 466.16 },
  { name: 'B', freq: 493.88 },
];

const INTERVALS = [
  { semitones: 0, name: 'Perfect Unison', short: 'P1', kind: 'perfect' },
  { semitones: 1, name: 'Minor 2nd', short: 'm2', kind: 'minor' },
  { semitones: 2, name: 'Major 2nd', short: 'M2', kind: 'major' },
  { semitones: 3, name: 'Minor 3rd', short: 'm3', kind: 'minor' },
  { semitones: 4, name: 'Major 3rd', short: 'M3', kind: 'major' },
  { semitones: 5, name: 'Perfect 4th', short: 'P4', kind: 'perfect' },
  { semitones: 6, name: 'Tritone / Dim 5', short: 'TT / d5', kind: 'tritone' },
  { semitones: 7, name: 'Perfect 5th', short: 'P5', kind: 'perfect' },
  { semitones: 8, name: 'Minor 6th', short: 'm6', kind: 'minor' },
  { semitones: 9, name: 'Major 6th', short: 'M6', kind: 'major' },
  { semitones: 10, name: 'Minor 7th', short: 'm7', kind: 'minor' },
  { semitones: 11, name: 'Major 7th', short: 'M7', kind: 'major' },
  { semitones: 12, name: 'Perfect Octave', short: 'P8', kind: 'perfect' },
];

const SCALES = [
  { name: 'Major (Ionian)', formula: 'W-W-H-W-W-W-H', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor (Aeolian)', formula: 'W-H-W-W-H-W-W', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Dorian', formula: 'W-H-W-W-W-H-W', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', formula: 'H-W-W-W-H-W-W', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', formula: 'W-W-W-H-W-W-H', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', formula: 'W-W-H-W-W-H-W', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Minor Pentatonic', formula: '1-b3-4-5-b7', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', formula: '1-b3-4-b5-5-b7', intervals: [0, 3, 5, 6, 7, 10] },
];

const NOTES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTES_WITH_ACCIDENTALS: Record<number, string> = {
  1: 'C♯/D♭',
  3: 'D♯/E♭',
  6: 'F♯/G♭',
  8: 'G♯/A♭',
  10: 'A♯/B♭',
};

function noteLabel(index: number): string {
  if (index in NOTES_WITH_ACCIDENTALS) return NOTES_WITH_ACCIDENTALS[index] as string;
  const note = NOTES[index % 12];
  if (index >= 12) return `${note}${Math.floor(index / 12)}`;
  return note;
}

function formatFormula(intervals: number[]) {
  const names = intervals.map((interval) => {
    const base = interval % 12;
    if (base === 0) return 'P';
    if (base === 1) return 'm2';
    if (base === 2) return 'M2';
    if (base === 3) return 'm3';
    if (base === 4) return 'M3';
    if (base === 5) return 'P4';
    if (base === 6) return 'TT';
    if (base === 7) return 'P5';
    if (base === 8) return 'm6';
    if (base === 9) return 'M6';
    if (base === 10) return 'm7';
    if (base === 11) return 'M7';
    return base;
  });
  return names.join(' ’ ');
}

type Chord = {
  name: string;
  notes: string[];
  fingerings: string[];
  url: string;
};

type ScaleCompare = {
  label: string;
  formula: string;
  noteClass: string;
  intervals: number[];
};

type Fretcard = {
  name: string;
  url: string;
  strings: string[];
  pressLabel: string;
  key?: string;
  shapes?: string[];
};

function App() {
  const [root, setRoot] = useState('C');
  const [scale, setScale] = useState('major');
  const [chord1, setChord1] = useState<Chord | null>({
    name: 'C Major',
    notes: ['C', 'E', 'G'],
    fingerings: ['3-2-0-0-1-0', '3-2-0-0-0-3'],
    url: '#',
  });
  const [chord2, setChord2] = useState<Chord | null>({
    name: 'G7',
    notes: ['G', 'B', 'D', 'F'],
    fingerings: ['3-2-1-0-0-0', '0-0-0-0-3-2'],
    url: '#',
  });
  const [chord3, setChord3] = useState<Chord | null>({
    name: 'C/G Bass',
    notes: ['G', 'C', 'E'],
    fingerings: ['3-2-0-0-1-0'],
    url: '#',
  });
  const [selectedScale, setSelectedScale] = useState<ScaleCompare | null>(SCALES[0]);
  const [chordCard, setChordCard] = useState<'all' | 1 | 2 | 3>('all');
  const [pitchIndex, setPitchIndex] = useState(24);
  const [fretCard, setFretCard] = useState<Fretcard | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">♪</span>
          <div className="brand-text">
            <h1>Musix</h1>
            <p>Music Theory, Compressed</p>
          </div>
        </div>
        <nav className="app-nav" aria-label="Primary">
          {SECTIONS.map((section) => (
            <a key={section.id} className="nav-link" href={section.href}>
              <span className="nav-label">{section.label}</span>
            </a>
          ))}
        </nav>
      </header>

      <main className="app-main">
        <section id="hero" className="hero">
          <h2>Learn music theory.<br />Then play it.</h2>
          <p>
            Point at a chord, a scale, or a beat. Musix shows the exact notes, fingerings,
            and timing so a beginner can see the theory and feel it in the same breath.
          </p>
          <div className="hero-actions">
            <a className="hero-cta" href="#learn">
              Start with the overview
            </a>
            <a className="hero-cta secondary" href="#chords">
              Compare chords side by side
            </a>
          </div>
        </section>

        <section id="learn" className="section">
          <div className="section-head">
            <h2>The map for new learners</h2>
            <p>Pick one principle and the app reads it out loud with a note, a shape, and a tap.</p>
          </div>
          <div className="cards">
            {SECTIONS.map((section) => (
              <a key={section.id} className="card" href={section.href}>
                <span className="card-icon">{section.id === 'chords' ? '🪕' : section.id === 'guitar' ? '🎸' : section.id === 'rhythm' ? '🥁' : '📐'}</span>
                <h3>{section.heading}</h3>
                <p>{section.description}</p>
              </a>
            ))}
          </div>
        </section>

        <section id="pitch" className="section">
          <div className="section-head">
            <h2>Pitch & Frequencies</h2>
            <p>See the chromatic staff, hear it, and move one semitone at a time.</p>
          </div>
          <div className="pitch-grid">
            <div className="pitch-card">
              <div className="pitch-title">Chromatic Staff</div>
              <div className="staff">
                <div className="clef">𝄞</div>
                {NOTES.map((note) => (
                  <div key={note} className="staff-cell">
                    <div className="staff-label">{note}</div>
                    <div className="staff-lines">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="staff-line"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pitch-controls">
                <button className="btn" onClick={() => setPitchIndex((index) => Math.max(0, index - 1))}>
                  Prev
                </button>
                <button className="btn primary" onClick={() => setPitchIndex((index) => index + 1)}>
                  Next
                </button>
                <button className="btn primary" onClick={() => {}}>
                  Play
                </button>
                <span className="pitch-value">{NOTES[pitchIndex % 12]} {Math.floor(pitchIndex / 12)} = {PITCH[pitchIndex % 12].freq} Hz</span>
              </div>
            </div>
            <div className="pitch-card">
              <div className="pitch-title">Why it happens</div>
              <p>A semitone is the smallest step in 12-tone equal temperament. Each raise multiplies the frequency by about 1.0595. The reference data already has every pitch class mapped, so you can start at any note and count up exactly.</p>
            </div>
          </div>
        </section>

        <section id="intervals" className="section">
          <div className="section-head">
            <h2>Intervals</h2>
            <p>Every interval, its semitone distance, and the shape it makes around a root.</p>
          </div>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Semitones</th>
                  <th>Interval</th>
                  <th>Short</th>
                  <th>Kind</th>
                </tr>
              </thead>
              <tbody>
                {INTERVALS.map((interval) => (
                  <tr key={interval.semitones}>
                    <td>{interval.semitones}</td>
                    <td>{interval.name}</td>
                    <td>{interval.short}</td>
                    <td>{interval.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="scales" className="section">
          <div className="section-head">
            <h2>Scales & Modes</h2>
            <p>Pick a root and mode. Every formula rebuilds itself in the sketch below.</p>
          </div>
          <div className="controls-row">
            <div className="control-group">
              <label htmlFor="root">Root</label>
              <select id="root" value={root} onChange={(event) => setRoot(event.target.value)}>
                {NOTEBADGES.map((note) => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>
            <div className="control-group">
              <label htmlFor="scale">Mode</label>
              <select id="scale" value={scale} onChange={(event) => setScale(event.target.value)}>
                {SCALES.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="comparison">
            {SCALES.map((item) => {
              const active = selectedScale?.label === item.name;
              return (
                <button
                  key={item.name}
                  className={`scale-card ${active ? 'active' : ''}`}
                  onClick={() => {
                    const found = SCALES.find((candidate) => candidate.name === item.name);
                    setSelectedScale(found ?? null);
                  }}
                >
                  <span className="scale-name">{item.name}</span>
                  <span className="scale-formula">{item.formula}</span>
                  <span className="scale-notes">{formatNotes(item.intervals, root)}</span>
                </button>
              );
            })}
          </div>

          {selectedScale && (
            <div className="scale-result">
              <div className="scale-meta">
                <h3>{selectedScale.label}</h3>
                <div className="scale-formula-display">{selectedScale.formula}</div>
              </div>
              <div className="scale-notes-stack">
                {formatNotes(selectedScale.intervals, root).map((note) => (
                  <span key={note} className="scale-note">{note}</span>
                ))}
              </div>
              <div className="scale-legend">
                <span>Notes spread: 0–11</span>
                <span>Root: {root}</span>
              </div>
            </div>
          )}
        </section>

        <section id="chords" className="section">
          <div className="section-head">
            <h2>Chords & Comparison Cards</h2>
            <p>Show two or three chord cards at once, mute any layer, and compare the notes instantly.</p>
          </div>

          <div className="chord-controls">
            <div className="chord-picker">
              <label htmlFor="chord-a">Chord 1</label>
              <select id="chord-a" value={chord1?.name ?? ''} onChange={(event) => {}}>
                <option value="C Major">C Major</option>
                <option value="G7">G7</option>
                <option value="C/G Bass">C/G Bass</option>
              </select>
            </div>
            <div className="chord-picker">
              <label htmlFor="chord-b">Chord 2</label>
              <select id="chord-b" value={chord2?.name ?? ''} onChange={(event) => {}}>
                <option value="C Major">C Major</option>
                <option value="G7">G7</option>
                <option value="C/G Bass">C/G Bass</option>
              </select>
            </div>
            <div className="chord-picker">
              <label htmlFor="chord-c">Chord 3</label>
              <select id="chord-c" value={chord3?.name ?? ''} onChange={(event) => {}}>
                <option value="C Major">C Major</option>
                <option value="G7">G7</option>
                <option value="C/G Bass">C/G Bass</option>
              </select>
            </div>
          </div>

          <div className="chord-cards">
            {renderChordCard(chord1, 1)}
            {renderChordCard(chord2, 2)}
            {renderChordCard(chord3, 3)}
          </div>

          <div className="chord-toggle">
            <button
              className={`layer-btn ${chordCard === 'all' ? 'active' : ''}`}
              onClick={() => setChordCard('all')}
            >
              All
            </button>
            <button
              className={`layer-btn ${chordCard === 1 ? 'active' : ''}`}
              onClick={() => setChordCard(1)}
            >
              Chord 1
            </button>
            <button
              className={`layer-btn ${chordCard === 2 ? 'active' : ''}`}
              onClick={() => setChordCard(2)}
            >
              Chord 2
            </button>
            <button
              className={`layer-btn ${chordCard === 3 ? 'active' : ''}`}
              onClick={() => setChordCard(3)}
            >
              Chord 3
            </button>
          </div>
        </section>

        <section id="guitar" className="section">
          <div className="section-head">
            <h2>Guitar Fretboard Press Visualizer</h2>
            <p>Choose a mapping, then press the fretboard to see exactly which strings and frets to use.</p>
          </div>

          <div className="fretboard-controls">
            <div className="fretboard-picker">
              <label htmlFor="fretboard-map">Mapping</label>
              <select id="fretboard-map" value={fretCard?.name ?? ''} onChange={(event) => {}}>
                <option value="Standard Tuning">Standard Tuning</option>
                <option value="Drop D">Drop D</option>
                <option value="Open G">Open G</option>
                <option value="CAGED">CAGED</option>
                <option value="3NP Patterns">3NP Patterns</option>
              </select>
            </div>
            <div className="fretboard-picker">
              <label htmlFor="shape">Shape</label>
              <select id="shape" value={fretCard?.name ?? ''} onChange={(event) => {}}>
                <option value="Open C">Open C</option>
                <option value="Barre E">Barre E</option>
                <option value="CAGED C">CAGED C</option>
                <option value="CAGED A">CAGED A</option>
                <option value="3NP G7">3NP G7</option>
              </select>
            </div>
          </div>

          {fretCard && <FretboardCard {...fretCard} />}
        </section>

        <section id="rhythm" className="section">
          <div className="section-head">
            <h2>Rhythm & Metronome</h2>
            <p>Tap the tempo, follow the beat clock, and let the app play the pulse for you.</p>
          </div>
          <div className="rhythm-grid">
            <div className="rhythm-card">
              <div className="rhythm-title">Beat Clock</div>
              <div className="beat-grid">
                {Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={index}
                    className="beat-cell"
                    onClick={() => {}}
                  >
                    <span className="beat-number">{index + 1}</span>
                    <span className="beat-label">1 2 3 4</span>
                  </div>
                ))}
              </div>
              <div className="rhythm-controls">
                <button className="btn" onClick={() => {}}>
                  Tap Tempo
                </button>
                <div className="rhythm-slider">
                  <label htmlFor="bpm">BPM</label>
                  <input id="bpm" type="range" min={30} max={220} defaultValue={120} />
                </div>
                <div className="rhythm-buttons">
                  <button className="btn primary" onClick={() => {}}>
                    Start Metronome
                  </button>
                  <button className="btn" onClick={() => {}}>
                    Stop
                  </button>
                </div>
              </div>
            </div>
            <div className="rhythm-card">
              <div className="rhythm-title">Why it matters</div>
              <p>Every song is just a pulse plus a pattern. Set the count-in, watch the cells light up, and your hands learn the tempo before the metronome starts.</p>
              <div className="rhythm-tip">
                Tap &mdash; the app snaps a tempo from your taps and prints it in BPM.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Musix &mdash; music theory, compressed into one page.</p>
        <p className="muted">Open source reference data. Build with Bun and Vite.</p>
      </footer>
    </div>
  );
}

const NOTEBADGES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

function formatNotes(intervals: number[], root: string): string[] {
  const rootIndex = NOTES.indexOf(root as Notes);
  return intervals.map((interval) => {
    const index = (rootIndex + interval) % 12;
    return NOTES_WITH_ACCIDENTALS[index] ?? noteLabel(index);
  });
}

function Notes(value: string): string {
  return value;
}

function renderChordCard(chord: Chord | null, index: 1 | 2 | 3): JSX.Element | null {
  if (!chord) return null;
  return (
    <article className="chord-card">
      <div className="chord-card-top">
        <span className="chord-name">{chord.name}</span>
        <a className="chord-link" href={chord.url}>
          Fingering
        </a>
      </div>
      <div className="chord-notes">
        {chord.notes.map((note) => (
          <span key={note} className="chord-note">{note}</span>
        ))}
      </div>
      <div className="chord-fingering">
        {chord.fingerings.map((fingering) => (
          <span key={fingering} className="chord-fingering-item">{fingering}</span>
        ))}
      </div>
    </article>
  );
}

type FretboardCardProps = {
  name: string;
  url: string;
  strings: string[];
  pressLabel: string;
  key?: string;
  shapes?: string[];
};

function FretboardCard({ name, url, strings, pressLabel, key, shapes }: FretboardCardProps) {
  return (
    <article className="chord-card fretboard-card">
      <div className="chord-card-top">
        <span className="chord-name">{name}</span>
        <a className="chord-link" href={url}>
          Mapping
        </a>
      </div>
      <div className="fretboard">
        <div className="fretboard-strings">
          {strings.map((string, index) => (
            <div key={index} className="fretboard-string">
              <span className="fretboard-string-label">{string}</span>
            </div>
          ))}
        </div>
        <div className="fretboard-board">
          <div className="fretboard-press">{pressLabel}</div>
        </div>
        {shapes && shapes.length > 0 && (
          <div className="fretboard-shapes">
            {shapes.map((shape) => (
              <span key={shape} className="fretboard-shape">{shape}</span>
            ))}
          </div>
        )}
      </div>
      {key && <div className="fretboard-key">{key}</div>}
    </article>
  );
}

export default App;
