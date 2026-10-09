import React, { useState, useEffect, useRef } from 'react';
import { NoteName } from '../types';
import { ALL_NOTES, detectPitch } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { Icon } from './Icon';

/** Base card chrome for a tuning peg; the active state is chosen at render. */
const PEG_CARD_BASE =
  'flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--accent-primary),0.6)]';
const PEG_CARD_ACTIVE =
  'border-accent bg-[rgba(var(--accent-rgb),0.14)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.18)]';
const PEG_CARD_IDLE =
  'border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)]';

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
  const handlePegClickExt = (str: StringInfo | null | undefined) => {
    if (!str) return;
    setSelectedStringIndex(str.index);
    setActivePegIndex(str.index);
    soundEngine.playNote(str.frequency ?? 440, 2.5, 'acoustic-guitar');
  };

  // Safety lookup for the currently selected tuning so the UI never crashes on stale index.
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

    const pitch = detectPitch(buf, ctx.sampleRate ?? 44100);

    // Guard the pitch-analysis branch so the strict-build path stays readable.
    const hasUsablePitch = pitch !== -1 && 60 < pitch && pitch < 1000;
    if (hasUsablePitch) {
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
    <div className="glass-card flex flex-col gap-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-badge inline-flex items-center gap-1.5 bg-[rgba(var(--accent-rgb),0.16)] text-accent">
            <Icon name="target" /> GuitarTuna Style Visual Pitch Engine
          </span>
          <h2>Interactive Guitar Headstock Tuner</h2>
          <p>Automatic pitch detection with visual tuning pegs and curved arc meter.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select-input font-bold text-accent"
            value={selectedPresetIndex}
            title="Tuning preset — sets the pitch every string should match"
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
            data-tip={
              autoDetectMode
                ? 'Auto: the meter follows whichever string you pluck'
                : 'Manual: locked to one string until you pick another'
            }
            onClick={() => setAutoDetectMode(!autoDetectMode)}
          >
            {autoDetectMode ? (
              <>
                <Icon name="zap" /> Auto String Detection
              </>
            ) : (
              <>
                <Icon name="lock" /> Manual Lock String
              </>
            )}
          </button>

          {!isMicListening ? (
            <button
              className="btn btn-accent"
              data-tip="Listen through the microphone and draw your pitch on the meter"
              onClick={startMic}
            >
              <Icon name="mic" /> Enable Microphone
            </button>
          ) : (
            <button
              className="btn btn-danger"
              data-tip="Stop listening and release the microphone"
              onClick={stopMic}
            >
              Stop Mic
            </button>
          )}
        </div>
      </div>

      {micError && (
        <div className="flex animate-[mic-banner-in_0.25s_ease] items-center gap-2 rounded-xl border border-[rgba(var(--alert-rgb),0.35)] bg-[rgba(var(--alert-rgb),0.14)] px-3.5 py-2.5 text-[0.88rem] font-semibold text-ink">
          <Icon name="alert" className="shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main GuitarTuna Layout: Arc Meter Top + Headstock Below */}
      <div className="flex flex-col items-center gap-8 py-4">
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
              stroke={Math.abs(centsOff) <= 4 ? '#86b06b' : 'rgba(134, 176, 107, 0.4)'}
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
                  stroke={degNorm === 0 ? '#86b06b' : 'rgba(255,255,255,0.3)'}
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
                  ? '#86b06b'
                  : centsOff < 0
                  ? '#e8c07d'
                  : '#e06c5a'}
                strokeWidth="4"
                strokeLinecap="round"
                className="arc-needle-line"
              />
              <circle cx="150" cy="140" r="8" fill="#fff" />
            </g>
          </svg>

          {/* Note & Pitch Center Readout */}
          <div className="absolute bottom-2.5 flex flex-col items-center text-center">
            <div className="font-display text-[56px] font-extrabold leading-none text-accent [text-shadow:0_0_20px_rgba(var(--accent-rgb),0.5)]">
              {detectedNoteName}
            </div>
            {detectedPitch && (
              <div className="mt-0.5 font-display text-sm text-ink-soft">
                {detectedPitch.toFixed(1)} Hz
              </div>
            )}
            <div className="mt-2">
              {Math.abs(centsOff) <= 4 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-success bg-[rgba(var(--success-rgb),0.2)] px-3.5 py-1 text-[13px] font-bold text-success shadow-[0_0_15px_rgba(var(--success-rgb),0.3)]">
                  <Icon name="check" /> IN TUNE
                </span>
              ) : centsOff < 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-highlight bg-[rgba(var(--highlight-rgb),0.2)] px-3.5 py-1 text-[13px] font-bold text-highlight">
                  <Icon name="chevron" className="-rotate-90" /> TOO LOW (Tune Up)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-alert bg-[rgba(var(--alert-rgb),0.2)] px-3.5 py-1 text-[13px] font-bold text-alert">
                  <Icon name="chevron" className="rotate-90" /> TOO HIGH (Tune Down)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. Visual Guitar Headstock with 6 Interactive Tuning Pegs */}
        <div className="relative flex flex-col items-center gap-2 px-0.5 pt-1.5 pb-2">
          {/* Left String Pegs (Low E, A, D) */}
          <div className="flex flex-col items-center gap-3">
            {leftPegs.map((str) => {
              const isActive = activePegIndex === str.index;
              return (
                <div
                  key={str.index}
                  className={`${PEG_CARD_BASE} ${isActive ? PEG_CARD_ACTIVE : PEG_CARD_IDLE}`}
                  data-tip={`Play the reference tone — string ${str.index} (${str.note}${str.octave}) at ${str.frequency} Hz`}
                  onClick={() => str && handlePegClickExt(str)}
                >
                  <div className="flex flex-col text-center text-[0.72rem] leading-[1.3] text-ink-muted">
                    <span className="text-xs font-bold text-ink">String {str.index}</span>
                    <span className="text-[11px] text-ink-muted">{str.frequency} Hz</span>
                  </div>
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(var(--accent-primary),0.6)] bg-[rgba(var(--accent-rgb),0.16)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">
                    <span className="text-lg font-bold text-accent">{str.note}</span>
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
          <div className="flex flex-col items-center gap-3">
            {rightPegs.map((str) => {
              const isActive = activePegIndex === str.index;
              return (
                <div
                  key={str.index}
                  className={`${PEG_CARD_BASE} ${isActive ? PEG_CARD_ACTIVE : PEG_CARD_IDLE}`}
                  data-tip={`Play the reference tone — string ${str.index} (${str.note}${str.octave}) at ${str.frequency} Hz`}
                  onClick={() => str && handlePegClickExt(str)}
                >
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(var(--accent-primary),0.6)] bg-[rgba(var(--accent-rgb),0.16)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">
                    <span className="text-lg font-bold text-accent">{str.note}</span>
                  </div>
                  <div className="flex flex-col text-center text-[0.72rem] leading-[1.3] text-ink-muted">
                    <span className="text-xs font-bold text-ink">String {str.index}</span>
                    <span className="text-[11px] text-ink-muted">{str.frequency} Hz</span>
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
