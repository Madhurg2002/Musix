import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from '../utils/audio';
import {
  SAMPLE_CHART,
  chordFrequencies,
  chordPitchClasses,
  decodeSharedChart,
  encodeSharedChart,
  findBestChartPosition,
  parseChordChart,
  parseChordSymbol,
  transposeChordToken,
  type ParsedChart,
} from '../utils/chordChart';
import { noteNameAt } from '../utils/musicTheory';
import { useLivePitch } from '../utils/useLivePitch';
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

/** How long a heard note stays in the follow-along's memory. */
const HEARD_WINDOW_MS = 2000;
/** How long a better-fitting chart position must hold before the highlight snaps to it. */
const LOCATE_HOLD_MS = 1200;

/**
 * Follow a song from a pasted chord chart.
 *
 * Ultimate Guitar cannot be fetched from the browser (their pages are not CORS-enabled and
 * scraping is disallowed by their terms), so the learner pastes the chart they are already
 * reading and the follower walks them through it: it highlights the current chord, plays it
 * with the selected instrument, and can transpose the whole song into a friendlier key.
 */
export const SongFollower: React.FC = () => {
  // A shared link (?song=…) opens its chart first; otherwise a chart pasted in a
  // previous session comes back already loaded, so practising a song is not a re-paste
  // every time the page reloads. The link cleans itself out of the URL once consumed.
  const sharedChart = useMemo(() => decodeSharedChart(window.location.search), []);
  const savedChart = useMemo(
    () => sharedChart ?? readPreference(PREFERENCE_KEYS.songChart, '', isText),
    [sharedChart]
  );

  useEffect(() => {
    if (sharedChart === null) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('song');
    window.history.replaceState(null, '', url.toString());
  }, [sharedChart]);

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
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'too-long' | 'failed'>(
    'idle'
  );
  const shareTimerRef = useRef<number | null>(null);

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

  /** Briefly show the outcome of a Share press, then fall back to the plain label. */
  const flashShare = useCallback((next: 'copied' | 'too-long' | 'failed') => {
    setShareState(next);
    if (shareTimerRef.current !== null) window.clearTimeout(shareTimerRef.current);
    shareTimerRef.current = window.setTimeout(() => setShareState('idle'), 2600);
  }, []);

  const handleShare = useCallback(() => {
    if (!source.trim()) return;
    const encoded = encodeSharedChart(source);
    // Browsers cap URLs somewhere between 2k and 8k characters — beyond that the link
    // would open with the chart missing, so say so instead of copying a broken link.
    if (encoded.length > 6000) {
      flashShare('too-long');
      return;
    }
    const hash = window.location.hash || '#songs';
    const url = `${window.location.origin}${window.location.pathname}?song=${encoded}${hash}`;
    try {
      if (!navigator.clipboard) {
        flashShare('failed');
        return;
      }
      navigator.clipboard
        .writeText(url)
        .then(() => flashShare('copied'))
        .catch(() => flashShare('failed'));
    } catch {
      flashShare('failed');
    }
  }, [source, flashShare]);

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

  // Keep the highlighted chord on screen whenever it moves: while the song plays, when
  // stepping by hand, and when the mic locates the learner. The first run is skipped so
  // opening a screen never drags the page down to the chart on its own.
  const hasPositionedRef = useRef(false);
  useEffect(() => {
    if (!hasPositionedRef.current) {
      hasPositionedRef.current = true;
      return;
    }
    activeChordRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [position, isPlaying]);

  const displayToken = (token: string) => transposeChordToken(token, transpose);

  // ---- Live follow-along (mic) -------------------------------------------------
  // The learner plays what the chart shows; the mic names the pitch classes they are
  // actually producing. The coaching strip checks them against the chord under the
  // playhead, and while the follower is paused, agreement elsewhere in the chart moves
  // the highlight to where they really are.
  const live = useLivePitch();
  const heardEntriesRef = useRef<{ pitchClass: number; at: number }[]>([]);
  const [heardVersion, setHeardVersion] = useState(0);
  const [foundAt, setFoundAt] = useState<{ index: number; t: number } | null>(null);

  useEffect(() => {
    if (!live.listening) {
      heardEntriesRef.current = [];
      setFoundAt(null);
      return;
    }
    if (live.midi === null) return;

    const pitchClass = ((live.midi % 12) + 12) % 12;
    const now = Date.now();
    const entries = heardEntriesRef.current;
    const last = entries[entries.length - 1];
    // Re-record a note that keeps sounding every 400ms so a held chord stays inside
    // the window; a new note is always recorded immediately.
    if (last && last.pitchClass === pitchClass && now - last.at < 400) return;
    entries.push({ pitchClass, at: now });
    while (entries.length > 0 && now - (entries[0]?.at ?? now) > HEARD_WINDOW_MS) {
      entries.shift();
    }
    setHeardVersion((version) => version + 1);
  }, [live.listening, live.midi, live.cents]);

  const heardClasses = useMemo(() => {
    if (!live.listening) return [];
    const now = Date.now();
    const unique = new Set<number>();
    for (const entry of heardEntriesRef.current) {
      if (now - entry.at <= HEARD_WINDOW_MS) unique.add(entry.pitchClass);
    }
    return [...unique];
  }, [live.listening, heardVersion]);

  const tonesByIndex = useMemo(
    () => chart.chords.map((token) => chordPitchClasses(token, transpose)),
    [chart.chords, transpose]
  );

  const locateIndex = useMemo(
    () =>
      live.listening && !isPlaying && heardClasses.length > 0
        ? findBestChartPosition(heardClasses, tonesByIndex, position)
        : null,
    [live.listening, isPlaying, heardClasses, tonesByIndex, position]
  );

  // Snap only after the better position holds for a moment, so one passing note cannot
  // throw the highlight around. The snap is silent — the learner just played it.
  useEffect(() => {
    if (locateIndex === null || locateIndex === position) return;
    const timer = window.setTimeout(() => {
      setPosition(locateIndex);
      setFoundAt({ index: locateIndex, t: Date.now() });
    }, LOCATE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [locateIndex, position]);

  const currentIndex = Math.min(position, Math.max(total - 1, 0));
  const currentTones = currentToken ? tonesByIndex[currentIndex] ?? null : null;
  const clashClasses =
    heardClasses.length > 0 && currentTones
      ? heardClasses.filter((pitchClass) => !currentTones.includes(pitchClass))
      : [];
  const heardNames = heardClasses.map((pitchClass) => noteNameAt(pitchClass)).join(' · ');
  const snapIsFresh =
    foundAt !== null && foundAt.index === position && Date.now() - foundAt.t < 4000;

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
                className={`btn btn-sm ${live.listening ? 'btn-danger' : 'btn-outline'}`}
                data-tip={
                  live.listening
                    ? 'Stop the microphone and the follow-along coaching'
                    : 'Listen while you play: check every chord against the chart and find your place in it. Turn Sound off if the app’s own playback rings in your room.'
                }
                aria-pressed={live.listening}
                onClick={() => (live.listening ? live.stop() : live.start())}
              >
                <Icon name={live.listening ? 'stop' : 'mic'} />
                {live.listening ? 'Listening' : 'Play along'}
              </button>
              <button
                className="btn btn-outline btn-sm"
                data-tip="Print the chart so you can practise it away from the screen"
                onClick={() => window.print()}
              >
                <Icon name="notes" /> Print chart
              </button>
              <button
                className="btn btn-outline btn-sm"
                data-tip="Copy a link that opens this chart for someone else"
                disabled={!source.trim()}
                onClick={handleShare}
              >
                <Icon name="copy" />
                <span aria-live="polite">
                  {shareState === 'copied'
                    ? 'Copied!'
                    : shareState === 'too-long'
                      ? 'Too long to link'
                      : shareState === 'failed'
                        ? 'Copy blocked'
                        : 'Share'}
                </span>
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

          {/* Follow-along coaching: what the mic hears, checked against the chord under
              the playhead, plus a nudge to where in the chart it actually fits. */}
          {(live.listening || live.error) && (
            <div
              className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-[rgba(var(--accent-rgb),0.35)] bg-[rgba(var(--accent-rgb),0.08)] px-4 py-3 text-[13px] print:hidden"
              role="status"
              aria-live="polite"
            >
              {live.error ? (
                <span className="flex items-center gap-2 text-alert">
                  <Icon name="alert" /> {live.error}
                </span>
              ) : (
                <>
                  <span className="section-badge inline-flex items-center gap-1.5 bg-[rgba(var(--accent-rgb),0.16)] text-accent">
                    <Icon name="mic" /> Playing along
                  </span>
                  {heardClasses.length === 0 ? (
                    <span className="italic text-ink-muted">
                      Play a chord — Musix checks it against the chart and finds your place.
                    </span>
                  ) : (
                    <>
                      <span className="text-ink-soft">
                        You played: <strong className="text-ink">{heardNames}</strong>
                      </span>
                      {currentTones === null ? null : clashClasses.length === 0 ? (
                        <span className="flex items-center gap-1.5 text-success">
                          <Icon name="check" /> Those fit{' '}
                          <strong>{currentToken ? displayToken(currentToken) : ''}</strong> —
                          you are in the right place.
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-alert">
                          <Icon name="alert" /> Here the chart says{' '}
                          <strong>{currentToken ? displayToken(currentToken) : ''}</strong>{' '}
                          ({currentTones.map((pitchClass) => noteNameAt(pitchClass)).join(' · ')}) —
                          you played{' '}
                          {clashClasses.map((pitchClass) => noteNameAt(pitchClass)).join(' · ')},
                          which {clashClasses.length === 1 ? 'is' : 'are'} not in it.
                        </span>
                      )}
                      {snapIsFresh && foundAt && (
                        <span className="text-accent">
                          Found you at chord {foundAt.index + 1} of {total}.
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}

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
