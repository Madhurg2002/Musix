import React, { useState, useEffect, useRef } from 'react';
import { NoteName } from '../types';
import { ALL_NOTES, midiToFrequency } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';

export interface TuningPreset {
  name: string;
  strings: { note: NoteName; octave: number; frequency: number; stringName: string }[];
}

export const TUNING_PRESETS: TuningPreset[] = [
  {
    name: 'Standard Tuning (E A D G B E)',
    strings: [
      { note: 'E', octave: 2, frequency: 82.41, stringName: '6 (Low E)' },
      { note: 'A', octave: 2, frequency: 110.00, stringName: '5 (A)' },
      { note: 'D', octave: 3, frequency: 146.83, stringName: '4 (D)' },
      { note: 'G', octave: 3, frequency: 196.00, stringName: '3 (G)' },
      { note: 'B', octave: 3, frequency: 246.94, stringName: '2 (B)' },
      { note: 'E', octave: 4, frequency: 329.63, stringName: '1 (High E)' },
    ],
  },
  {
    name: 'Drop D (D A D G B E)',
    strings: [
      { note: 'D', octave: 2, frequency: 73.42, stringName: '6 (Low D)' },
      { note: 'A', octave: 2, frequency: 110.00, stringName: '5 (A)' },
      { note: 'D', octave: 3, frequency: 146.83, stringName: '4 (D)' },
      { note: 'G', octave: 3, frequency: 196.00, stringName: '3 (G)' },
      { note: 'B', octave: 3, frequency: 246.94, stringName: '2 (B)' },
      { note: 'E', octave: 4, frequency: 329.63, stringName: '1 (High E)' },
    ],
  },
  {
    name: 'Half Step Down (E♭ A♭ D♭ G♭ B♭ E♭)',
    strings: [
      { note: 'D♯', octave: 2, frequency: 77.78, stringName: '6 (E♭)' },
      { note: 'G♯', octave: 2, frequency: 103.83, stringName: '5 (A♭)' },
      { note: 'C♯', octave: 3, frequency: 138.59, stringName: '4 (D♭)' },
      { note: 'F♯', octave: 3, frequency: 185.00, stringName: '3 (G♭)' },
      { note: 'A♯', octave: 3, frequency: 233.08, stringName: '2 (B♭)' },
      { note: 'D♯', octave: 4, frequency: 311.13, stringName: '1 (E♭)' },
    ],
  },
];

