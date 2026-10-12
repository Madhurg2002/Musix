import { useCallback, useEffect, useRef, useState } from 'react';
import { computeRms, detectPitch } from './musicTheory';
import { createNeedleSmoother, createNoteHysteresis } from './tunerMeter';

/** The note currently sounding, or silence. */
export interface LivePitch {
  /** MIDI note of the displayed note (hysteresis-filtered); null while silent. */
  midi: number | null;
  /** Cents sharp (+) or flat (−) of that note. 0 while silent. */
  cents: number;
  /**
   * Frequency in Hz behind the current note; null while silent. It rides along with
   * accepted note/cents updates rather than updating per frame, so the coalescing below
   * stays the only thing that triggers a re-render.
   */
  frequency: number | null;
  /** True while a pitched signal is present but outside the current frequency band
      (the microphone hears it, but it is not this instrument's range). */
  outOfRange: boolean;
  /** Quantised input loudness 0–1 (analysis-window RMS mapped to ~0.15 full scale) for
      the input-level meter. Quantised to 15 steps so it cannot re-render the screen on
      every audio frame. */
  level: number;
  /** Needle frequency: median-window + EMA smoothed (tunerMeter), so one frame of noise
      or an octave slip cannot yank the needle. Mutated in the analysis loop — read
      `.current` during render; re-renders already happen whenever pitch state moves. */
  stableRef: { current: number | null };
  /** Rolling cents trace against the displayed note, oldest → newest, capped at
      ~120 samples (2 s at 60 fps) — the stability chip and sparkline read it. Same
      array identity every render; mutated in place by the loop. */
  centsHistory: number[];
}

/** Frequency band (Hz) the detector reports pitches for; outside it, silence. */
export interface FrequencyBand {
  min: number;
  max: number;
}

/**
 * The original global band this hook hardcoded (55–1400 Hz). The fretboard note finder
 * and Song Follower still use it — they listen for any playable pitch. The tuner passes
 * its preset's band instead (`tuningFrequencyRange` in tunings.ts), because "playable
 * pitch" is per instrument: a bass's low E1 is 41.2 Hz, and a violin runs past 1400 Hz.
 */
export const DEFAULT_FREQUENCY_BAND: FrequencyBand = { min: 55, max: 1400 };

/** After this long without a usable pitch the readout returns to silence. */
const SILENCE_MS = 700;
/** RMS that reads as full scale on the input meter (well above the 0.012 detection gate,
    so the needle always starts moving before the bar tops out). */
const LEVEL_FULL_SCALE = 0.15;
/** Quantisation steps for `level` — keeps meter re-renders in the ~10/s range. */
const LEVEL_STEPS = 15;
/** ~2 s of cents history at 60 fps. */
const HISTORY_CAP = 120;

/**
 * Continuous microphone pitch tracking — the engine behind every microphone path in the
 * app: the fretboard's live note finder, the Song Follower's follow-along, and the tuner.
 *
 * The analysis itself is `detectPitch` from musicTheory, so the paths cannot drift apart.
 * This hook owns the plumbing — request the mic, run one analysis per animation frame,
 * fall back to silence after `SILENCE_MS`, and shape the raw stream for display:
 * note-label hysteresis (a new note must hold ~0.2 s before the label switches, so it
 * never flickers between neighbours), a median+EMA-smoothed needle frequency, a quantised
 * input level, and a rolling cents trace. State updates stay coalesced (note change, or
 * cents moved ≥2) so the 60 fps loop does not re-render the screen every frame.
 *
 * `a4` is the concert-pitch reference (tuner calibration, 415–466 Hz): it drives both
 * note rounding and cents, so tuning against a non-440 pitch stays internally consistent.
 */
