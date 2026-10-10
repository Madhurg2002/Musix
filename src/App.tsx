import { Suspense, useEffect, useMemo, useState } from 'react';
import './style.css';
import type { ChordShape, NoteName } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import { Header } from './components/Header';
import { TopBar } from './components/TopBar';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import {
  DEFAULT_ROUTE_ID,
  ROUTE_IDS,
  routeFor,
  visualizerForRoute,
  type ScreenContext,
} from './routes';
import { readHashRoute, subscribeToRoute, writeHashRoute } from './utils/router';
import {
  PREFERENCE_KEYS,
  isOneOf,
  isNoteName,
  readPreference,
  writePreference,
} from './utils/preferences';
import { soundEngine, type InstrumentType } from './utils/audio';
import { INSTRUMENT_IDS } from './data/instruments';
import { ChipRow, type ChipOption } from './components/ChipRow';

const isVisualizer = isOneOf('piano', 'guitar');
const isInstrumentChoice = isOneOf<InstrumentType | 'auto'>('auto', ...INSTRUMENT_IDS);

/** Shown while a route's code chunk loads. */
function ScreenLoading({ title }: { title: string }) {
  return (
    <div className="screen-loading" role="status" aria-live="polite">
      <span className="screen-loading__pulse" aria-hidden="true" />
      <span>Loading {title}…</span>
    </div>
  );
}

/** The six practice keys offered in the hero, shared with the chip row below. */
const HERO_KEYS: readonly NoteName[] = ['C', 'G', 'D', 'A', 'E', 'F'];
const HERO_KEY_OPTIONS: readonly ChipOption<NoteName>[] = HERO_KEYS.map((key) => ({
  value: key,
  label: key,
  tip: `Practise in the key of ${key} — every tool follows it`,
}));

export function App() {
  const [activeTab, setActiveTabState] = useState<string>(() =>
    readHashRoute(ROUTE_IDS, DEFAULT_ROUTE_ID)
  );
  // Saved preferences seed the shell so practice resumes where the learner left off.
  const [selectedRoot, setSelectedRoot] = useState<NoteName>(() =>
    readPreference(PREFERENCE_KEYS.root, 'C' as NoteName, isNoteName)
  );
  const [activeChordForFretboard, setActiveChordForFretboard] = useState<ChordShape | null>(
    COMPREHENSIVE_CHORDS[0] ?? null
  );
  const [selectedVisualizer, setSelectedVisualizer] = useState<'piano' | 'guitar'>(
    () =>
      // The route's own choice wins on a deep link; the saved preference covers the rest.
      visualizerForRoute(readHashRoute(ROUTE_IDS, DEFAULT_ROUTE_ID)) ??
      readPreference(PREFERENCE_KEYS.visualizer, 'piano' as const, isVisualizer)
  );
  const [activeScaleNotes, setActiveScaleNotes] = useState<NoteName[]>([
    'C', 'D', 'E', 'F', 'G', 'A', 'B',
  ]);
  // 'auto' = follow the route's default instrument; anything else = the user chose one.
  const [userOverride, setUserOverride] = useState<InstrumentType | 'auto'>(() =>
    readPreference(PREFERENCE_KEYS.instrument, 'auto' as const, isInstrumentChoice)
  );
  // True while the footer has asked to reopen the preference-cookie panel.
  const [cookiePanelOpen, setCookiePanelOpen] = useState<boolean>(false);

  const route = routeFor(activeTab);
  // What this screen sounds like right now: the top bar's lock, or the route's default.
  const effectiveInstrument: InstrumentType =
    userOverride === 'auto' ? route.instrument : userOverride;

  // Mirror the shell choices back to storage.
  useEffect(() => writePreference(PREFERENCE_KEYS.root, selectedRoot), [selectedRoot]);
  useEffect(() => writePreference(PREFERENCE_KEYS.visualizer, selectedVisualizer), [selectedVisualizer]);
  useEffect(() => writePreference(PREFERENCE_KEYS.instrument, userOverride), [userOverride]);

  // A saved instrument lock has to reach the engine on the very first render, before any
  // screen tries to play a note.
  useEffect(() => {
    soundEngine.setInstrument(userOverride === 'auto' ? 'auto' : userOverride);
  }, []);

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
      instrument: effectiveInstrument,
    }),
    // Handlers below are stable enough for this shell; re-creating the context per render is
    // cheap and keeps the dependency list honest.
    [
      selectedRoot,
      activeChordForFretboard,
      activeScaleNotes,
      selectedVisualizer,
      activeTab,
      userOverride,
    ],
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
          <section className="print:hidden flex flex-col gap-3 px-0.5 pt-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[1.8px] text-accent">
              Music theory, made visible
            </p>
            <h2 className="max-w-[20ch] text-[clamp(28px,3.6vw,42px)] font-extrabold leading-[1.06] tracking-[-1px] text-ink">
              Learn it by seeing it and hearing it
            </h2>
            <p className="max-w-[64ch] text-[16px] text-ink-soft">
              Follow a song from its chord chart, compare chords side by side, read exact
              guitar press positions, tune with microphone pitch detection, and play every
              concept back in real time.
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-5">
              <button
                className="btn btn-primary"
                data-tip="Open the Song Follower and step through a chord chart"
                onClick={() => setActiveTab('songs')}
              >
                Follow a song
              </button>
              <button
                className="btn btn-outline"
                data-tip="Open the beginner guide to steps, chords, and notation"
                onClick={() => setActiveTab('guide')}
              >
                Start with the basics
              </button>
              <ChipRow
                label="Key"
                options={HERO_KEY_OPTIONS}
                value={selectedRoot}
                onChange={setSelectedRoot}
              />
            </div>
          </section>

          <section className="tab-section">
            <Suspense fallback={<ScreenLoading title={route.title} />}>
              {route.render(screenContext)}
            </Suspense>
          </section>
        </main>

        <Footer
          onNavigate={setActiveTab}
          onCookieSettings={() => setCookiePanelOpen(true)}
        />

        <CookieConsent
          forceOpen={cookiePanelOpen}
          onClose={() => setCookiePanelOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