// Autocorrelation Pitch Detection algorithm
function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let SIZE = buf.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    let val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // signal too quiet

  let r1 = 0,
    r2 = SIZE - 1,
    thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  let c = new Float32Array(SIZE);
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1,
    maxpos = -1;
  for (let i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  let T0 = maxpos;

  let x1 = c[T0 - 1],
    x2 = c[T0],
    x3 = c[T0 + 1];
  let a = (x1 + x3 - 2 * x2) / 2;
  let b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export const GuitarTuner: React.FC = () => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [mode, setMode] = useState<'reference' | 'mic'>('mic');
  const [activeRefNote, setActiveRefNote] = useState<string | null>(null);

  // Live Mic Tuner States
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [detectedPitch, setDetectedPitch] = useState<number | null>(null);
  const [detectedNote, setDetectedNote] = useState<string>('--');
  const [centsOff, setCentsOff] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const preset = TUNING_PRESETS[selectedPresetIndex];

  // Play Reference Tone for a string
  const handlePlayRefTone = (freq: number, strName: string) => {
    setActiveRefNote(strName);
    soundEngine.playNote(freq, 2.5, 'guitar');
    setTimeout(() => setActiveRefNote(null), 2500);
  };

  // Start Mic Pitch Detection
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
    } catch (err) {
      setMicError('Microphone access denied or unavailable. Please enable mic access or use Reference Tones.');
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
    setDetectedNote('--');
    setCentsOff(0);
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;
    const buf = new Float32Array(analyserRef.current.fftSize);
    analyserRef.current.getFloatTimeDomainData(buf);
    const pitch = autoCorrelate(buf, audioCtxRef.current.sampleRate);

    if (pitch !== -1 && pitch > 50 && pitch < 1000) {
      setDetectedPitch(pitch);
      // Calculate closest MIDI note: 12 * log2(pitch / 440) + 69
      const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2)) + 69;
      const roundedMidi = Math.round(noteNum);
      const noteName = ALL_NOTES[((roundedMidi % 12) + 12) % 12];
      const octave = Math.floor(roundedMidi / 12) - 1;

      // Calculate cents deviation: 100 * (noteNum - roundedMidi)
      const cents = Math.round(100 * (noteNum - roundedMidi));

      setDetectedNote(`${noteName}${octave}`);
      setCentsOff(cents);
    }

    animFrameRef.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  return (
    <div className="tuner-container glass-card">
      <div className="tuner-header">
        <div>
          <span className="section-badge">🎯 Precision Instrument Tuner</span>
          <h2>Guitar & Pitch Tuner</h2>
          <p>Tune your instrument using live microphone pitch detection or reference audio tones.</p>
        </div>

        <div className="tuner-mode-switcher">
          <button
            className={`btn ${mode === 'mic' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setMode('mic');
              if (!isMicListening) startMic();
            }}
          >
            🎙️ Live Mic Tuner
          </button>
          <button
            className={`btn ${mode === 'reference' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              setMode('reference');
              stopMic();
            }}
          >
            🔊 Reference Tones
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="tuner-preset-bar">
        <label>Tuning Preset:</label>
        <select
          className="select-input"
          value={selectedPresetIndex}
          onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
        >
          {TUNING_PRESETS.map((p, idx) => (
            <option key={idx} value={idx}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Mode 1: Live Mic Pitch Tuner */}
      {mode === 'mic' && (
        <div className="mic-tuner-body">
          {micError ? (
            <div className="mic-error-box">
              <p>⚠️ {micError}</p>
              <button className="btn btn-primary" onClick={startMic}>
                Retry Mic Access
              </button>
            </div>
          ) : (
            <div className="tuner-gauge-wrapper">
              <div className="tuner-status-bar">
                {!isMicListening ? (
                  <button className="btn btn-primary btn-lg" onClick={startMic}>
                    🎙️ Enable Microphone to Start Tuning
                  </button>
                ) : (
                  <button className="btn btn-outline" onClick={stopMic}>
                    Stop Mic
                  </button>
                )}
              </div>

              {/* Pitch Visual Gauge */}
              <div className="tuner-gauge-display">
                <div className="gauge-note-title">{detectedNote}</div>

                {detectedPitch && (
                  <div className="gauge-freq-text">{detectedPitch.toFixed(1)} Hz</div>
                )}

                {/* Meter Needle Bar */}
                <div className="gauge-meter">
                  <div className="meter-flat-zone">FLAT ♭</div>
                  <div className="meter-center-mark">
                    <span className={`center-light ${Math.abs(centsOff) <= 5 ? 'in-tune' : ''}`} />
                  </div>
                  <div className="meter-sharp-zone">SHARP ♯</div>

                  {/* Dynamic Needle */}
                  <div
                    className="meter-needle"
                    style={{
                      left: `${Math.min(Math.max(50 + (centsOff / 50) * 45, 5), 95)}%`,
                      backgroundColor:
                        Math.abs(centsOff) <= 5
                          ? '#00f5d4'
                          : Math.abs(centsOff) <= 15
                          ? '#ffb703'
                          : '#ff4d4d',
                    }}
                  />
                </div>

                <div className="cents-display">
                  {Math.abs(centsOff) <= 5 ? (
                    <span className="in-tune-text">PERFECT! IN TUNE ✅</span>
                  ) : centsOff < 0 ? (
                    <span className="flat-text">{centsOff} cents (Tune UP)</span>
                  ) : (
                    <span className="sharp-text">+{centsOff} cents (Tune DOWN)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Target Strings Quick Grid */}
      <div className="target-strings-section">
        <h3>Target Strings ({preset.name})</h3>
        <div className="target-strings-grid">
          {preset.strings.map((str, idx) => (
            <div
              key={idx}
              className={`target-string-card ${activeRefNote === str.stringName ? 'active-ref' : ''}`}
              onClick={() => handlePlayRefTone(str.frequency, str.stringName)}
            >
              <span className="target-str-num">String {str.stringName}</span>
              <span className="target-str-note">{str.note}{str.octave}</span>
              <span className="target-str-freq">{str.frequency} Hz</span>
              <button className="btn-nano">🔊 Play Tone</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
