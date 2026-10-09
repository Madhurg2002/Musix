import { lazy } from 'react';
import type { ReactNode } from 'react';
import type { ChordShape, NoteName } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import type { InstrumentType } from './utils/audio';

// Every screen is imported lazily, so the first paint only carries the shell plus the screen
// the learner actually opened. The `.then(...)` mapping is required because the components
// use named exports.
const SongFollower = lazy(() =>
  import('./components/SongFollower').then((m) => ({ default: m.SongFollower }))
);
const GuitarTuner = lazy(() =>
  import('./components/GuitarTuner').then((m) => ({ default: m.GuitarTuner }))
);
const ChordWorkbench = lazy(() =>
  import('./components/ChordWorkbench').then((m) => ({ default: m.ChordWorkbench }))
);
const GuitarFretboard = lazy(() =>
  import('./components/GuitarFretboard').then((m) => ({ default: m.GuitarFretboard }))
);
const PianoKeyboard = lazy(() =>
  import('./components/PianoKeyboard').then((m) => ({ default: m.PianoKeyboard }))
);
const ScaleExplorer = lazy(() =>
  import('./components/ScaleExplorer').then((m) => ({ default: m.ScaleExplorer }))
);
const IntervalExplorer = lazy(() =>
  import('./components/IntervalExplorer').then((m) => ({ default: m.IntervalExplorer }))
);
const RhythmMetronome = lazy(() =>
  import('./components/RhythmMetronome').then((m) => ({ default: m.RhythmMetronome }))
);
const TheoryCheatSheet = lazy(() =>
  import('./components/TheoryCheatSheet').then((m) => ({ default: m.TheoryCheatSheet }))
);
const Contact = lazy(() => import('./components/Contact').then((m) => ({ default: m.Contact })));

/** Shared state and callbacks a screen may need from the app shell. */
export interface ScreenContext {
  selectedRoot: NoteName;
  setSelectedRoot: (root: NoteName) => void;
  activeChord: ChordShape | null;
  setActiveChord: (chord: ChordShape) => void;
  activeScaleNotes: NoteName[];
  setActiveScaleNotes: (notes: NoteName[]) => void;
  visualizer: 'piano' | 'guitar';
  setVisualizer: (visualizer: 'piano' | 'guitar') => void;
  selectChordForFretboard: (chord: ChordShape) => void;
  openTuner: () => void;
}

export type NavGroupLabel = 'Practice' | 'Fretboard' | 'Harmony' | 'Learn' | 'Project';

export interface RouteDefinition {
  /** Path in the URL fragment, e.g. `songs` in `#songs`. */
  id: string;
  /** Name shown in the top bar while this screen is open. */
  title: string;
  /** Rail group, which also fixes the on-screen order. */
  group: NavGroupLabel;
  /** Rail entry label and its one-line hint. */
  label: string;
  hint: string;
  /** Voice this tool uses in Auto mode. */
  instrument: InstrumentType;
  /** Set on the Piano / Fretboard pair, which share a single slot in the rail. */
  visibleFor?: 'piano' | 'guitar';
  render: (context: ScreenContext) => ReactNode;
}

/**
 * The single source of truth for routing: `App` renders from it, `Header` builds the rail
 * from it, and `TopBar` titles the screen from it. Adding a screen means adding one entry
 * here plus a lazily imported component.
 */
