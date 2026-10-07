import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../utils/audio';

export const RhythmMetronome: React.FC = () => {
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);

  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = (60 / bpm) * 1000;
      timerRef.current = window.setInterval(() => {
        setCurrentBeat((prev) => {
          const nextBeat = (prev % beatsPerMeasure) + 1;
          soundEngine.playClick(nextBeat === 1);
          return nextBeat;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, bpm, beatsPerMeasure]);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = [...tapTimesRef.current, now].slice(-4);
    tapTimesRef.current = times;

    if (times.length > 1) {
      const intervals = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgMs);
      if (calculatedBpm >= 40 && calculatedBpm <= 240) {
        setBpm(calculatedBpm);
      }
    }
  };

  return (
    <div className="metronome-container glass-card">
      <div className="metronome-header">
        <div>
          <span className="section-badge">⏱️ Rhythm & Pulse</span>
          <h2>Visual Metronome & Tap Tempo</h2>
          <p>Practice time-keeping with a visual beat clock and audio click track.</p>
        </div>

        <button
          className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸ Stop Metronome' : '▶ Start Metronome'}
        </button>
      </div>

      <div className="metronome-body">
        {/* Visual Beat Clock Pulser */}
        <div className="beat-clock-visual">
          {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
            const beatNum = idx + 1;
            const isActive = isPlaying && currentBeat === beatNum;
            return (
              <div
                key={beatNum}
                className={`beat-indicator ${isActive ? 'beat-active' : ''} ${
                  beatNum === 1 ? 'downbeat' : ''
                }`}
              >
                <span className="beat-num">{beatNum}</span>
              </div>
            );
          })}
        </div>

        {/* BPM Slider & Controls */}
        <div className="bpm-controls">
          <div className="bpm-display">
            <span className="bpm-value">{bpm}</span>
            <span className="bpm-unit">BPM</span>
          </div>

          <input
            type="range"
            min="40"
            max="220"
            value={bpm}
            className="bpm-slider"
            onChange={(e) => setBpm(Number(e.target.value))}
          />

          <div className="metronome-extra-btns">
            <button className="btn btn-outline" onClick={handleTapTempo}>
              🖐️ Tap Tempo
            </button>

            <select
              className="select-input"
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
            >
              <option value={2}>2/4 Time</option>
              <option value={3}>3/4 Time</option>
              <option value={4}>4/4 Time</option>
              <option value={6}>6/8 Time</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
