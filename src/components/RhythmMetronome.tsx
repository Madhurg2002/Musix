import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../utils/audio';

const TEMPO_NAMES: { min: number; max: number; name: string }[] = [
  { min: 20,  max: 39,  name: 'Larghissimo' },
  { min: 40,  max: 59,  name: 'Grave' },
  { min: 60,  max: 65,  name: 'Largo' },
  { min: 66,  max: 75,  name: 'Larghetto' },
  { min: 76,  max: 107, name: 'Andante' },
  { min: 108, max: 119, name: 'Moderato' },
  { min: 120, max: 155, name: 'Allegro' },
  { min: 156, max: 175, name: 'Vivace' },
  { min: 176, max: 199, name: 'Presto' },
  { min: 200, max: 240, name: 'Prestissimo' },
];

function getTempoName(bpm: number) {
  return TEMPO_NAMES.find((t) => bpm >= t.min && bpm <= t.max)?.name ?? 'Moderato';
}

export const RhythmMetronome: React.FC = () => {
  const [bpm, setBpm] = useState<number>(100);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentBeat, setCurrentBeat] = useState<number>(1);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState<number>(4);
  const [pendulumAngle, setPendulumAngle] = useState<number>(-30);
  const [pendulumDir, setPendulumDir] = useState<1 | -1>(1);
  const [flashBeat, setFlashBeat] = useState<boolean>(false);
  const [accent, setAccent] = useState<boolean>(false); // true = downbeat flash

  const tapTimesRef = useRef<number[]>([]);
  const timerRef = useRef<number | null>(null);
  const pendulumAnimRef = useRef<number | null>(null);
  const pendulumStartRef = useRef<number | null>(null);
  const pendulumFromRef = useRef<number>(-30);
  const pendulumToRef = useRef<number>(30);

  // Eased pendulum swing between two angles
  const animatePendulum = useCallback((timestamp: number) => {
    if (!pendulumStartRef.current) pendulumStartRef.current = timestamp;
    const intervalMs = (60 / bpm) * 1000;
    const elapsed = timestamp - pendulumStartRef.current;
    const progress = Math.min(elapsed / intervalMs, 1);
    // Ease in-out sine for natural swing
    const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);
    const from = pendulumFromRef.current;
    const to = pendulumToRef.current;
    setPendulumAngle(from + (to - from) * eased);

    if (progress < 1) {
      pendulumAnimRef.current = requestAnimationFrame(animatePendulum);
    }
  }, [bpm]);

  const triggerBeat = useCallback((beat: number, isDownbeat: boolean) => {
    soundEngine.playClick(isDownbeat);
    setFlashBeat(true);
    setAccent(isDownbeat);
    setTimeout(() => setFlashBeat(false), 120);

    // Swap pendulum direction & animate
    const fromVal = pendulumFromRef.current;
    const toVal = pendulumToRef.current;
    if (fromVal != null && toVal != null) {
      pendulumFromRef.current = toVal;
      pendulumToRef.current = fromVal;
    }
    pendulumStartRef.current = null;
    if (pendulumAnimRef.current) cancelAnimationFrame(pendulumAnimRef.current);
    pendulumAnimRef.current = requestAnimationFrame(animatePendulum);
  }, [animatePendulum]);

  useEffect(() => {
    if (isPlaying) {
      let beat = 1;

      // Fire immediately on start
      triggerBeat(beat, beat === 1);
      setCurrentBeat(beat);

      const intervalMs = (60 / bpm) * 1000;
      timerRef.current = window.setInterval(() => {
        beat = (beat % beatsPerMeasure) + 1;
        setCurrentBeat(beat);
        triggerBeat(beat, beat === 1);
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pendulumAnimRef.current) cancelAnimationFrame(pendulumAnimRef.current);
      setPendulumAngle(-30);
      setPendulumDir(1);
      setCurrentBeat(1);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pendulumAnimRef.current) cancelAnimationFrame(pendulumAnimRef.current);
    };
  }, [isPlaying, bpm, beatsPerMeasure]);

  const handleTapTempo = () => {
    const now = performance.now();
    const times = [...tapTimesRef.current, now].slice(-6);
    tapTimesRef.current = times;

    if (times.length > 1) {
      const intervals: number[] = [];
      for (let i = 1; i < times.length; i++) {
        intervals.push(times[i] - times[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculated = Math.round(60000 / avgMs);
      if (calculated >= 40 && calculated <= 240) {
        setBpm(calculated);
      }
    }
    soundEngine.playClick(false);
  };

  const tempoName = getTempoName(bpm);
  const swingDuration = ((60 / bpm) * 1000).toFixed(0);

  // Weight position on pendulum rod: higher BPM = weight closer to pivot
  // Range: 40bpm → weight at 85% down, 220bpm → weight at 20% down
  const weightPos = 85 - ((bpm - 40) / 180) * 65; // 20-85%

  // Safety clamp so the SVG math never receives a fractional/negative index.
  const safeBpmIndex = Math.max(0, Math.min(220, bpm));

  return (
    <div className="metronome-page glass-card">
      <div className="metronome-header">
        <div>
          <span className="section-badge">⏱️ Rhythm & Pulse</span>
          <h2>Visual Metronome</h2>
          <p>Practice time-keeping with an animated pendulum, beat flash, and tap tempo.</p>
        </div>
        <button
          className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
          onClick={() => setIsPlaying(!isPlaying)}
          id="metronome-play-btn"
        >
          {isPlaying ? '⏹ Stop' : '▶ Start'}
        </button>
      </div>

      <div className="metronome-stage">

        {/* ── LEFT: Animated Pendulum Figure ── */}
        <div className={`metronome-figure-wrap ${flashBeat ? (accent ? 'flash-accent' : 'flash-beat') : ''}`}>
          <svg
            className="metronome-svg"
            viewBox="0 0 200 340"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cabinet Body */}
            <defs>
              <linearGradient id="woodGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#3d2b1f" />
                <stop offset="40%"  stopColor="#6b3f28" />
                <stop offset="70%"  stopColor="#4a2e1a" />
                <stop offset="100%" stopColor="#2e1a0e" />
              </linearGradient>
              <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#1a2640" />
                <stop offset="100%" stopColor="#0d1520" />
              </linearGradient>
            </defs>

            {/* Cabinet outer shape (trapezoid) */}
            <polygon
              points="30,320 170,320 155,60 45,60"
              fill="url(#woodGrad)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Cabinet face (inner panel) */}
            <polygon
              points="45,310 155,310 143,72 57,72"
              fill="url(#faceGrad)"
            />
            {/* Top cap */}
            <polygon points="45,60 155,60 145,45 55,45" fill="#4a2e1a" />
            <polygon points="55,45 145,45 140,38 60,38" fill="#6b3f28" />

            {/* Tick scale marks on face */}
            {Array.from({ length: 9 }).map((_, i) => {
              const iu = i & 255;
              const y = 85 + iu * 24;
              const halfW = 28 - iu * 1.5;
              return (
                <line
                  key={iu}
                  x1={100 - halfW} y1={y}
                  x2={100 + halfW} y2={y}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={iu === 4 ? '1.5' : '0.8'}
                />
              );
            })}

            {/* BPM number on face */}
            <text
              x="100" y="280"
              textAnchor="middle"
              fontSize="28"
              fontWeight="700"
              fontFamily="'Space Grotesk', monospace"
              fill={accent && flashBeat ? '#00f5d4' : '#f8fafc'}
              className="metro-bpm-svg"
            >
              {bpm}
            </text>
            <text
              x="100" y="296"
              textAnchor="middle"
              fontSize="10"
              fontFamily="'Outfit', sans-serif"
              fill="rgba(255,255,255,0.4)"
              letterSpacing="2"
            >
              BPM
            </text>

            {/* Pivot point */}
            <circle cx="100" cy="75" r="4" fill="#aaa" />

            {/* Pendulum arm — rotates around pivot (100, 75) */}
            <g
              className="pendulum-arm-group"
              style={{
                transform: `rotate(${pendulumAngle}deg)`,
                transformOrigin: '100px 75px',
                transition: isPlaying ? 'none' : 'transform 0.4s ease',
              }}
            >
              {/* Rod */}
              <line
                x1="100" y1="75"
                x2="100" y2="295"
                stroke="#c0a882"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Sliding weight diamond — position based on BPM */}
              <rect
                x="86"
                y={75 + ((weightPos ?? 85) / 100) * 220 - 12}
                width="28"
                height="24"
                rx="4"
                fill={accent && flashBeat ? '#00f5d4' : '#ffb703'}
                stroke="#fff"
                strokeWidth="1"
                className="metro-weight"
              />
              {/* Weight notch */}
              <line
                x1="86"
                y1={75 + ((weightPos ?? 85) / 100) * 220}
                x2="114"
                y2={75 + ((weightPos ?? 85) / 100) * 220}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
              />
              {/* Bob at bottom */}
              <polygon
                points={`100,${295 - 6} 90,${295 + 14} 110,${295 + 14}`}
                fill="#c0a882"
              />
              {/* Weight notch */}
              <line
                x1="86" y1={75 + ((weightPos ?? 85) / 100) * 220}
                x2="114" y2={75 + ((weightPos ?? 85) / 100) * 220}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1.5"
              />
              {/* Bob at bottom */}
              <polygon
                points={`100,${295 - 6} 90,${295 + 14} 110,${295 + 14}`}
                fill="#c0a882"
              />
            </g>
          </svg>

          {/* Glow pulse ring under metronome */}
          <div className={`metro-pulse-ring ${flashBeat ? (accent ? 'ring-accent' : 'ring-beat') : ''}`} />
        </div>

        {/* ── RIGHT: Controls ── */}
        <div className="metronome-controls-panel">

          {/* Beat dots */}
          <div className="beat-dots-row">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => {
              const beatNum = i + 1;
              const isActive = isPlaying && currentBeat === beatNum;
              return (
                <div
                  key={beatNum}
                  className={`beat-dot ${isActive ? 'dot-active' : ''} ${beatNum === 1 ? 'dot-downbeat' : ''}`}
                  title={`Beat ${beatNum}`}
                >
                  <span className="dot-num">{beatNum}</span>
                </div>
              );
            })}
          </div>

          {/* BPM display + slider */}
          <div className="bpm-control-block">
            <div className="bpm-readout">
              <span className="bpm-big">{bpm}</span>
              <div className="bpm-meta">
                <span className="bpm-unit-label">BPM</span>
                <span className="tempo-name-tag">{tempoName}</span>
              </div>
            </div>

            <input
              type="range"
              min="40" max="220" step="1"
              value={bpm}
              className="bpm-slider"
              onChange={(e) => setBpm(Number(e.target.value))}
              id="bpm-slider"
            />

            <div className="bpm-range-labels">
              <span>40</span>
              <span>Slow ←→ Fast</span>
              <span>220</span>
            </div>
          </div>

          {/* Quick BPM presets */}
          <div className="tempo-preset-row">
            {[60, 80, 100, 120, 140, 160].map((t) => (
              <button
                key={t}
                className={`tempo-preset-btn ${bpm === t ? 'preset-active' : ''}`}
                onClick={() => setBpm(t)}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Time signature + tap */}
          <div className="metronome-bottom-row">
            <div className="time-sig-block">
              <label className="ctrl-label">Time Signature</label>
              <select
                className="select-input"
                value={beatsPerMeasure}
                onChange={(e) => { setBeatsPerMeasure(Number(e.target.value)); setCurrentBeat(1); }}
                id="time-signature-select"
              >
                <option value={2}>2 / 4</option>
                <option value={3}>3 / 4</option>
                <option value={4}>4 / 4</option>
                <option value={6}>6 / 8</option>
                <option value={5}>5 / 4</option>
                <option value={7}>7 / 8</option>
              </select>
            </div>

            <button
              className="tap-btn"
              onPointerDown={handleTapTempo}
              id="tap-tempo-btn"
            >
              👆 Tap Tempo
            </button>
          </div>

          {/* Live interval info */}
          <div className="metronome-info-chips">
            <span className="info-chip">⚡ {swingDuration}ms / beat</span>
            <span className="info-chip">🎵 {tempoName}</span>
            <span className="info-chip">🕒 {beatsPerMeasure}/4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
