import { lazy } from 'react';
import type { ReactNode } from 'react';
import type { ChordShape, NoteName } from './types';
import { COMPREHENSIVE_CHORDS } from './data/chordsData';
import { ALL_NOTES } from './utils/musicTheory';
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
  /**
   * Effective instrument for this screen: the top bar's lock when the learner made
   * one, otherwise the route's own default.
   */
  instrument: InstrumentType;
}

export type NavGroupLabel = 'Practice' | 'Fretboard' | 'Harmony' | 'Learn' | 'Project';

export interface RouteDefinition {
  /** Path in the URL fragment, e.g. `songs` in `#songs`. */
  id: string;
  /** Name shown in the top bar while this screen is open. */
  title: string;
  /** Rail group, which also fixes the on-screen order. */
  group: NavGroupLabel;
  /** Rail entry label. */
  label: string;
  /** Voice this tool uses in Auto mode. */
  instrument: InstrumentType;
  /** Orientation shown under the top bar while this screen is open. */
  intro: ScreenIntro;
  /** Set on the Piano / Fretboard pair, which share a single slot in the rail. */
  visibleFor?: 'piano' | 'guitar';
  /** Set to keep a screen out of the rail: it stays routable and linked from the footer. */
  railHidden?: boolean;
  render: (context: ScreenContext) => ReactNode;
}

/** The orientation a screen shows under the top bar: one label, one line, one sentence. */
export interface ScreenIntro {
  /** Small accent label; the rail group is used when this is omitted. */
  kicker?: string;
  /** One-line headline for the screen. */
  headline: string;
  /** One sentence saying what the learner can do here. */
  description: string;
}

/**
 * The single source of truth for routing: `App` renders from it, `Header` builds the rail
 * from it, and `TopBar` titles the screen from it. Adding a screen means adding one entry
 * here plus a lazily imported component.
 */
interface FretboardChordPickerProps {
  activeChord: ChordShape | null;
  onSelect: (chord: ChordShape) => void;
}

/**
 * Every stored chord, grouped by root so the list reads chromatically — one row per root,
 * its shapes in quality order, and the button labelled with only the quality because the
 * root is already on the row.
 *
 * The buttons used to be one flat wrap in the data file's storage order, which read
 * "C♯ Major → C7 → A♯ Major → G": storage leaking into the interface.
 */
