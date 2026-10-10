import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './musicTheory';

/** The note currently sounding, or silence. */
export interface LivePitch {
  /** MIDI note number rounded to the nearest semitone; null when nothing is sounding. */
  midi: number | null;
  /** Cents sharp (+) or flat (−) of that semitone. 0 while silent. */
  cents: number;
}

/** After this long without a usable pitch the readout returns to silence. */
const SILENCE_MS = 700;

/**
 * Continuous microphone pitch tracking — the engine behind the fretboard's live note
 * finder ("what note at what fret am I playing right now?").
 *
 * The analysis itself is `detectPitch` from musicTheory: the *same* detector the tuner
 * uses, so the two microphone paths cannot drift apart. This hook owns only the
 * plumbing — request the mic, run one analysis per animation frame, and fall back to
 * silence after `SILENCE_MS` so a note that stopped ringing does not sit on the neck
 * forever.
 *
 * State updates are coalesced (midi change, or cents moved ≥2) so a 60 fps analysis loop
 * does not re-render the screen on every frame.
 */
export function useLivePitch(): LivePitch & {
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
} {
  const [pitch, setPitch] = useState<LivePitch>({ midi: null, cents: 0 });
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastHeardRef = useRef(0);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    lastHeardRef.current = 0;
    setListening(false);
    setPitch({ midi: null, cents: 0 });
  }, []);

  const start = useCallback(() => {
    if (streamRef.current) return; // already running
    setError(null);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        streamRef.current = stream;

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        ctx.createMediaStreamSource(stream).connect(analyser);
        setListening(true);

        const buf = new Float32Array(analyser.fftSize);
        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          const frequency = detectPitch(buf, ctx.sampleRate || 44100);

          if (frequency > 0 && 55 < frequency && frequency < 1400) {
            const noteFloat = 12 * Math.log2(frequency / 440) + 69;
            const midi = Math.round(noteFloat);
            const cents = Math.round(100 * (noteFloat - midi));
            lastHeardRef.current = Date.now();
            setPitch((prev) =>
              prev.midi === midi && Math.abs(prev.cents - cents) < 2 ? prev : { midi, cents }
            );
          } else if (Date.now() - lastHeardRef.current > SILENCE_MS) {
            setPitch((prev) => (prev.midi === null ? prev : { midi: null, cents: 0 }));
          }

          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        stop();
        setError(
          'Microphone access denied or unavailable. Allow the microphone in your browser, or click the frets to hear notes instead.'
        );
      });
  }, [stop]);

  // Unmount (screen change) always releases the mic.
  useEffect(() => stop, [stop]);

  return { ...pitch, listening, error, start, stop };
}
