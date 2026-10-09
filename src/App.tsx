import { Suspense, useEffect, useMemo, useState } from 'react';
import './style.css';
import type { ChordShape, NoteName } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import { Header } from './components/Header';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import {
  DEFAULT_ROUTE_ID,
  ROUTE_IDS,
  routeFor,
  visualizerForRoute,
  type ScreenContext,
} from './routes';
import { readHashRoute, subscribeToRoute, writeHashRoute } from './utils/router';
import { soundEngine, type InstrumentType } from './utils/audio';

/** Shown while a route's code chunk loads. */
function ScreenLoading({ title }: { title: string }) {
  return (
    <div className="screen-loading" role="status" aria-live="polite">
      <span className="screen-loading__pulse" aria-hidden="true" />
      <span>Loading {title}…</span>
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTabState] = useState<string>(() =>
    readHashRoute(ROUTE_IDS, DEFAULT_ROUTE_ID)
  );
  const [selectedRoot, setSelectedRoot] = useState<NoteName>('C');
  const [activeChordForFretboard, setActiveChordForFretboard] = useState<ChordShape | null>(
    COMPREHENSIVE_CHORDS[0] ?? null
  );
  const [selectedVisualizer, setSelectedVisualizer] = useState<'piano' | 'guitar'>(
    () => visualizerForRoute(readHashRoute(ROUTE_IDS, DEFAULT_ROUTE_ID)) ?? 'piano'
  );
  const [activeScaleNotes, setActiveScaleNotes] = useState<NoteName[]>([
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
  ]);
  // 'auto' = follow the route's default instrument; anything else = the user chose one.
  const [userOverride, setUserOverride] = useState<InstrumentType | 'auto'>('auto');

  const route = routeFor(activeTab);

  // Keep the engine in 'auto' unless the user locked an instrument, so each tool's own
  // override decides the voice. Pinning a concrete instrument here would win over those
  // overrides — which made the piano keys on the Scales screen play guitar.
  useEffect(() => {
    if (userOverride === 'auto') {
      soundEngine.setInstrument('auto');
    }
  }, [activeTab, userOverride]);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    writeHashRoute(tab);
  };

  const setVisualizer = (visualizer: 'piano' | 'guitar') => {
    setSelectedVisualizer(visualizer);
    if (visualizer === 'piano' && activeTab === 'fretboard') setActiveTab('piano');
    if (visualizer === 'guitar' && activeTab === 'piano') setActiveTab('fretboard');
  };

  // Every way the address can change — link clicks, back/forward, manual edits — lands here.
  useEffect(
    () =>
      subscribeToRoute(() => {
        const nextRoute = readHashRoute(ROUTE_IDS, DEFAULT_ROUTE_ID);
        setActiveTabState(nextRoute);

        const implied = visualizerForRoute(nextRoute);
        if (implied) setSelectedVisualizer(implied);
      }),
    []
  );

  const selectChordForFretboard = (chord: ChordShape) => {
    setActiveChordForFretboard(chord);
    setSelectedVisualizer('guitar');
    setActiveTab('fretboard');
  };

  const screenContext: ScreenContext = useMemo(
    () => ({
      selectedRoot,
      setSelectedRoot,
      activeChord: activeChordForFretboard,
      setActiveChord: setActiveChordForFretboard,
      activeScaleNotes,
      setActiveScaleNotes,
      visualizer: selectedVisualizer,
      setVisualizer,
      selectChordForFretboard,
      openTuner: () => setActiveTab('tuner'),
    }),
    // Handlers below are stable enough for this shell; re-creating the context per render is
    // cheap and keeps the dependency list honest.
    [selectedRoot, activeChordForFretboard, activeScaleNotes, selectedVisualizer, activeTab],
  );

  return (
    <div className="musix-app-root">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedVisualizer={selectedVisualizer}
        setSelectedVisualizer={setVisualizer}
      />

      <div className="musix-main-column">
        <TopBar
          activeTab={activeTab}
          userOverride={userOverride}
          setUserOverride={setUserOverride}
          tabDefaultInstrument={route.instrument}
        />

        <main className="main-content-container">
          {/* Screen hero: one idea, one action, one secondary control */}
          <section className="screen-hero">
            <p className="screen-hero__eyebrow">Music theory, made visible</p>
            <h2 className="screen-hero__title">Learn it by seeing it and hearing it</h2>
            <p className="screen-hero__lede">
              Follow a song from its chord chart, compare chords side by side, read exact
              guitar press positions, tune with microphone pitch detection, and play every
              concept back in real time.
            </p>
            <div className="screen-hero__actions">
              <button className="btn btn-primary" onClick={() => setActiveTab('songs')}>
                Follow a song
              </button>
              <button className="btn btn-outline" onClick={() => setActiveTab('guide')}>
                Start with the basics
              </button>
              <div className="key-selector">
                <span className="key-selector__label">Key</span>
                <div className="key-badges-row">
                  {(['C', 'G', 'D', 'A', 'E', 'F'] as NoteName[]).map((key) => (
                    <button
                      key={key}
                      className={`btn-key-chip ${selectedRoot === key ? 'active' : ''}`}
                      aria-pressed={selectedRoot === key}
                      onClick={() => setSelectedRoot(key)}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="tab-section">
            <Suspense fallback={<ScreenLoading title={route.title} />}>
              {route.render(screenContext)}
            </Suspense>
          </section>
        </main>

        <Footer onNavigate={setActiveTab} />
      </div>
    </div>
  );
}

export default App;