export const ROUTES: [RouteDefinition, ...RouteDefinition[]] = [
  {
    id: 'songs',
    title: 'Song Follower',
    group: 'Practice',
    label: 'Songs',
    hint: 'Follow a chord chart',
    instrument: 'acoustic-guitar',
    render: () => <SongFollower />,
  },
  {
    id: 'tuner',
    title: 'Instrument Tuner',
    group: 'Practice',
    label: 'Tuner',
    hint: 'Mic pitch detection',
    instrument: 'acoustic-guitar',
    render: () => <GuitarTuner />,
  },
  {
    id: 'rhythm',
    title: 'Rhythm & Metronome',
    group: 'Practice',
    label: 'Rhythm',
    hint: 'Metronome & tempo',
    instrument: 'acoustic-guitar',
    render: () => <RhythmMetronome />,
  },
  {
    id: 'fretboard',
    title: 'Guitar Fretboard',
    group: 'Fretboard',
    label: 'Fretboard',
    hint: 'Press positions',
    instrument: 'acoustic-guitar',
    visibleFor: 'guitar',
    render: (context) => (
      <>
        <div className="fretboard-chord-picker glass-card">
          <label>Select Chord to view on Fretboard:</label>
          <div className="chord-picker-buttons">
            {COMPREHENSIVE_CHORDS.map((chord) => (
              <button
                key={chord.id}
                className={`btn-chord-chip ${context.activeChord?.id === chord.id ? 'active' : ''}`}
                data-tip={`Show ${chord.name} pressed on the neck`}
                onClick={() => context.setActiveChord(chord)}
              >
                {chord.name}
              </button>
            ))}
          </div>
        </div>

        <GuitarFretboard
          activeChord={context.activeChord}
          activeScaleNotes={context.activeScaleNotes}
          rootNote={context.selectedRoot}
        />
      </>
    ),
  },
  {
    id: 'scales',
    title: 'Scales & Modes',
    group: 'Fretboard',
    label: 'Scales',
    hint: 'Modes & formulas',
    instrument: 'acoustic-guitar',
    render: (context) => (
      <>
        <ScaleExplorer
          selectedRoot={context.selectedRoot}
          onRootChange={context.setSelectedRoot}
          onScaleNotesChange={context.setActiveScaleNotes}
        />
        <div className="dual-visualizers-grid">
          {context.visualizer === 'guitar' ? (
            <GuitarFretboard activeScaleNotes={context.activeScaleNotes} rootNote={context.selectedRoot} />
          ) : (
            <PianoKeyboard activeNotes={context.activeScaleNotes} rootNote={context.selectedRoot} />
          )}
        </div>
      </>
    ),
  },
  {
    id: 'intervals',
    title: 'Interval Explorer',
    group: 'Fretboard',
    label: 'Intervals',
    hint: 'Distance & ear training',
    instrument: 'piano',
    render: () => <IntervalExplorer />,
  },
  {
    id: 'workbench',
    title: 'Chord Studio',
    group: 'Harmony',
    label: 'Chord Studio',
    hint: 'Compare side by side',
    instrument: 'acoustic-guitar',
    render: (context) => (
      <ChordWorkbench
        onSelectChordForFretboard={context.selectChordForFretboard}
        onOpenTuner={context.openTuner}
      />
    ),
  },
  {
    id: 'piano',
    title: 'Piano Visualizer',
    group: 'Harmony',
    label: 'Piano',
    hint: 'Keyboard visualizer',
    instrument: 'piano',
    visibleFor: 'piano',
    render: (context) => (
      <PianoKeyboard
        activeNotes={context.activeChord ? context.activeChord.notes : context.activeScaleNotes}
        rootNote={context.selectedRoot}
      />
    ),
  },
  {
    id: 'guide',
    title: 'Beginner Guide',
    group: 'Learn',
    label: 'Guide',
    hint: 'Start here',
    instrument: 'acoustic-guitar',
    render: () => <TheoryCheatSheet />,
  },
  {
    id: 'contact',
    title: 'Contact',
    group: 'Project',
    label: 'Contact',
    hint: 'Reach the author',
    instrument: 'acoustic-guitar',
    render: () => <Contact />,
  },
];

/** Where an unknown or missing hash lands. */
export const DEFAULT_ROUTE_ID = 'workbench';

export const ROUTE_IDS: string[] = ROUTES.map((route) => route.id);

/** Look up a route, falling back to the default screen. */
export function routeFor(id: string): RouteDefinition {
  return ROUTES.find((route) => route.id === id) ?? ROUTES[0];
}

/**
 * Which visualizer the current route implies. Opening `#fretboard` or `#piano` directly must
 * select the matching view, otherwise the rail would hide the screen that is on display.
 */
export function visualizerForRoute(id: string): 'piano' | 'guitar' | null {
  if (id === 'fretboard') return 'guitar';
  if (id === 'piano') return 'piano';
  return null;
}
