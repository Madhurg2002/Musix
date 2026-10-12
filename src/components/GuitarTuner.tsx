import React, { useEffect, useRef, useState } from 'react';
import { noteNameAt } from '../utils/musicTheory';
import { soundEngine } from '../utils/audio';
import { useLivePitch } from '../utils/useLivePitch';
import {
  TUNING_FAMILIES,
  TUNING_PRESETS,
  resolveTuning,
  TuningStringInfo,
} from '../utils/tunings';
import { Icon } from './Icon';

/** Base card chrome for a tuning peg; the active state is chosen at render. */
const PEG_CARD_BASE =
  'flex w-[132px] cursor-pointer flex-col items-center gap-1 rounded-xl border p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(var(--accent-primary),0.6)]';
const PEG_CARD_ACTIVE =
  'border-accent bg-[rgba(var(--accent-rgb),0.14)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.18)]';
const PEG_CARD_IDLE = 'border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)]';

/** Cents (+ sharp, − flat) of `frequency` against a target pitch. */
function centsBetween(frequency: number, target: number): number {
  return Math.round(1200 * Math.log2(frequency / target));
}

/** Display form for a cents offset: `+12 ¢`, `−3 ¢`, or `0 ¢` (U+2212 is the real minus). */
function centsLabel(cents: number): string {
  if (cents === 0) return '0 ¢';
  return `${cents > 0 ? '+' : '−'}${Math.abs(cents)} ¢`;
}

/** How far from a string's pitch the detector may be and still count as that string. */
const MATCH_TOLERANCE_SEMITONES = 1.8;

/**
 * Instrument tuner. The microphone runs through the shared `useLivePitch` hook — the
 * same detector the fretboard note finder and the Song Follower use — so this component
 * owns only the tuning UI: which string the needle is tuning to, the peg headstock, and
 * the reference tones. The preset table (guitar, bass, ukulele, violin) lives in
 * `src/utils/tunings.ts`; every string's note, octave, and frequency derive from its MIDI
 * number there.
 */