export function useLivePitch(band: FrequencyBand = DEFAULT_FREQUENCY_BAND, a4 = 440): LivePitch & {
  listening: boolean;
  error: string | null;
  start: () => void;
  stop: () => void;
} {
  const [pitch, setPitch] = useState<Pick<LivePitch, 'midi' | 'cents' | 'frequency'>>({
    midi: null,
    cents: 0,
    frequency: null,
  });
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outOfRange, setOutOfRange] = useState(false);
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastHeardRef = useRef(0);
  const outOfRangeRef = useRef(false);
  const stableRef = useRef<number | null>(null);
  const centsHistoryRef = useRef<number[]>([]);
  const smootherRef = useRef(createNeedleSmoother());
  const hysteresisRef = useRef(createNoteHysteresis());
  // The rAF loop reads these through refs, so callers can change instrument, range, or
  // concert pitch without tearing down and restarting the microphone stream.
  const bandRef = useRef<FrequencyBand>(band);
  const a4Ref = useRef(a4);

  const publishOutOfRange = useCallback((next: boolean) => {
    if (outOfRangeRef.current !== next) {
      outOfRangeRef.current = next;
      setOutOfRange(next);
    }
  }, []);

  useEffect(() => {
    bandRef.current = band;
  }, [band]);

  useEffect(() => {
    a4Ref.current = a4;
  }, [a4]);

  /** Clear every shaped reading — the sound is gone, so needle, label, and trace rest. */
  const clearReading = useCallback(() => {
    stableRef.current = null;
    smootherRef.current.reset();
    hysteresisRef.current.reset();
    setPitch((prev) => (prev.midi === null ? prev : { midi: null, cents: 0, frequency: null }));
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void ctxRef.current?.close();
    ctxRef.current = null;
    lastHeardRef.current = 0;
    setListening(false);
    setPitch({ midi: null, cents: 0, frequency: null });
    publishOutOfRange(false);
    stableRef.current = null;
    smootherRef.current.reset();
    hysteresisRef.current.reset();
    centsHistoryRef.current = [];
    setLevel(0);
  }, [publishOutOfRange]);

  const start = useCallback(() => {
    if (streamRef.current) return; // already running

    // `mediaDevices` only exists on secure origins; without this guard the property
    // access below throws synchronously and the caller never sees an error message.
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'This browser cannot reach a microphone here. Open Musix over https (or localhost) and try again, or interact with the screen directly instead.'
      );
      return;
    }

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

          // Input meter: the same window detection just analysed, quantised so a loud
          // signal does not turn the whole screen into a 60 fps re-render.
          const quantised = Math.round(Math.min(1, computeRms(buf) / LEVEL_FULL_SCALE) * LEVEL_STEPS) / LEVEL_STEPS;
          setLevel((prev) => (prev === quantised ? prev : quantised));

          const frequency = detectPitch(buf, ctx.sampleRate || 44100);
          const band = bandRef.current;
          const inBand = frequency > 0 && frequency > band.min && frequency < band.max;

          if (inBand) {
            publishOutOfRange(false);
            const a4Now = a4Ref.current;
            const noteFloat = 12 * Math.log2(frequency / a4Now) + 69;
            const midi = hysteresisRef.current.observe(Math.round(noteFloat));
            const cents = midi === null ? 0 : Math.round(100 * (noteFloat - midi));
            const stable = smootherRef.current.push(frequency);
            stableRef.current = stable;

            const history = centsHistoryRef.current;
            history.push(midi === null ? 0 : cents);
            if (history.length > HISTORY_CAP) history.splice(0, history.length - HISTORY_CAP);

            lastHeardRef.current = Date.now();
            setPitch((prev) =>
              midi !== null && prev.midi === midi && Math.abs(prev.cents - cents) < 2
                ? prev
                : { midi, cents, frequency }
            );
          } else if (frequency > 0) {
            // Pitched, but outside the instrument's band: hold the readout at silence
            // yet surface it, so "nothing is playing" and "something outside this
            // instrument's range is sounding" read differently. It still counts as
            // heard, so the silence window below clears the flag once the sound stops.
            lastHeardRef.current = Date.now();
            publishOutOfRange(true);
            clearReading();
          } else if (Date.now() - lastHeardRef.current > SILENCE_MS) {
            publishOutOfRange(false);
            clearReading();
          }

          frameRef.current = requestAnimationFrame(tick);
        };
        frameRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        stop();
        setError(
          'Microphone access denied or unavailable. Allow the microphone in your browser, or interact with the screen directly instead.'
        );
      });
  }, [stop, publishOutOfRange, clearReading]);

  // Unmount (screen change) always releases the mic.
  useEffect(() => stop, [stop]);

  return {
    ...pitch,
    outOfRange,
    level,
    stableRef,
    centsHistory: centsHistoryRef.current,
    listening,
    error,
    start,
    stop,
  };
}
