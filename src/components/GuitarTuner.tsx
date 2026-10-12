import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { midiToFrequency, noteNameAt } from '../utils/musicTheory';
import { soundEngine, type InstrumentType } from '../utils/audio';
import { useLivePitch } from '../utils/useLivePitch';
import {
  TUNING_FAMILIES,
  TUNING_PRESETS,
  resolveTuning,
  tuningFrequencyRange,
  TuningPreset,
  TuningStringInfo,
} from '../utils/tunings';
import {
  IN_TUNE_CENTS,
  IN_TUNE_DWELL_MS,
  centsBetween,
  centsLabel,
  meterColorState,
  meterColorValue,
  needleAngleFor,
  noteFrequency,
  stabilityLabel,
} from '../utils/tunerMeter';
import { Icon } from './Icon';

/** Base card chrome for a tuning peg; the active state is chosen at render. */
const PEG_CARD_BASE =
  'flex w-[132px] cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--accent-primary),0.6)]';
const PEG_CARD_ACTIVE =
  'border-accent bg-[rgba(var(--accent-rgb),0.14)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.18)]';
const PEG_CARD_IDLE = 'border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)]';

const INPUT_BASE =
  'rounded-lg border border-[rgba(var(--overlay-rgb),0.18)] bg-[rgba(var(--inset-rgb),0.3)] px-3 py-1.5 text-sm font-semibold text-ink outline-none focus:border-[rgba(var(--accent-primary),0.6)]';

/** How far from a string's pitch the detector may be and still count as that string. */
const MATCH_TOLERANCE_SEMITONES = 1.8;
/** Level (on the hook's 15-step scale) below which signal exists but sits under the
    0.012 RMS detection gate — the "move closer" band. */
const LEVEL_TOO_LOW = 2 / 15;
/** Concert-pitch calibration bounds (Hz). */
const A4_MIN = 415;
const A4_MAX = 466;
/** Capo frets offered. */
const CAPO_FRETS = [0, 1, 2, 3, 4, 5, 6, 7];
/** Gap between open strings while touring the tuning by ear, and how long each rings. */
const TOUR_GAP_MS = 750;
const TOUR_RING_MS = 1700;
/** Custom tunings: string count bounds and the widest playable MIDI range they allow. */
const MIN_STRINGS = 4;
const MAX_STRINGS = 8;
const MIDI_LOW = 21; // A0 — below the 5-string bass's B0
const MIDI_HIGH = 96; // C7

const SETTINGS_KEY = 'musix.tuner.settings';
const CUSTOM_KEY = 'musix.tuner.customs';

type TunerMode = 'auto' | 'manual' | 'chromatic';

interface StoredSettings {
  a4: number;
  capo: number;
}

function loadSettings(): StoredSettings {
  if (typeof localStorage === 'undefined') return { a4: 440, capo: 0 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSettings>;
      const a4 =
        typeof parsed.a4 === 'number' && parsed.a4 >= A4_MIN && parsed.a4 <= A4_MAX
          ? Math.round(parsed.a4)
          : 440;
      const capo =
        typeof parsed.capo === 'number' && CAPO_FRETS.includes(parsed.capo) ? parsed.capo : 0;
      return { a4, capo };
    }
  } catch {
    // Private mode, blocked storage, or corrupt JSON — defaults are correct anyway.
  }
  return { a4: 440, capo: 0 };
}

function isStoredPreset(value: unknown): value is TuningPreset {
  const candidate = value as Partial<TuningPreset> | null;
  return (
    !!candidate &&
    typeof candidate.name === 'string' &&
    typeof candidate.voice === 'string' &&
    Array.isArray(candidate.strings) &&
    candidate.strings.length >= MIN_STRINGS &&
    candidate.strings.length <= MAX_STRINGS &&
    candidate.strings.every(
      (string) =>
        typeof string?.number === 'number' && typeof string?.baseMidi === 'number'
    )
  );
}

function loadCustoms(): TuningPreset[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredPreset).map((preset) => ({
      ...preset,
      family: 'Custom',
      voice: preset.voice as InstrumentType,
    }));
  } catch {
    // Same storage caveats as loadSettings — a lost custom is re-creatable.
    return [];
  }
}