export const GuitarTuner: React.FC = () => {
  const [presetIndex, setPresetIndex] = useState<number>(0);
  const [autoDetectMode, setAutoDetectMode] = useState<boolean>(true);
  const [selectedStringIndex, setSelectedStringIndex] = useState<number | null>(null);
  const [activePegIndex, setActivePegIndex] = useState<number | null>(null);
  const lastChimeTimeRef = useRef<number>(0);

  const live = useLivePitch();
  const { listening, error: micError, start, stop } = live;

  const preset = TUNING_PRESETS[presetIndex] ?? TUNING_PRESETS[0]!;
  const strings: TuningStringInfo[] = resolveTuning(preset);

  // The needle retunes to whichever string the pitch belongs to: auto mode matches the
  // nearest string within ~1.8 semitones, manual mode follows the locked peg. Derived
  // each render so a preset change re-resolves it.
  const frequency = live.frequency;
  let matchedString: TuningStringInfo | undefined;
  if (live.midi !== null && frequency !== null) {
    if (autoDetectMode) {
      // Nearest string within tolerance — a plain `find` would return the first of two
      // equally close strings (the ukulele's g and A sit two semitones apart).
      let bestDistance = Infinity;
      for (const candidate of strings) {
        const distance = Math.abs(12 * Math.log2(frequency / candidate.frequency));
        if (distance < MATCH_TOLERANCE_SEMITONES && distance < bestDistance) {
          bestDistance = distance;
          matchedString = candidate;
        }
      }
    } else {
      matchedString = strings.find((candidate) => candidate.index === selectedStringIndex);
    }
  }

  // Off-target strings still need a needle: against the matched string's real pitch when
  // one is known, otherwise against the nearest chromatic note the detector reported.
  const centsOff = frequency === null
    ? 0
    : matchedString
      ? centsBetween(frequency, matchedString.frequency)
      : live.cents;
  const needleAngle = Math.min(Math.max((centsOff / 50) * 45, -45), 45);
  const detected = live.midi !== null && frequency !== null;
  const inTune = detected && Math.abs(centsOff) <= 4;
  const noteLabel =
    live.midi === null ? '--' : `${noteNameAt(live.midi)}${Math.floor(live.midi / 12) - 1}`;

  // Highlight the peg the needle is tuning to; clear it when the sound dies away.
  useEffect(() => {
    setActivePegIndex(matchedString?.index ?? null);
  }, [matchedString]);

  // Success chirp when a string lands in tune, rate-limited so it cannot machine-gun.
  useEffect(() => {
    if (!inTune || matchedString === undefined) return;
    if (Date.now() - lastChimeTimeRef.current > 2000) {
      soundEngine.playClick(true);
      lastChimeTimeRef.current = Date.now();
    }
  }, [inTune, matchedString]);

  const handlePegClick = (string: TuningStringInfo) => {
    setSelectedStringIndex(string.index);
    setActivePegIndex(string.index);
    // Manual picking always locks to the clicked string.
    setAutoDetectMode(false);
    soundEngine.playNote(string.frequency, 2.5, preset.voice);
  };

  const handlePresetChange = (index: number) => {
    setPresetIndex(index);
    // A locked string number from the previous instrument means nothing on the new one.
    setSelectedStringIndex(null);
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
        style={isTarget && inTune ? { borderColor: 'var(--accent-success)' } : undefined}
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
            Tune guitar, bass, ukulele, or violin — pick a tuning, then follow the needle.
            Click any string to hear its reference tone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="select-input font-bold text-accent"
            value={presetIndex}
            title="Instrument and tuning — sets the pitch every string should match"
            onChange={(event) => handlePresetChange(Number(event.target.value))}
          >
            {TUNING_FAMILIES.map((family) => (
              <optgroup key={family} label={family}>
                {TUNING_PRESETS.map((candidate, index) =>
                  candidate.family === family ? (
                    <option key={candidate.name} value={index}>
                      {candidate.name}
                    </option>
                  ) : null
                )}
              </optgroup>
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

      {micError && (
        <div className="flex animate-[mic-banner-in_0.25s_ease] items-center gap-2 rounded-xl border border-[rgba(var(--alert-rgb),0.35)] bg-[rgba(var(--alert-rgb),0.14)] px-3.5 py-2.5 text-[0.88rem] font-semibold text-ink">
          <Icon name="alert" className="shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main Layout: Arc Meter Top + Headstock Below */}
      <div className="flex flex-col items-center gap-8 py-4">
        {/* 1. Curved Arc Meter Gauge */}
        <div className="tuna-arc-gauge">
          <svg viewBox="0 0 300 160" className="arc-svg" aria-hidden="true">
            {/* Arc Track */}
            <path
              d="M 30 140 A 120 120 0 0 1 270 140"
              fill="none"
              stroke="rgba(var(--overlay-rgb), 0.12)"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* In-Tune Center Target Segment */}
            <path
              d="M 140 22 A 120 120 0 0 1 160 22"
              fill="none"
              style={{
                stroke: inTune ? 'var(--accent-success)' : 'rgba(var(--success-rgb), 0.4)',
              }}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Ticks — angles are degrees from straight up, so negatives are valid and
                must stay negative; masking them used to fling the flat-side ticks
                below the arc. */}
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
                  stroke={deg === 0 ? 'var(--accent-success)' : 'rgba(var(--overlay-rgb), 0.3)'}
                  strokeWidth={deg === 0 ? '3' : '1.5'}
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
                style={{
                  stroke: !detected
                    ? 'rgba(var(--overlay-rgb), 0.35)'
                    : inTune
                      ? 'var(--accent-success)'
                      : centsOff < 0
                        ? 'var(--accent-highlight)'
                        : 'var(--accent-alert)',
                }}
                strokeWidth="4"
                strokeLinecap="round"
                className="arc-needle-line"
              />
              <circle cx="150" cy="140" r="8" style={{ fill: 'var(--text-primary)' }} />
            </g>
          </svg>

          {/* Note & Pitch Center Readout */}
          <div className="absolute bottom-2.5 flex flex-col items-center text-center">
            <div className="font-display text-[56px] font-extrabold leading-none text-accent [text-shadow:0_0_20px_rgba(var(--accent-rgb),0.5)]">
              {noteLabel}
            </div>
            {detected && (
              <div className="mt-0.5 font-display text-sm text-ink-soft">
                {frequency.toFixed(1)} Hz · {centsLabel(centsOff)}
              </div>
            )}
            {matchedString && (
              <div className="mt-0.5 text-[11px] font-semibold text-ink-muted">
                Tuning to string {matchedString.index} ({matchedString.note}
                {matchedString.octave}) · {matchedString.frequency} Hz
              </div>
            )}
            <div className="mt-2 min-h-[30px]">
              {!detected ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(var(--overlay-rgb),0.2)] bg-[rgba(var(--inset-rgb),0.25)] px-3.5 py-1 text-[13px] font-bold text-ink-muted">
                  {listening ? 'Play a string to begin' : 'Mic off — enable to tune by ear'}
                </span>
              ) : inTune ? (
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

        {/* 2. Visual Headstock with interactive tuning pegs flanking the wood — the
            columns adapt to the preset's string count (4, 5, or 6). */}
        <div className="flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 px-0.5 pt-1.5 pb-2">
          {/* Left peg column */}
          <div className="flex flex-col items-center gap-3">{leftPegs.map(renderPeg)}</div>

          {/* Headstock Graphic Body */}
          <div className="headstock-graphic">
            <div className="headstock-top-crown" />
            <div className="headstock-wood-body">
              <span className="headstock-logo">Musix</span>
              <div className="nut-bar" />
              {/* String Lines running down */}
              <div className="headstock-strings-layer">
                {strings.map((string) => (
                  <div
                    key={string.index}
                    className={`headstock-string-wire ${activePegIndex === string.index ? 'active-wire' : ''}`}
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
