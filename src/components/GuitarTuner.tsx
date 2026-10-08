import React, { useState, useEffect, useRef } from 'react';
import { NoteName } from '../types';
import { ALL_NOTES } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';

// Autocorrelation pitch detector (browser-side). Returns -1 when no pitch is usable.
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i] ?? 0;
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.012) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i] ?? 0) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i] ?? 0) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const sliceBuf = buf.slice(r1, r2);
  const sliceSize = sliceBuf.length;

  const c = new Float32Array(sliceSize);
  for (let i = 0; i < sliceSize; i++) {
    for (let j = 0; j < sliceSize - i; j++) {
      c[i] += (sliceBuf[j] ?? 0) * (sliceBuf[j + i] ?? 0);
    }
  }

  let d = 0;
  while (d + 1 < sliceSize && c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < sliceSize; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (T0 == null || T0 < 1 || T0 >= sliceSize) return -1;

  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0] ?? 0;
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate / T0;
}

export { detectPitch as detectPitchVanilla };

export { detectPitch as detectPitchLite };

export interface StringInfo {
  index: number;
  note: NoteName;
  octave: number;
  frequency: number;
  stringName: string;
  side: 'left' | 'right';
}

export interface TuningPreset {
  name: string;
  strings: StringInfo[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'Standard Guitar (E A D G B E)',
    strings: [
      { index: 6, note: 'E', octave: 2, frequency: 82.41, stringName: '6 (Low E)', side: 'left' },
      { index: 5, note: 'A', octave: 2, frequency: 110.0, stringName: '5 (A)', side: 'left' },
      { index: 4, note: 'D', octave: 3, frequency: 146.83, stringName: '4 (D)', side: 'left' },
      { index: 3, note: 'G', octave: 3, frequency: 196.0, stringName: '3 (G)', side: 'right' },
      { index: 2, note: 'B', octave: 3, frequency: 246.94, stringName: '2 (B)', side: 'right' },
      { index: 1, note: 'E', octave: 4, frequency: 329.63, stringName: '1 (High E)', side: 'right' },
    ],
  },
  {
    name: 'Drop D (D A D G B E)',
    strings: [
      { index: 6, note: 'D', octave: 2, frequency: 73.42, stringName: '6 (Low D)', side: 'left' },
      { index: 5, note: 'A', octave: 2, frequency: 110.0, stringName: '5 (A)', side: 'left' },
      { index: 4, note: 'D', octave: 3, frequency: 146.83, stringName: '4 (D)', side: 'left' },
      { index: 3, note: 'G', octave: 3, frequency: 196.0, stringName: '3 (G)', side: 'right' },
      { index: 2, note: 'B', octave: 3, frequency: 246.94, stringName: '2 (B)', side: 'right' },
      { index: 1, note: 'E', octave: 4, frequency: 329.63, stringName: '1 (High E)', side: 'right' },
    ],
  },
  {
    name: 'Half Step Down (E♭ A♭ D♭ G♭ B♭ E♭)',
    strings: [
      { index: 6, note: 'D♯', octave: 2, frequency: 77.78, stringName: '6 (E♭)', side: 'left' },
      { index: 5, note: 'G♯', octave: 2, frequency: 103.83, stringName: '5 (A♭)', side: 'left' },
      { index: 4, note: 'C♯', octave: 3, frequency: 138.59, stringName: '4 (D♭)', side: 'left' },
      { index: 3, note: 'F♯', octave: 3, frequency: 185.0, stringName: '3 (G♭)', side: 'right' },
      { index: 2, note: 'A♯', octave: 3, frequency: 233.08, stringName: '2 (B♭)', side: 'right' },
      { index: 1, note: 'D♯', octave: 4, frequency: 311.13, stringName: '1 (E♭)', side: 'right' },
    ],
  },
];

// Autocorrelation Pitch Detection algorithm
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buf[i] ?? 0;
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.012) return -1;

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i] ?? 0) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i] ?? 0) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const sliceBuf = buf.slice(r1, r2);
  const sliceSize = sliceBuf.length;

  const c: Float32Array = new Float32Array(sliceSize);
  for (let i = 0; i < sliceSize; i++) {
    let sum = 0;
    let j = 0;
    const limit = sliceSize - i;
    for (j = 0; j < limit; j++) {
      sum += (sliceBuf[j] ?? 0) * (sliceBuf[j + i] ?? 0);
    }
    c[i] = sum;
  }

  let d = 0;
  while (d + 1 < sliceSize && c[d] > c[d + 1]) {
    d++;
  }

  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < sliceSize; i++) {
    const cAtI = c[i] ?? 0;
    if (cAtI > maxval) {
      maxval = cAtI;
      maxpos = i;
    }
  }

  let T0 = maxpos;
  if (T0 == null || T0 < 1) return -1;

  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0] ?? 0;
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;

  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate / T0;
}

