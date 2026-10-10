import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../utils/audio';
import {
  SAMPLE_CHART,
  chordFrequencies,
  parseChordChart,
  parseChordSymbol,
  transposeChordToken,
  type ParsedChart,
} from '../utils/chordChart';
import {
  PREFERENCE_KEYS,
  isBoolean,
  isIntegerInRange,
  isOneOfValue,
  isText,
  readPreference,
  writePreference,
} from '../utils/preferences';
import { Icon } from './Icon';

const BEATS_PER_CHORD_OPTIONS = [1, 2, 4] as const;
const EMPTY_CHART: ParsedChart = { lines: [], chords: [], unique: [], sections: 0 };

const isBeatsPerChord = isOneOfValue(BEATS_PER_CHORD_OPTIONS);
const isBpm = isIntegerInRange(40, 200);
const isTranspose = isIntegerInRange(-11, 11);

/**
 * Follow a song from a pasted chord chart.
 *
 * Ultimate Guitar cannot be fetched from the browser (their pages are not CORS-enabled and
 * scraping is disallowed by their terms), so the learner pastes the chart they are already
 * reading and the follower walks them through it: it highlights the current chord, plays it
 * with the selected instrument, and can transpose the whole song into a friendlier key.
 */
export const SongFollower: React.FC = () => {
  // A chart pasted in a previous session comes back already loaded, so practising a song is
  // not a re-paste every time the page reloads.
  const savedChart = useMemo(
    () => readPreference(PREFERENCE_KEYS.songChart, '', isText),
    []
  );

  const [draft, setDraft] = useState<string>(savedChart);
  const [chart, setChart] = useState<ParsedChart>(() =>
    savedChart ? parseChordChart(savedChart) : EMPTY_CHART
  );
  const [source, setSource] = useState<string>(savedChart);

  const [bpm, setBpm] = useState<number>(() => readPreference(PREFERENCE_KEYS.songBpm, 80, isBpm));
  const [beatsPerChord, setBeatsPerChord] = useState<number>(() =>
    readPreference(PREFERENCE_KEYS.songBeatsPerChord, 4, isBeatsPerChord)
  );
  const [transpose, setTranspose] = useState<number>(() =>
    readPreference(PREFERENCE_KEYS.songTranspose, 0, isTranspose)
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [soundOn, setSoundOn] = useState<boolean>(() =>
    readPreference(PREFERENCE_KEYS.songSoundOn, true, isBoolean)
  );

  // Mirror the practice settings back to storage.
  useEffect(() => writePreference(PREFERENCE_KEYS.songBpm, bpm), [bpm]);
  useEffect(
    () => writePreference(PREFERENCE_KEYS.songBeatsPerChord, beatsPerChord),
    [beatsPerChord]
  );
  useEffect(() => writePreference(PREFERENCE_KEYS.songTranspose, transpose), [transpose]);
  useEffect(() => writePreference(PREFERENCE_KEYS.songSoundOn, soundOn), [soundOn]);

  const activeChordRef = useRef<HTMLElement | null>(null);

  // Where each chord lives in the rendered lines, so playback can highlight the right chip.
  const timeline = useMemo(() => {
    const entries: { lineIndex: number; chordIndex: number }[] = [];
    chart.lines.forEach((line, lineIndex) => {
      line.chords.forEach((_, chordIndex) => entries.push({ lineIndex, chordIndex }));
    });
    return entries;
  }, [chart]);

  const total = chart.chords.length;
  const currentToken = total > 0 ? chart.chords[Math.min(position, total - 1)] ?? null : null;
  const currentEntry = timeline[Math.min(position, timeline.length - 1)] ?? null;

  const loadChart = useCallback((text: string) => {
    const parsed = parseChordChart(text);
    setChart(parsed);
    setSource(text);
    setPosition(0);
    setIsPlaying(false);
    if (parsed.chords.length > 0) {
      writePreference(PREFERENCE_KEYS.songChart, text);
    }
  }, []);

  const playChordAt = useCallback(
    (index: number) => {
      if (!soundOn) return;
      const token = chart.chords[index];
      if (!token) return;
      const symbol = parseChordSymbol(token);
      if (!symbol) return;
      soundEngine.strumChord(chordFrequencies(symbol, transpose), 0.06);
    },
    [chart.chords, soundOn, transpose],
  );

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      const wrapped = ((index % total) + total) % total;
      setPosition(wrapped);
      playChordAt(wrapped);
    },
    [playChordAt, total],
  );

  // Advance the follower. One chord per `beatsPerChord` beats at the chosen tempo.
  useEffect(() => {
    if (!isPlaying || total === 0) return;

    const intervalMs = (60000 / bpm) * beatsPerChord;
    const timer = window.setInterval(() => {
      setPosition((prev) => {
        const next = (prev + 1) % total;
        return next;
      });
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPlaying, bpm, beatsPerChord, total]);

  // Play the chord whenever the highlighted position changes mid-song.
  useEffect(() => {
    if (isPlaying) playChordAt(position);
  }, [position, isPlaying, playChordAt]);

  // Keep the highlighted chord on screen while the song plays.
  useEffect(() => {
    if (!isPlaying) return;
    activeChordRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [position, isPlaying]);

  const displayToken = (token: string) => transposeChordToken(token, transpose);

  return (
    <div className="glass-card flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <span className="section-badge">Song Follower</span>
          <h2 className="mt-2 mb-1.5">Follow a song from its chord chart</h2>
          <p className="m-0 max-w-[60ch] leading-[1.6] text-ink-soft">
            Paste the chord chart you are already reading and the follower walks you through
            it: the current chord is highlighted, played with your chosen instrument, and the
            whole song can be transposed into a friendlier key.
          </p>
        </div>
        <div className="max-sm:w-full">
          <button
            className="btn btn-outline max-sm:w-full"
            data-tip="Fill the editor with a short sample song"
            onClick={() => { setDraft(SAMPLE_CHART); loadChart(SAMPLE_CHART); }}
          >
            Load sample
          </button>
        </div>
      </div>

      <div className="rounded-r-[10px] border-l-[3px] border-l-accent bg-[rgba(var(--accent-rgb),0.08)] px-4 py-3 text-[0.9rem] leading-[1.55] text-ink-soft print:hidden">
        <strong className="text-ink">Why not paste the link?</strong> Ultimate Guitar pages cannot be fetched from
        the browser — they are not CORS-enabled and scraping them is against their terms — so
        open the song there, copy the chord chart text, and paste it below.
      </div>

      <div className="flex flex-col gap-2.5 print:hidden">
        <label
          className="text-[0.78rem] uppercase tracking-[0.08em] text-ink-muted"
          htmlFor="song-chart-input"
        >
          Chord chart
        </label>
        <textarea
          id="song-chart-input"
          className="min-h-[170px] w-full resize-y rounded-[14px] border border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.28)] px-4 py-3.5 font-[family-name:ui-monospace,SFMono-Regular,Menlo,monospace] text-[0.92rem] leading-[1.6] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          value={draft}
          spellCheck={false}
          placeholder={'[Verse]\nC        G\nLook at her face\nAm       F\nIt means something to me'}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="btn btn-outline max-sm:w-full"
            data-tip="Replace the current song with the sample chart"
            onClick={() => loadChart(SAMPLE_CHART)}
          >
            Use sample chart
          </button>
          <button
            className="btn btn-primary max-sm:w-full"
            data-tip="Parse the pasted text and start following it"
            disabled={draft.trim().length === 0}
            onClick={() => loadChart(draft)}
          >
            Follow this chart
          </button>
          {source && (
            <span className="text-[0.85rem] text-ink-muted">
              {total} chords · {chart.unique.length} unique · {chart.sections} sections
            </span>
          )}
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="flex flex-col gap-3.5 rounded-2xl border border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--inset-rgb),0.22)] px-4 py-3.5 print:hidden">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                className="btn btn-outline btn-sm"
                data-tip="Step back one chord and hear it"
                onClick={() => goTo(position - 1)}
                aria-label="Previous chord"
              >
                <Icon name="chevron" className="rotate-180" /> Prev
              </button>
              <button
                className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} btn-sm`}
                data-tip={isPlaying ? 'Pause on the current chord' : 'Walk through the chart at the chosen tempo'}
                onClick={() => setIsPlaying((playing) => !playing)}
              >
                {isPlaying ? (
                  <>
                    <Icon name="stop" /> Pause
                  </>
                ) : (
                  <>
                    <Icon name="play" /> Follow
                  </>
                )}
              </button>
              <button
                className="btn btn-outline btn-sm"
                data-tip="Skip to the next chord and hear it"
                onClick={() => goTo(position + 1)}
                aria-label="Next chord"
              >
                Next <Icon name="chevron" />
              </button>
              <button
                className="btn btn-outline btn-sm"
                data-tip="Jump back to the first chord"
                onClick={() => goTo(0)}
              >
                <Icon name="refresh" /> Restart
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 text-[0.85rem] text-ink-soft">
                <span>Tempo</span>
                <input
                  className="w-[120px] accent-[var(--accent-primary)] max-sm:w-full"
                  type="range"
                  min="40"
                  max="200"
                  step="1"
                  title="Drag to set how fast the follower advances"
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                />
                <output className="min-w-[4.5ch] tabular-nums text-ink">{bpm} BPM</output>
              </label>

              <label className="flex items-center gap-2 text-[0.85rem] text-ink-soft">
                <span>Beats / chord</span>
                <select
                  className="select-input"
                  value={beatsPerChord}
                  title="How many beats each chord is held for"
                  onChange={(event) => setBeatsPerChord(Number(event.target.value))}
                >
                  {BEATS_PER_CHORD_OPTIONS.map((beats) => (
                    <option key={beats} value={beats}>
                      {beats}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-2 text-[0.85rem] text-ink-soft">
                <span>Transpose</span>
                <button
                  className="btn-nano px-2 py-0.5"
                  data-tip="Transpose the whole song down a semitone"
                  onClick={() => setTranspose((value) => value - 1)}
                >
                  −1
                </button>
                <button
                  className="btn-nano px-2 py-0.5"
                  data-tip="Transpose the whole song up a semitone"
                  onClick={() => setTranspose((value) => value + 1)}
                >
                  +1
                </button>
                <button
                  className="btn-nano px-2 py-0.5"
                  data-tip="Back to the key the chart was written in"
                  onClick={() => setTranspose(0)}
                  disabled={transpose === 0}
                >
                  reset
                </button>
                <output className="min-w-[4.5ch] tabular-nums text-ink">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </output>
              </div>

              <button
                className={`btn btn-outline btn-sm ${soundOn ? '' : 'opacity-[0.55]'}`}
                aria-pressed={soundOn}
                data-tip={soundOn ? 'Silence the chords — the follower keeps highlighting' : 'Play each chord as it comes up'}
                onClick={() => setSoundOn((value) => !value)}
              >
                {soundOn ? '♪ Sound on' : '♪ Sound off'}
              </button>
              <button
                className="btn btn-outline btn-sm"
                data-tip="Print the chart so you can practise it away from the screen"
                onClick={() => window.print()}
              >
                <Icon name="notes" /> Print chart
              </button>
            </div>
          </div>

          <div
            className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1.5 print:hidden"
            role="status"
            aria-live="polite"
          >
            <span className="font-[family-name:Georgia,serif] text-[2rem] font-bold leading-none text-accent">
              {currentToken ? displayToken(currentToken) : '—'}
            </span>
            <span className="text-right text-[0.85rem] text-ink-muted">
              chord {Math.min(position + 1, total)} of {total}
            </span>
            <div
              className="col-span-full h-1.5 overflow-hidden rounded-full bg-[rgba(var(--overlay-rgb),0.12)]"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-[inherit] bg-accent transition-[width] duration-[180ms]"
                style={{ width: `${((position + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <div className="print-sheet flex max-h-[min(58vh,560px)] flex-col gap-3 overflow-y-auto border-t border-t-[rgba(var(--overlay-rgb),0.1)] pt-[18px] max-sm:max-h-[62vh]">
            <div className="hidden pb-1 text-[12px] font-semibold text-ink-muted print:block">
              Musix chord chart
              {transpose !== 0
                ? ` · transposed ${transpose > 0 ? `+${transpose}` : transpose} semitone${Math.abs(transpose) === 1 ? '' : 's'}`
                : ''}
              {' · '}
              {total} chords
            </div>
            {chart.lines.map((line, lineIndex) => {
              if (line.kind === 'note' && line.text === '') {
                return <div className="h-1" key={`space-${lineIndex}`} />;
              }
              if (line.kind === 'note') {
                return (
                  <div
                    className="self-start rounded-full bg-[rgba(var(--accent-2-rgb),0.18)] px-3 py-[3px] text-[0.74rem] font-semibold uppercase tracking-[0.1em] text-ink"
                    key={`section-${lineIndex}`}
                  >
                    {line.text}
                  </div>
                );
              }
              return (
                <div className="flex flex-col gap-1" key={`line-${lineIndex}`}>
                  <div className="flex flex-wrap gap-x-2 gap-y-[5px]">
                    {line.chords.map((token, chordIndex) => {
                      const isActive =
                        !!currentEntry &&
                        currentEntry.lineIndex === lineIndex &&
                        currentEntry.chordIndex === chordIndex;
                      return (
                        <span
                          key={`${token}-${chordIndex}`}
                          ref={isActive ? (element) => { activeChordRef.current = element; } : undefined}
                          className={`rounded-[9px] border px-[11px] py-[3px] font-[family-name:Georgia,serif] text-[1.02rem] font-semibold ${
                            isActive
                              ? 'border-accent bg-accent text-[color:var(--bg-primary)] shadow-[0_0_0_3px_rgba(var(--accent-rgb),0.25)]'
                              : 'border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--overlay-rgb),0.05)] text-ink'
                          }`}
                        >
                          {displayToken(token)}
                        </span>
                      );
                    })}
                  </div>
                  {line.kind === 'lyrics' && (
                    <div className="whitespace-pre-wrap text-[0.95rem] leading-[1.7] text-ink-soft">{line.text}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