/**
 * Instrument tuner. The microphone runs through the shared `useLivePitch` hook — the
 * same detector the fretboard note finder and the Song Follower use — so this component
 * owns the tuning UI: meter, controls, peg headstock, and reference tones. The preset
 * table (guitar, bass, ukulele, violin, mandolin, banjo, cello + saved custom tunings)
 * lives in `src/utils/tunings.ts`; every string's note, octave, and frequency derives
 * from its MIDI number there, scaled by the A4 reference and capo chosen here.
 *
 * Meter behaviour (smoothing, note hysteresis, dwell, colour states) is pure and lives
 * in `src/utils/tunerMeter.ts` so it can be unit-tested without a microphone.
 */
export const GuitarTuner: React.FC = () => {
  const stored = useMemo(loadSettings, []);
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [mode, setMode] = useState<TunerMode>('auto');
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [activePegIndex, setActivePegIndex] = useState<number | null>(null);
  const [a4, setA4] = useState<number>(stored.a4);
  const [capo, setCapo] = useState<number>(stored.capo);
  const [customs, setCustoms] = useState<TuningPreset[]>(() => loadCustoms());
  const [confirmedTune, setConfirmedTune] = useState(false);
  const [tourPlaying, setTourPlaying] = useState(false);
  const [vibrating, setVibrating] = useState<number | null>(null);
  const [editor, setEditor] = useState<{
    open: boolean;
    editingIndex: number | null;
    name: string;
    midis: number[];
  }>({ open: false, editingIndex: null, name: '', midis: [] });
  const lastChimeTimeRef = useRef<number>(0);
  const vibTimerRef = useRef<number | null>(null);
  const tourTimersRef = useRef<number[]>([]);

  // Persist calibration and custom tunings alongside the app's other local state.
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ a4, capo }));
    } catch {
      // Storage unavailable — session behaviour is unaffected.
    }
  }, [a4, capo]);
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs));
    } catch {
      // Storage unavailable — session behaviour is unaffected.
    }
  }, [customs]);

  const presets = useMemo(() => [...TUNING_PRESETS, ...customs], [customs]);
  const families = useMemo(
    () => (customs.length > 0 ? [...TUNING_FAMILIES, 'Custom' as const] : [...TUNING_FAMILIES]),
    [customs]
  );
  const preset = presets[presetIndex] ?? presets[0]!;
  const strings: TuningStringInfo[] = useMemo(
    () => resolveTuning(preset, { a4, capo }),
    [preset, a4, capo]
  );
  const isCustomSelected = preset.family === 'Custom';

  // Detection cutoff: the mic only listens inside the band this instrument can actually
  // produce — derived from the preset's own strings in tunings.ts (an octave below its
  // lowest string up to 24 frets above its highest), so room rumble or another
  // instrument's range never drives the needle. `a4` scales detection-side note math to
  // the same reference the targets use. The hook reads both through refs, so changing
  // preset, calibration, or capo retunes everything without restarting the mic.
  const frequencyRange = useMemo(() => tuningFrequencyRange(preset), [preset]);
  const live = useLivePitch(frequencyRange, a4);
  const { listening, error: micError, start, stop, outOfRange, level, stableRef, centsHistory } =
    live;

  // The needle reads the median+EMA-smoothed frequency; the note label comes from the
  // hook's hysteresis-filtered midi. `frequency` (raw) stays on the Hz display.
  const stable = stableRef.current;
  const detected = live.midi !== null && stable !== null;
  let matchedString: TuningStringInfo | undefined;
  if (mode !== 'chromatic' && detected && stable !== null) {
    if (mode === 'auto') {
      // Nearest string within tolerance — a plain `find` would return the first of two
      // equally close strings (the ukulele's g and A sit two semitones apart).
      let bestDistance = Infinity;
      for (const candidate of strings) {
        const distance = Math.abs(12 * Math.log2(stable / candidate.frequency));
        if (distance < MATCH_TOLERANCE_SEMITONES && distance < bestDistance) {
          bestDistance = distance;
          matchedString = candidate;
        }
      }
    } else {
      matchedString = strings.find((candidate) => candidate.index === selectedStringIndex);
    }
  }

  // Off-target strings still drive the needle: against the matched string's real pitch
  // when one is known, otherwise against the displayed chromatic note.
  const centsOff =
    stable === null
      ? 0
      : matchedString
        ? centsBetween(stable, matchedString.frequency)
        : live.midi !== null
          ? centsBetween(stable, noteFrequency(live.midi, a4))
          : 0;
  const needleAngle = needleAngleFor(centsOff);
  const rawInTune = detected && Math.abs(centsOff) <= IN_TUNE_CENTS;
  const noteLabel =
    live.midi === null ? '--' : `${noteNameAt(live.midi)}${Math.floor(live.midi / 12) - 1}`;
  const colorState = meterColorState(detected, centsOff, confirmedTune);
  const needleColor = meterColorValue(colorState);
  const stability = stabilityLabel(centsHistory);

  // IN TUNE must hold for the dwell before the badge, peg ring, glow, and chime commit —
  // one lucky frame inside ±4 ¢ cannot flash a false "tuned" (mirrors the reference
  // tuner's 8-consecutive-hits sound gate).
  useEffect(() => {
    if (!rawInTune) {
      setConfirmedTune(false);
      return;
    }
    const timer = window.setTimeout(() => setConfirmedTune(true), IN_TUNE_DWELL_MS);
    return () => window.clearTimeout(timer);
  }, [rawInTune]);

  // Success chirp when a string lands in tune, rate-limited so it cannot machine-gun.
  useEffect(() => {
    if (!confirmedTune || matchedString === undefined) return;
    if (Date.now() - lastChimeTimeRef.current > 2000) {
      soundEngine.playClick(true);
      lastChimeTimeRef.current = Date.now();
    }
  }, [confirmedTune, matchedString]);

  // Highlight the peg the needle is tuning to; clear it when the sound dies away.
  useEffect(() => {
    setActivePegIndex(matchedString?.index ?? null);
  }, [matchedString]);

  const flashVibration = useCallback((index: number) => {
    setVibrating(index);
    if (vibTimerRef.current !== null) window.clearTimeout(vibTimerRef.current);
    vibTimerRef.current = window.setTimeout(() => {
      setVibrating(null);
      vibTimerRef.current = null;
    }, TOUR_RING_MS);
  }, []);

  const stopTour = useCallback(() => {
    tourTimersRef.current.forEach((id) => window.clearTimeout(id));
    tourTimersRef.current = [];
    setTourPlaying(false);
  }, []);

  // Unmount always stops the scheduled tour and the vibration flash.
  useEffect(
    () => () => {
      tourTimersRef.current.forEach((id) => window.clearTimeout(id));
      if (vibTimerRef.current !== null) window.clearTimeout(vibTimerRef.current);
    },
    []
  );

  const startTour = () => {
    stopTour();
    setTourPlaying(true);
    const ordered = [...strings].sort((left, right) => left.frequency - right.frequency);
    ordered.forEach((string, position) => {
      const id = window.setTimeout(() => {
        soundEngine.playNote(string.frequency, 1.5, preset.voice);
        flashVibration(string.index);
        if (position === ordered.length - 1) {
          const endId = window.setTimeout(() => setTourPlaying(false), TOUR_RING_MS);
          tourTimersRef.current.push(endId);
        }
      }, position * TOUR_GAP_MS);
      tourTimersRef.current.push(id);
    });
  };

  const handlePegClick = (string: TuningStringInfo) => {
    stopTour();
    setSelectedStringIndex(string.index);
    setActivePegIndex(string.index);
    // Manual picking always locks to the clicked string.
    setMode('manual');
    flashVibration(string.index);
    soundEngine.playNote(string.frequency, 2.5, preset.voice);
  };

  const handlePresetChange = (index: number) => {
    stopTour();
    setPresetIndex(index);
    // A locked string number from the previous instrument means nothing on the new one.
    setSelectedStringIndex(null);
    setEditor((current) => ({ ...current, open: false, editingIndex: null }));
  };

  // ── Custom tuning editor ──
  const openNewEditor = () => {
    stopTour();
    setEditor({
      open: true,
      editingIndex: null,
      name: '',
      midis: preset.strings.map((string) => string.baseMidi),
    });
  };

  const openEditEditor = () => {
    const editingIndex = presetIndex - TUNING_PRESETS.length;
    if (editingIndex < 0 || editingIndex >= customs.length) return;
    stopTour();
    setEditor({
      open: true,
      editingIndex,
      name: preset.name,
      midis: preset.strings.map((string) => string.baseMidi),
    });
  };

  const stepMidi = (index: number, delta: number) =>
    setEditor((current) => {
      const midis = [...current.midis];
      const next = (midis[index] ?? 60) + delta;
      midis[index] = Math.max(MIDI_LOW, Math.min(MIDI_HIGH, next));
      return { ...current, midis };
    });

  const removeRow = (index: number) =>
    setEditor((current) =>
      current.midis.length <= MIN_STRINGS
        ? current
        : { ...current, midis: current.midis.filter((_, position) => position !== index) }
    );

  const addRow = () =>
    setEditor((current) => {
      if (current.midis.length >= MAX_STRINGS) return current;
      const highest = current.midis.reduce((top, midi) => Math.max(top, midi), MIDI_LOW);
      return { ...current, midis: [...current.midis, Math.min(MIDI_HIGH, highest + 5)] };
    });

  const saveEditor = () => {
    const name = editor.name.trim() || `Custom ${editor.midis.length}-String`;
    const built: TuningPreset = {
      name,
      family: 'Custom',
      voice: 'acoustic-guitar',
      // Guitar-style numbering: the low string counts highest. MIDI order is kept as
      // entered, so reentrant layouts are allowed — same rule as the static table.
      strings: editor.midis.map((baseMidi, position) => ({
        number: editor.midis.length - position,
        baseMidi,
      })),
    };
    const matchIndex =
      editor.editingIndex !== null && editor.editingIndex < customs.length
        ? editor.editingIndex
        : customs.findIndex((existing) => existing.name === name);
    const slot = matchIndex >= 0 ? matchIndex : customs.length;
    const next = [...customs];
    next[slot] = built;
    setCustoms(next);
    setPresetIndex(TUNING_PRESETS.length + slot);
    setEditor({ open: false, editingIndex: null, name: '', midis: [] });
  };

  const deleteEditorPreset = () => {
    const index = editor.editingIndex;
    if (index === null) return;
    const next = customs.filter((_, position) => position !== index);
    setCustoms(next);
    setEditor({ open: false, editingIndex: null, name: '', midis: [] });
    setPresetIndex((current) => {
      if (current < TUNING_PRESETS.length) return current;
      return current - TUNING_PRESETS.length < next.length ? current : 0;
    });
  };

  const renderPeg = (string: TuningStringInfo) => {
    const isActive = activePegIndex === string.index;
    const isTarget = matchedString?.index === string.index;
    const label = (
      <div className="flex flex-col text-center text-[0.72rem] leading-[1.3] text-ink-muted">
        <span className="text-xs font-bold text-ink">String {string.index}</span>
        <span className="text-[11px] text-ink-muted">{string.frequency} Hz</span>
      </div>
    );
    const puck = (
      <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[rgba(var(--accent-primary),0.6)] bg-[rgba(var(--accent-rgb),0.16)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)]">
        <span className="text-lg font-bold text-accent">{string.note}</span>
      </div>
    );
    return (
      <div
        key={string.index}
        className={`${PEG_CARD_BASE} ${isActive ? PEG_CARD_ACTIVE : PEG_CARD_IDLE}`}
        // In tune gets the success ring inline: two competing border utilities would
        // resolve by Tailwind's alphabetical compile order, not by intent.
        style={isTarget && confirmedTune ? { borderColor: 'var(--accent-success)' } : undefined}
        data-tip={`${preset.family} · string ${string.index} (${string.note}${string.octave}) — plays the reference tone at ${string.frequency} Hz and locks the meter to this string`}
        role="button"
        tabIndex={0}
        aria-label={`Play the reference tone for string ${string.index}, ${string.note}${string.octave}`}
        aria-pressed={selectedStringIndex === string.index}
        onClick={() => handlePegClick(string)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handlePegClick(string);
          }
        }}
      >
        {string.side === 'left' ? (
          <>
            {label}
            {puck}
          </>
        ) : (
          <>
            {puck}
            {label}
          </>
        )}
      </div>
    );
  };

  const leftPegs = strings.filter((string) => string.side === 'left');
  const rightPegs = strings.filter((string) => string.side === 'right');

  // Sparkline: the last ~2 s of cents against the displayed note, clamped to the
  // needle's ±50 ¢ window so the trace reads as "how much is the pitch wandering".
  const trace = centsHistory.slice(-120);
  const sparkPoints = trace
    .map((cents, index) => {
      const x = trace.length > 1 ? (index / (trace.length - 1)) * 240 : 0;
      const clamped = Math.max(-50, Math.min(50, cents));
      return `${x.toFixed(1)},${(16 - (clamped / 50) * 14).toFixed(1)}`;
    })
    .join(' ');

  const stabilityChip =
    stability === null ? null : stability === 'steady'
      ? { text: 'steady', cls: 'border-success bg-[rgba(var(--success-rgb),0.15)] text-success' }
      : stability === 'moving'
        ? { text: 'moving', cls: 'border-[rgba(var(--overlay-rgb),0.25)] bg-[rgba(var(--inset-rgb),0.25)] text-ink-muted' }
        : { text: 'unstable', cls: 'border-alert bg-[rgba(var(--alert-rgb),0.15)] text-alert' };

  return (
    <div className="glass-card flex flex-col gap-6">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="section-badge inline-flex items-center gap-1.5 bg-[rgba(var(--accent-rgb),0.16)] text-accent">
            <Icon name="target" /> Visual Pitch Engine
          </span>
          <h2>Instrument Tuner</h2>
          <p>
            Tune guitar, bass, ukulele, violin, mandolin, banjo, or cello — pick a tuning,
            then follow the needle. Click any string to hear its reference tone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            className="select-input font-bold text-accent"
            value={presetIndex}
            title={`Instrument and tuning — sets the pitch every string should match; the meter only listens from ${Math.round(frequencyRange.min)} to ${Math.round(frequencyRange.max)} Hz`}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (value === -1) {
                openNewEditor();
                return;
              }
              handlePresetChange(value);
            }}
          >
            {families.map((family) => (
              <optgroup key={family} label={family}>
                {presets.map((candidate, index) =>
                  candidate.family === family ? (
                    <option key={candidate.name} value={index}>
                      {candidate.name}
                    </option>
                  ) : null
                )}
              </optgroup>
            ))}
            <option value={-1}>＋ New custom tuning…</option>
          </select>

          {isCustomSelected && (
            <button
              type="button"
              className="btn btn-outline"
              data-tip="Edit or delete this custom tuning"
              aria-label="Edit this custom tuning"
              onClick={openEditEditor}
            >
              <Icon name="pencil" />
            </button>
          )}

          {!listening ? (
            <button
              className="btn btn-accent"
              data-tip="Listen through the microphone and draw your pitch on the meter"
              onClick={start}
            >
              <Icon name="mic" /> Enable Microphone
            </button>
          ) : (
            <button
              className="btn btn-danger"
              data-tip="Stop listening and release the microphone"
              onClick={stop}
            >
              <Icon name="stop" /> Stop Mic
            </button>
          )}
        </div>
      </div>

      {/* Controls: detection mode, concert pitch, capo, by-ear tour */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex gap-1.5" role="group" aria-label="Detection mode">
          <button
            type="button"
            className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-outline'}`}
            data-tip="Auto: the meter follows whichever string you pluck"
            aria-pressed={mode === 'auto'}
            onClick={() => setMode('auto')}
          >
            <Icon name="zap" /> Auto
          </button>
          <button
            type="button"
            className={`btn ${mode === 'manual' ? 'btn-primary' : 'btn-outline'}`}
            data-tip="Manual: locked to one string — click a peg to pick it"
            aria-pressed={mode === 'manual'}
            onClick={() => setMode('manual')}
          >
            <Icon name="lock" /> Manual
          </button>
          <button
            type="button"
            className={`btn ${mode === 'chromatic' ? 'btn-primary' : 'btn-outline'}`}
            data-tip="Chromatic: ignore strings and read any pitch like a handheld tuner"
            aria-pressed={mode === 'chromatic'}
            onClick={() => setMode('chromatic')}
          >
            <Icon name="notes" /> Chromatic
          </button>
        </div>

        <div
          className="flex items-center gap-1 rounded-xl border border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)] px-1.5 py-1"
          data-tip="Concert reference — every target pitch scales with it (415–466 Hz, A = 440 by default)"
        >
          <button
            type="button"
            className="btn btn-outline px-2 py-0.5 text-sm"
            aria-label={`Lower the A4 reference below ${a4} Hz`}
            onClick={() => setA4((value) => Math.max(A4_MIN, value - 1))}
          >
            −
          </button>
          <span className="min-w-[78px] text-center text-xs font-bold text-accent">
            A = {a4} Hz
          </span>
          <button
            type="button"
            className="btn btn-outline px-2 py-0.5 text-sm"
            aria-label={`Raise the A4 reference above ${a4} Hz`}
            onClick={() => setA4((value) => Math.min(A4_MAX, value + 1))}
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)] px-2.5 py-1.5 text-xs font-bold text-ink-muted">
          <span>Capo</span>
          <select
            className="select-input py-0.5 text-xs font-bold"
            value={capo}
            data-tip="Shift every target up this many frets — the note names follow"
            aria-label="Capo fret"
            onChange={(event) => setCapo(Number(event.target.value))}
          >
            {CAPO_FRETS.map((fret) => (
              <option key={fret} value={fret}>
                {fret === 0 ? 'None' : `Fret ${fret}`}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className={`btn ${tourPlaying ? 'btn-danger' : 'btn-outline'}`}
          data-tip="Play every open string in order, low to high"
          onClick={() => (tourPlaying ? stopTour() : startTour())}
        >
          {tourPlaying ? (
            <>
              <Icon name="stop" /> Stop
            </>
          ) : (
            <>
              <Icon name="play" /> Hear tuning
            </>
          )}
        </button>
      </div>

      {/* Custom tuning editor */}
      {editor.open && (
        <div className="flex flex-col gap-3 rounded-xl border border-[rgba(var(--accent-primary),0.35)] bg-[rgba(var(--inset-rgb),0.25)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="section-badge inline-flex items-center gap-1.5 bg-[rgba(var(--accent-rgb),0.16)] text-accent">
              <Icon name="pencil" />{' '}
              {editor.editingIndex !== null ? 'Edit custom tuning' : 'New custom tuning'}
            </span>
            <button
              type="button"
              className="btn btn-outline"
              aria-label="Close the custom tuning editor"
              onClick={() => setEditor({ open: false, editingIndex: null, name: '', midis: [] })}
            >
              <Icon name="close" />
            </button>
          </div>

          <label className="flex items-center gap-3 text-xs font-bold text-ink-muted">
            <span className="w-16">Name</span>
            <input
              className={`${INPUT_BASE} flex-1`}
              value={editor.name}
              placeholder={`Custom ${editor.midis.length}-String`}
              maxLength={40}
              onChange={(event) =>
                setEditor((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>

          <div className="flex flex-col gap-1.5">
            {[...editor.midis].map((_, row) => editor.midis.length - 1 - row).map((index) => {
              const midi = editor.midis[index] ?? 60;
              return (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-lg border border-[rgba(var(--overlay-rgb),0.12)] bg-[rgba(var(--inset-rgb),0.2)] px-2.5 py-1.5"
                >
                  <span className="w-16 text-xs font-bold text-ink">
                    String {editor.midis.length - index}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline px-2 py-0 text-sm"
                    aria-label={`Lower string ${editor.midis.length - index} by one semitone`}
                    onClick={() => stepMidi(index, -1)}
                  >
                    −
                  </button>
                  <span className="min-w-[128px] text-center text-xs font-bold text-accent">
                    {noteNameAt(midi)}
                    {Math.floor(midi / 12) - 1} · {midiToFrequency(midi).toFixed(1)} Hz
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline px-2 py-0 text-sm"
                    aria-label={`Raise string ${editor.midis.length - index} by one semitone`}
                    onClick={() => stepMidi(index, 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline ml-auto px-2 py-0"
                    disabled={editor.midis.length <= MIN_STRINGS}
                    aria-label={`Remove string ${editor.midis.length - index}`}
                    onClick={() => removeRow(index)}
                  >
                    <Icon name="close" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className="btn btn-outline"
              disabled={editor.midis.length >= MAX_STRINGS}
              onClick={addRow}
            >
              <Icon name="plus" /> Add string
            </button>
            <div className="ml-auto flex items-center gap-2.5">
              {editor.editingIndex !== null && (
                <button className="btn btn-danger" onClick={deleteEditorPreset}>
                  Delete
                </button>
              )}
              <button
                className="btn btn-outline"
                onClick={() =>
                  setEditor({ open: false, editingIndex: null, name: '', midis: [] })
                }
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEditor}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {micError && (
        <div className="flex animate-[mic-banner-in_0.25s_ease] items-center gap-2 rounded-xl border border-[rgba(var(--alert-rgb),0.35)] bg-[rgba(var(--alert-rgb),0.14)] px-3.5 py-2.5 text-[0.88rem] font-semibold text-ink">
          <Icon name="alert" className="shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main Layout: Arc Meter Top + Headstock Below */}
      <div className="flex flex-col items-center gap-8 py-4">
        {/* 1. Arc meter on its stage — flat/sharp zone gradient, ticks that warm with
            their side, and a marker riding the track. The readout sits inside the arc;
            the status badge, level meter, and stability trace are rows below, so nothing
            crowds the track tips. */}
        <div className="tuna-arc-gauge">
          <svg viewBox="0 0 300 160" className="arc-svg" aria-hidden="true">
            <defs>
              {/* Flat side warms toward the highlight colour, sharp side toward alert,
                  with a neutral shoulder near the in-tune centre. Stops read theme
                  tokens through style (never presentation attributes), so every theme
                  paints its own zones. */}
              <linearGradient
                id="tuner-zone"
                gradientUnits="userSpaceOnUse"
                x1="30"
                y1="0"
                x2="270"
                y2="0"
              >
                <stop offset="0" style={{ stopColor: 'rgba(var(--highlight-rgb), 0.55)' }} />
                <stop offset="0.42" style={{ stopColor: 'rgba(var(--overlay-rgb), 0.12)' }} />
                <stop offset="0.58" style={{ stopColor: 'rgba(var(--overlay-rgb), 0.12)' }} />
                <stop offset="1" style={{ stopColor: 'rgba(var(--alert-rgb), 0.55)' }} />
              </linearGradient>
            </defs>

            {/* Arc Track */}
            <path
              d="M 30 140 A 120 120 0 0 1 270 140"
              fill="none"
              stroke="url(#tuner-zone)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* In-Tune Center Target Segment — glows once the dwell confirms the pitch */}
            <path
              d="M 140 22 A 120 120 0 0 1 160 22"
              fill="none"
              style={{
                stroke: confirmedTune ? 'var(--accent-success)' : 'rgba(var(--success-rgb), 0.4)',
                filter: confirmedTune
                  ? 'drop-shadow(0 0 6px rgba(var(--success-rgb), 0.7))'
                  : undefined,
              }}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Ticks — angles are degrees from straight up, so negatives are valid and
                must stay negative; masking them used to fling the flat-side ticks
                below the arc. Flat side warms to the highlight colour, sharp side to
                alert; the centre tick stays the in-tune colour. */}
            {[-40, -25, -10, 0, 10, 25, 40].map((deg) => {
              const rad = ((deg - 90) * Math.PI) / 180;
              const x1 = 150 + 105 * Math.cos(rad);
              const y1 = 140 + 105 * Math.sin(rad);
              const x2 = 150 + 120 * Math.cos(rad);
              const y2 = 140 + 120 * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={deg === 0 ? '3' : '2'}
                  strokeLinecap="round"
                  style={{
                    stroke:
                      deg === 0
                        ? 'var(--accent-success)'
                        : deg < 0
                          ? 'rgba(var(--highlight-rgb), 0.5)'
                          : 'rgba(var(--alert-rgb), 0.5)',
                  }}
                />
              );
            })}

            {/* Needle marker — a glowing capsule riding the track plus a faint spoke to
                the hub, driven by the smoothed frequency (tunerMeter) so a single noisy
                frame cannot yank it. The spoke stays at 18% so the note readout inside
                the arc remains the loudest thing on the stage. */}
            <g transform={`rotate(${needleAngle}, 150, 140)`} className="arc-needle-line">
              <line
                x1="150"
                y1="140"
                x2="150"
                y2="34"
                strokeWidth="2"
                opacity="0.18"
                style={{ stroke: needleColor }}
              />
              <line
                x1="150"
                y1="6"
                x2="150"
                y2="34"
                strokeWidth="5"
                strokeLinecap="round"
                className="arc-needle-line"
                style={{
                  stroke: needleColor,
                  filter: `drop-shadow(0 0 6px ${needleColor})`,
                }}
              />
            </g>
            <circle
              cx="150"
              cy="140"
              r="7"
              style={{
                fill: 'rgba(var(--inset-rgb),0.9)',
                stroke: needleColor,
                strokeWidth: 2,
              }}
            />
          </svg>

          {/* Note & Pitch Center Readout — inside the arc, clear of the marker track */}
          <div className="absolute inset-x-0 top-[64px] flex flex-col items-center px-6 text-center">
            <div className="font-display text-[56px] font-extrabold leading-none text-accent [text-shadow:0_0_20px_rgba(var(--accent-rgb),0.5)]">
              {noteLabel}
            </div>
            {detected && (
              <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-display text-sm text-ink-soft">
                <span>
                  {live.frequency !== null ? live.frequency.toFixed(1) : '--'} Hz ·{' '}
                  {centsLabel(centsOff)}
                </span>
                {stabilityChip && (
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${stabilityChip.cls}`}
                    data-tip="How much the pitch has wandered over the last two seconds — hold steadier for an easier read"
                  >
                    {stabilityChip.text}
                  </span>
                )}
              </div>
            )}
            {matchedString && (
              <div className="mt-0.5 text-[11px] font-semibold text-ink-muted">
                Tuning to string {matchedString.index} ({matchedString.note}
                {matchedString.octave}) · {matchedString.frequency} Hz
              </div>
            )}
          </div>

          {/* Screen-reader readout — coarse cents (5 ¢ steps) so the live region does
              not chatter on every frame. */}
          <div className="sr-only" aria-live="polite">
            {detected
              ? `${noteLabel}, ${centsLabel(Math.round(centsOff / 5) * 5)}${confirmedTune ? ', in tune' : ''}`
              : listening
                ? 'no pitch detected'
                : ''}
          </div>

          {/* Status badge — its own row under the arc so it never crowds the tips */}
          <div className="mt-2 flex min-h-[30px] justify-center">
            {!detected && outOfRange ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-alert bg-[rgba(var(--alert-rgb),0.2)] px-3.5 py-1 text-[13px] font-bold text-alert"
                data-tip={`Heard a pitched sound outside the band this ${preset.family.toLowerCase()} preset listens for (${Math.round(frequencyRange.min)}–${Math.round(frequencyRange.max)} Hz) — switch instrument or tune manually`}
              >
                <Icon name="alert" /> OUT OF RANGE · {Math.round(frequencyRange.min)}–
                {Math.round(frequencyRange.max)} Hz
              </span>
            ) : !detected ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--overlay-rgb),0.2)] bg-[rgba(var(--inset-rgb),0.25)] px-3.5 py-1 text-[13px] font-bold text-ink-muted">
                {listening ? 'Play a string to begin' : 'Mic off — enable to tune by ear'}
              </span>
            ) : confirmedTune ? (
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

          {/* Input level — same RMS the detector gated on. Signal present but under the
              gate gets a "too low" nudge; plain silence says nothing (you may simply
              not be playing). */}
          {listening && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                input
              </span>
              <div className="h-1.5 w-36 overflow-hidden rounded-full border border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--inset-rgb),0.4)]">
                <div
                  className="h-full rounded-full transition-[width] duration-100"
                  style={{
                    width: `${Math.round(level * 100)}%`,
                    background:
                      level > 0 && level < LEVEL_TOO_LOW
                        ? 'var(--accent-alert)'
                        : 'var(--accent-primary)',
                  }}
                />
              </div>
              {level > 0 && level < LEVEL_TOO_LOW && (
                <span className="text-[10px] font-bold text-alert">signal too low</span>
              )}
            </div>
          )}

          {/* Stability trace — last ~2 s of cents vs the displayed note */}
          {listening && trace.length > 3 && (
            <svg
              viewBox="0 0 240 32"
              className="mt-1.5 h-8 w-full max-w-[300px]"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="16"
                x2="240"
                y2="16"
                stroke="rgba(var(--overlay-rgb), 0.15)"
                strokeWidth="1"
              />
              <polyline
                points={sparkPoints}
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                style={{ stroke: needleColor }}
              />
            </svg>
          )}
        </div>

        {/* 2. Visual Headstock with interactive tuning pegs flanking the wood — the
            columns adapt to the preset's string count (4, 5, 6, 7, or 8). */}
        <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 px-0.5 pt-1.5 pb-2">
          {/* Left peg column */}
          <div className="flex flex-col items-center gap-3">{leftPegs.map(renderPeg)}</div>

          {/* Headstock Graphic Body */}
          <div className="headstock-graphic">
            <div className="headstock-top-crown" />
            <div className="headstock-wood-body">
              <span className="headstock-logo">Musix</span>
              <div className="nut-bar" />
              {/* String Lines running down — they wiggle while a reference tone or the
                  tuning tour rings that string */}
              <div className="headstock-strings-layer">
                {strings.map((string) => (
                  <div
                    key={string.index}
                    className={`headstock-string-wire ${activePegIndex === string.index ? 'active-wire' : ''} ${vibrating === string.index ? 'vibrating' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right peg column */}
          <div className="flex flex-col items-center gap-3">{rightPegs.map(renderPeg)}</div>
        </div>
      </div>
    </div>
  );
};
