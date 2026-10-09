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

const BEATS_PER_CHORD_OPTIONS = [1, 2, 4] as const;
const EMPTY_CHART: ParsedChart = { lines: [], chords: [], unique: [], sections: 0 };

/**
 * Follow a song from a pasted chord chart.
 *
 * Ultimate Guitar cannot be fetched from the browser (their pages are not CORS-enabled and
 * scraping is disallowed by their terms), so the learner pastes the chart they are already
 * reading and the follower walks them through it: it highlights the current chord, plays it
 * with the selected instrument, and can transpose the whole song into a friendlier key.
 */
export const SongFollower: React.FC = () => {
  const [draft, setDraft] = useState<string>('');
  const [chart, setChart] = useState<ParsedChart>(EMPTY_CHART);
  const [source, setSource] = useState<string>('');

  const [bpm, setBpm] = useState<number>(80);
  const [beatsPerChord, setBeatsPerChord] = useState<number>(4);
  const [transpose, setTranspose] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [soundOn, setSoundOn] = useState<boolean>(true);

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
    <div className="song-follower glass-card">
      <div className="song-header">
        <div>
          <span className="section-badge">Song Follower</span>
          <h2>Follow a song from its chord chart</h2>
          <p>
            Paste the chord chart you are already reading and the follower walks you through
            it: the current chord is highlighted, played with your chosen instrument, and the
            whole song can be transposed into a friendlier key.
          </p>
        </div>
        <div className="song-header-actions">
          <button className="btn btn-outline" onClick={() => { setDraft(SAMPLE_CHART); loadChart(SAMPLE_CHART); }}>
            Load sample
          </button>
        </div>
      </div>

      <div className="song-note">
        <strong>Why not paste the link?</strong> Ultimate Guitar pages cannot be fetched from
        the browser — they are not CORS-enabled and scraping them is against their terms — so
        open the song there, copy the chord chart text, and paste it below.
      </div>

      <div className="song-input">
        <label className="song-input__label" htmlFor="song-chart-input">
          Chord chart
        </label>
        <textarea
          id="song-chart-input"
          className="song-textarea"
          value={draft}
          spellCheck={false}
          placeholder={'[Verse]\nC        G\nLook at her face\nAm       F\nIt means something to me'}
          onChange={(event) => setDraft(event.target.value)}
        />
        <div className="song-input-actions">
          <button
            className="btn btn-outline"
            onClick={() => loadChart(SAMPLE_CHART)}
          >
            Use sample chart
          </button>
          <button
            className="btn btn-primary"
            disabled={draft.trim().length === 0}
            onClick={() => loadChart(draft)}
          >
            Follow this chart
          </button>
          {source && (
            <span className="song-meta">
              {total} chords · {chart.unique.length} unique · {chart.sections} sections
            </span>
          )}
        </div>
      </div>

      {total > 0 && (
        <>
          <div className="song-transport">
            <div className="song-transport__buttons">
              <button className="btn btn-outline btn-sm" onClick={() => goTo(position - 1)} aria-label="Previous chord">
                ◀ Prev
              </button>
              <button
                className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'} btn-sm`}
                onClick={() => setIsPlaying((playing) => !playing)}
              >
                {isPlaying ? '⏸ Pause' : '▶ Follow'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => goTo(position + 1)} aria-label="Next chord">
                Next ▶
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => goTo(0)}>
                ⟲ Restart
              </button>
            </div>

            <div className="song-transport__controls">
              <label className="song-field">
                <span>Tempo</span>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="1"
                  value={bpm}
                  onChange={(event) => setBpm(Number(event.target.value))}
                />
                <output>{bpm} BPM</output>
              </label>

              <label className="song-field">
                <span>Beats / chord</span>
                <select
                  className="select-input"
                  value={beatsPerChord}
                  onChange={(event) => setBeatsPerChord(Number(event.target.value))}
                >
                  {BEATS_PER_CHORD_OPTIONS.map((beats) => (
                    <option key={beats} value={beats}>
                      {beats}
                    </option>
                  ))}
                </select>
              </label>

              <div className="song-field song-field--buttons">
                <span>Transpose</span>
                <button className="btn-nano" onClick={() => setTranspose((value) => value - 1)}>
                  −1
                </button>
                <button className="btn-nano" onClick={() => setTranspose((value) => value + 1)}>
                  +1
                </button>
                <button className="btn-nano" onClick={() => setTranspose(0)} disabled={transpose === 0}>
                  reset
                </button>
                <output>{transpose > 0 ? `+${transpose}` : transpose}</output>
              </div>

              <button
                className={`btn btn-outline btn-sm ${soundOn ? '' : 'is-off'}`}
                aria-pressed={soundOn}
                onClick={() => setSoundOn((value) => !value)}
              >
                {soundOn ? '♪ Sound on' : '♪ Sound off'}
              </button>
            </div>
          </div>

          <div className="song-progress" role="status" aria-live="polite">
            <span className="song-progress__now">
              {currentToken ? displayToken(currentToken) : '—'}
            </span>
            <span className="song-progress__count">
              chord {Math.min(position + 1, total)} of {total}
            </span>
            <div className="song-progress__track" aria-hidden="true">
              <div
                className="song-progress__fill"
                style={{ width: `${((position + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          <div className="song-chart">
            {chart.lines.map((line, lineIndex) => {
              if (line.kind === 'note' && line.text === '') {
                return <div className="song-chart__spacer" key={`space-${lineIndex}`} />;
              }
              if (line.kind === 'note') {
                return (
                  <div className="song-chart__section" key={`section-${lineIndex}`}>
                    {line.text}
                  </div>
                );
              }
              return (
                <div className="song-chart__line" key={`line-${lineIndex}`}>
                  <div className="song-chart__chords">
                    {line.chords.map((token, chordIndex) => {
                      const isActive =
                        !!currentEntry &&
                        currentEntry.lineIndex === lineIndex &&
                        currentEntry.chordIndex === chordIndex;
                      return (
                        <span
                          key={`${token}-${chordIndex}`}
                          ref={isActive ? (element) => { activeChordRef.current = element; } : undefined}
                          className={`song-chord ${isActive ? 'song-chord--active' : ''}`}
                        >
                          {displayToken(token)}
                        </span>
                      );
                    })}
                  </div>
                  {line.kind === 'lyrics' && (
                    <div className="song-chart__lyrics">{line.text}</div>
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