export function FretboardChordPicker({ activeChord, onSelect }: FretboardChordPickerProps) {
  return (
    <div className="glass-card">
      <label className="text-sm font-bold text-ink-soft">Select Chord to view on Fretboard:</label>
      {/* Grouped by root so the list reads chromatically: one row per root, its shapes
          in quality order. The old flat wrap ran C♯ Major → C7 → A♯ Major → G, which is
          the table's storage order leaking into the interface. */}
      <div className="flex flex-col gap-2">
        {ALL_NOTES.map((root) => {
          const chords = COMPREHENSIVE_CHORDS.filter((chord) => chord.root === root);
          if (chords.length === 0) return null;

          return (
            <div key={root} className="flex flex-wrap items-center gap-2">
              <span className="w-6 shrink-0 font-display text-[13px] font-bold text-accent">
                {root}
              </span>
              {chords.map((chord) => (
                <button
                  key={chord.id}
                  className={`rounded-xl border px-4 py-2 font-sans text-[13px] transition-all duration-200 ${
                    activeChord?.id === chord.id
                      ? 'border-accent bg-[linear-gradient(135deg,var(--accent-primary)_0%,#c98a3f_100%)] font-bold text-black shadow-[0_0_16px_var(--accent-primary)]'
                      : 'border-hairline bg-[rgba(var(--overlay-rgb),0.05)] font-semibold text-ink hover:border-[rgba(var(--accent-rgb),0.4)] hover:bg-[rgba(var(--overlay-rgb),0.12)]'
                  }`}
                  data-tip={`Show ${chord.name} pressed on the neck`}
                  aria-label={chord.name}
                  onClick={() => onSelect(chord)}
                >
                  {/* The root is on the row, so the button only needs the quality. */}
                  {chord.name.startsWith(root) ? chord.name.slice(root.length).trim() || 'Major' : chord.name}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}


export const ROUTES: [RouteDefinition, ...RouteDefinition[]] = [
  {
    id: 'songs',
    title: 'Song Follower',
    group: 'Practice',
    label: 'Songs',
    intro: {
      headline: 'Step through a song in real time',
      description:
        'Pick a song, follow its chord chart, and hear every change as the progression moves — with playback you control.',
    },
    instrument: 'acoustic-guitar',
    render: () => <SongFollower />,
  },
  {
    id: 'tuner',
    title: 'Instrument Tuner',
    group: 'Practice',
    label: 'Tuner',
    intro: {
      headline: 'Tune by ear or microphone',
      description:
        'Play a string into your mic and watch the needle, or match the reference tone by ear. Guitar, bass, ukulele, and violin presets included.',
    },
    instrument: 'acoustic-guitar',
    render: () => <GuitarTuner />,
  },
  {
    id: 'rhythm',
    title: 'Rhythm & Metronome',
    group: 'Practice',
    label: 'Rhythm',
    intro: {
      headline: 'Lock in the groove',
      description:
        'Set a tempo and time signature, then practise counting and keeping time against a beat you can see and hear.',
    },
    instrument: 'acoustic-guitar',
    render: () => <RhythmMetronome />,
  },
  {
    id: 'fretboard',
    title: 'Guitar Fretboard',
    group: 'Fretboard',
    label: 'Fretboard',
    intro: {
      headline: 'Read exact guitar press positions',
      description:
        'Choose any chord and see precisely which frets and strings to press, with every sounding note named on the neck.',
    },
    instrument: 'acoustic-guitar',
    visibleFor: 'guitar',
    render: (context) => (
      <>
        <div className="glass-card">
          <FretboardChordPicker
            activeChord={context.activeChord}
            onSelect={context.setActiveChord}
          />
        </div>

        <GuitarFretboard
          activeChord={context.activeChord}
          activeScaleNotes={context.activeScaleNotes}
          rootNote={context.selectedRoot}
          context={context}
        />
      </>
    ),
  },
  {
    id: 'scales',
    title: 'Scales & Modes',
    group: 'Fretboard',
    label: 'Scales',
    intro: {
      headline: 'Explore scales and modes',
      description:
        'Pick a root and a scale, then hear the notes and watch them light up across the fretboard or piano.',
    },
    instrument: 'acoustic-guitar',
    render: (context) => (
      <>
        <ScaleExplorer
          selectedRoot={context.selectedRoot}
          onRootChange={context.setSelectedRoot}
          onScaleNotesChange={context.setActiveScaleNotes}
          context={context}
        />
        <div className="dual-visualizers-grid">
          {context.visualizer === 'guitar' ? (
            <GuitarFretboard
              activeScaleNotes={context.activeScaleNotes}
              rootNote={context.selectedRoot}
              context={context}
            />
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
    intro: {
      headline: 'Hear the distance between two notes',
      description:
        'Play any interval, compare it against the rest, and train your ear to recognise each one by sight and by sound.',
    },
    instrument: 'piano',
    render: (context) => <IntervalExplorer context={context} />,
  },
  {
    id: 'workbench',
    title: 'Chord Studio',
    group: 'Harmony',
    label: 'Chord Studio',
    intro: {
      kicker: 'Music theory, made visible',
      headline: 'Learn it by seeing it and hearing it',
      description:
        'Follow a song from its chord chart, compare chords side by side, read exact guitar press positions, tune with microphone pitch detection, and play every concept back in real time.',
    },
    instrument: 'acoustic-guitar',
    render: (context) => (
      <ChordWorkbench
        onSelectChordForFretboard={context.selectChordForFretboard}
        onOpenTuner={context.openTuner}
        instrument={context.instrument}
      />
    ),
  },
  {
    id: 'piano',
    title: 'Piano Visualizer',
    group: 'Harmony',
    label: 'Piano',
    intro: {
      headline: 'See chords on the keyboard',
      description:
        'The active chord or scale lights up on a full piano — click any key to hear it and check its note name.',
    },
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
    intro: {
      headline: 'Start with the basics',
      description:
        'A visual cheat sheet for reading chord cards, counting half and whole steps, and building chords from scratch.',
    },
    instrument: 'acoustic-guitar',
    render: () => <TheoryCheatSheet />,
  },
  {
    id: 'contact',
    title: 'Contact',
    group: 'Project',
    label: 'Contact',
    intro: {
      headline: 'Get in touch',
      description:
        'Questions, feedback, or a bug you spotted? Reach out — and read the licence and the note on song charts while you are here.',
    },
    instrument: 'acoustic-guitar',
    // Reachable from the footer: the rail stays a pure study plan.
    railHidden: true,
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