export const GuitarTuner: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [autoDetectMode, setAutoDetectMode] = useState<boolean>(true);
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNoteName, setDetectedNoteName] = useState<string>('--');
  const [centsOff, setCentsOff] = useState<number>(0);
  const [activePegIndex, setActivePegIndex] = useState<number | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastChimeTimeRef = useRef<number>(0);

  const preset = TUNING_PRESETS[selectedPresetIndex] ?? TUNING_PRESETS[0]!;
  const currentTuningStrings = preset.strings;
  const selectedStringInfo = (() => {
    if (selectedStringIndex == null) return undefined;
    return currentTuningStrings[selectedStringIndex] ?? undefined;
  })();

  const selectedGuitarStringInfo = (() => {
    if (selectedStringInfo) return selectedStringInfo;
    const found = currentTuningStrings.find((s) => s.index === selectedStringIndex);
    if (found) return found;
    return currentTuningStrings[0] ?? undefined;
  })();

  const handlePegClick = (str: StringInfo) => {
    setSelectedStringIndex(str.index);
    setActivePegIndex(str.index);
    soundEngine.playNote(str.frequency ?? 440, 2.5, 'acoustic-guitar');
  };

  const handlePegClickExt = (str: StringInfo | null | undefined) => {
    if (!str) return;
    setSelectedStringIndex(str.index);
    setActivePegIndex(str.index);
    soundEngine.playNote(str.frequency ?? 440, 2.5, 'acoustic-guitar');
  };

  const startMic = async () => {
    try {
      setMicError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      source.connect(analyser);

      setIsMicListening(true);
      updatePitch();
    } catch {
      setMicError('Microphone access denied or unavailable. Please enable microphone permissions or click pegs to hear reference tones.');
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsMicListening(false);
    setDetectedPitch(null);
    setDetectedNoteName('--');
    setCentsOff(0);
    setActivePegIndex(null);
  };

  // Helper: bail out early if any live audio dependency is missing.
  const hasLiveAudio = !!(analyserRef.current && audioCtxRef.current && preset);
  const updatePitch = () => {
    if (!hasLiveAudio) return;

    const analyser = analyserRef.current;
    const ctx = audioCtxRef.current;

    if (!analyser || !ctx) return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    const pitch = autoCorrelate(buf, ctx.sampleRate ?? 44100);

    // Guard the pitch-analysis branch so the strict-build path stays readable.
    const hasUsablePitch = pitch !== -1 && 60 < pitch && pitch < 1000;
    if (hasUsablePitch) {
      const currentPitch = pitch;

      setDetectedPitch(pitch);

      // Find closest MIDI note
      const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2)) + 69;
      const roundedMidi = Math.round(noteNum);

      const noteName = ALL_NOTES[(((roundedMidi % 12) + 12) % 12) & 255] ?? '--' as NoteName;

      // Keep the octave computation on a narrowed numeric expression so the
      // strict-build path is easy to reason about.
      const octave = Math.floor(roundedMidi / 12) - 1;
      const cents = Math.round(100 * (noteNum - roundedMidi));
      setDetectedNoteName(`${noteName}${octave}`);

      setCentsOff(cents);

      // Find matching string peg from active tuning preset
      let matchedPeg: StringInfo | undefined;
      if (autoDetectMode) {
        matchedPeg = currentTuningStrings.find(
          (s) => s.frequency != null && Math.abs(12 * Math.log2(pitch / s.frequency)) < 1.8
        );
      } else if (selectedStringIndex !== null) {
        matchedPeg = currentTuningStrings.find((s) => s.index === selectedStringIndex);
      }
      if (matchedPeg) {
        setActivePegIndex(matchedPeg.index);

        // Play success chirp if perfectly in tune (once per 2 seconds)
        if (Math.abs(cents) <= 4 && Date.now() - lastChimeTimeRef.current > 2000) {
          soundEngine.playClick(true);
          lastChimeTimeRef.current = Date.now();
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(updatePitch);
  };

  const activePreset = preset;
  const presetStrings = activePreset?.strings ?? [];

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  // Needle angle for curved arc gauge (-45 deg to +45 deg)
  const needleAngle = Math.min(Math.max((centsOff / 50) * 45, -45), 45);

  const leftPegs = currentTuningStrings.filter((s) => s.side === 'left');
  const rightPegs = currentTuningStrings.filter((s) => s.side === 'right');

  return (
    <div className="guitartuna-tuner-container glass-card">
      {/* Top Header Controls */}
      <div className="tuner-header">
        <div>
          <span className="section-badge">🎯 GuitarTuna Style Visual Pitch Engine</span>
          <h2>Interactive Guitar Headstock Tuner</h2>
          <p>Automatic pitch detection with visual tuning pegs and curved arc meter.</p>
        </div>

        <div className="tuner-top-actions">
          <select
            className="select-input preset-select"
            value={selectedPresetIndex}
            onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
          >
            {TUNING_PRESETS.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            className={`btn ${autoDetectMode ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setAutoDetectMode(!autoDetectMode)}
          >
            {autoDetectMode ? '⚡ Auto String Detection' : '🔒 Manual Lock String'}
          </button>

          {!isMicListening ? (
            <button className="btn btn-accent" onClick={startMic}>
              🎙️ Enable Microphone
            </button>
          ) : (
            <button className="btn btn-danger" onClick={stopMic}>
              Stop Mic
            </button>
          )}
        </div>
      </div>

      {micError && (
        <div className="mic-error-banner">
          <span>⚠️ {micError}</span>
        </div>
      )}

      {/* Main GuitarTuna Layout: Arc Meter Top + Headstock Below */}
      <div className="guitartuna-main-stage">
        {/* 1. Curved Arc Meter Gauge */}
        <div className="tuna-arc-gauge">
          <svg viewBox="0 0 300 160" className="arc-svg">
            {/* Arc Track */}
            <path
              d="M 30 140 A 120 120 0 0 1 270 140"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* In-Tune Center Target Segment (Green) */}
            <path
              d="M 140 22 A 120 120 0 0 1 160 22"
              fill="none"
              stroke={Math.abs(centsOff) <= 4 ? '#00f5d4' : 'rgba(0, 245, 212, 0.4)'}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Ticks */}
            {[-40, -25, -10, 0, 10, 25, 40].map((deg) => {
              const degNorm = deg & 255;
              const rad = ((degNorm - 90) * Math.PI) / 180;
              const x1 = 150 + 105 * Math.cos(rad);
              const y1 = 140 + 105 * Math.sin(rad);
              const x2 = 150 + 120 * Math.cos(rad);
              const y2 = 140 + 120 * Math.sin(rad);
              return (
                <line
                  key={degNorm}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={degNorm === 0 ? '#00f5d4' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={degNorm === 0 ? '3' : '1.5'}
                />
              );
            })}

            {/* Animated Needle */}
            <g transform={`rotate(${needleAngle}, 150, 140)`}>
              <line
                x1="150"
                y1="140"
                x2="150"
                y2="30"
                stroke={Math.abs(centsOff) <= 4
                  ? '#00f5d4'
                  : centsOff < 0
                  ? '#ffb703'
                  : '#ff4d4d'}
                strokeWidth="4"
                strokeLinecap="round"
                className="arc-needle-line"
              />
              <circle cx="150" cy="140" r="8" fill="#fff" />
            </g>
          </svg>

          {/* Note & Pitch Center Readout */}
          <div className="tuna-readout">
            <div className="tuna-note-letter">{detectedNoteName}</div>
            {detectedPitch && (
              <div className="tuna-freq-sub">{detectedPitch.toFixed(1)} Hz</div>
            )}
            <div className="tuna-status-badge">
              {Math.abs(centsOff) <= 4 ? (
                <span className="in-tune-chip">IN TUNE ✅</span>
              ) : centsOff < 0 ? (
                <span className="flat-chip">TOO LOW 🔼 (Tune Up)</span>
              ) : (
                <span className="sharp-chip">TOO HIGH 🔽 (Tune Down)</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Visual Guitar Headstock with 6 Interactive Tuning Pegs */}
        <div className="headstock-tuner-wrapper">
          {/* Left String Pegs (Low E, A, D) */}
          <div className="pegs-column left-pegs">
            {leftPegs.map((str) => {
              const isActive = activePegIndex === str.index;
              return (
                <div
                  key={str.index}
                  className={`tuning-peg-card ${isActive ? 'active-peg' : ''}`}
                  onClick={() => str && handlePegClickExt(str)}
                >
                  <div className="peg-info">
                    <span className="peg-name">String {str.index}</span>
                    <span className="peg-freq">{str.frequency} Hz</span>
                  </div>
                  <div className="peg-circle-badge">
                    <span className="peg-note">{str.note}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Headstock Graphic Body */}
          <div className="headstock-graphic">
            <div className="headstock-top-crown" />
            <div className="headstock-wood-body">
              <span className="headstock-logo">Musix</span>
              <div className="nut-bar" />
              {/* String Lines running down */}
              <div className="headstock-strings-layer">
                {currentTuningStrings.map((str) => (
                  <div
                    key={str.index}
                    className={`headstock-string-wire ${activePegIndex === str.index ? 'active-wire' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right String Pegs (G, B, High E) */}
          <div className="pegs-column right-pegs">
            {rightPegs.map((str) => {
              const isActive = activePegIndex === str.index;
              return (
                <div
                  key={str.index}
                  className={`tuning-peg-card ${isActive ? 'active-peg' : ''}`}
                  onClick={() => str && handlePegClickExt(str)}
                >
                  <div className="peg-circle-badge">
                    <span className="peg-note">{str.note}</span>
                  </div>
                  <div className="peg-info">
                    <span className="peg-name">String {str.index}</span>
                    <span className="peg-freq">{str.frequency} Hz</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
