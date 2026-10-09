# Architecture

How Musix is put together: runtime model, state ownership, rendering flow, audio flow,
and the data pipeline.

## Runtime model

Musix is a **browser-only static site**. There is no backend, no API, no database, and no
server-side rendering.

```
index.html
  └─ <div id="app">            ← mount point
  └─ <script src="/src/main.tsx">
        └─ src/main.tsx        createRoot(#app).render(<App/>)  in StrictMode
              └─ src/App.tsx   screen shell + all shared state
                    └─ src/components/*   one component per tool
```

- `index.html` loads Google Fonts, `src/style.css`, and the React entry.
- `src/main.tsx` mounts `<App />` into `#app` and also imports `./style.css`.
- `src/App.tsx` is the single source of truth for cross-tab state and routing.

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Entry / shell | `index.html`, `src/main.tsx`, `src/App.tsx` | Mount, tab routing, shared state |
| Screens | `src/components/*.tsx` | One interactive tool each |
| Theory engine | `src/utils/musicTheory.ts` | Note tables, transposition, fret math, pitch detection |
| Audio engine | `src/utils/audio.ts` | Web Audio synthesis singleton |
| Static data | `src/data/*.ts` | Chords, scales, intervals in TS form |
| Shared types | `src/types.ts` | Interfaces used by every layer |
| Bundled JSON | `public/data/*.json` | Same theory data as plain files |
| Reference source | `music-theory-reference/` | Hand-written theory notes + JSON source |
| Tooling | `scripts/build-pages.ts` | Copies reference JSON into `public/data/` |
| Theme | `src/style.css` | The only stylesheet |

## State ownership

All shared state lives in `App` and flows down as props. Components keep only local UI
state (e.g. which mic preset is selected, which cards exist).

| State (in `App`) | Type | Default | Purpose |
| --- | --- | --- | --- |
| `activeTab` | `string` | from URL hash, else `'workbench'` | Which screen renders |
| `selectedRoot` | `NoteName` | `'C'` | Shared key for scales, fretboard, piano |
| `activeChordForFretboard` | `ChordShape \| null` | first built-in chord | Chord shown on the fretboard/piano |
| `selectedVisualizer` | `'piano' \| 'guitar'` | `'piano'` (guitar on `#fretboard`) | Which visualizer tab is exposed |
| `activeScaleNotes` | `NoteName[]` | C major | Notes highlighted by the visualizer |
| `userOverride` | `InstrumentType \| 'auto'` | `'auto'` | Whether the user locked an instrument |

### Cross-screen flows

1. **Key chip → everything.** The hero "Active Key" chips call `setSelectedRoot`, which
   feeds `ScaleExplorer`, `GuitarFretboard`, and `PianoKeyboard`.
2. **Scales → visualizer.** `ScaleExplorer` reports its computed notes through
   `onScaleNotesChange` → `setActiveScaleNotes` → the piano/fretboard in the same tab.
3. **Chord studio → fretboard.** `ChordWorkbench` calls
   `onSelectChordForFretboard(chord)`, which sets the chord, forces the guitar
   visualizer, and switches to `#fretboard`.
4. **Instrument lock.** `Header` calls `setUserOverride`; `soundEngine.setInstrument`
   is updated here and again in an `App` effect whenever the tab changes while
   `userOverride === 'auto'`.

## Routing

Routing is hash-based and dependency-free, in two files:

- **`src/routes.tsx` — the route table.** One `RouteDefinition` per screen carries the
  fragment id, top-bar title, rail group/label/hint, the instrument that screen uses in
  Auto mode, and a `render(context)` function. `App` renders from it, `Header` builds the
  rail from it, and `TopBar` titles the screen from it, so those three cannot drift.
- **`src/utils/router.ts` — the address.** `readHashRoute(validIds, fallback)` strips the
  `#`, tolerates a leading `/`, normalizes case, and returns the id only when it is known;
  `writeHashRoute(id)` sets the fragment without duplicating history entries; and
  `subscribeToRoute(listener)` wires both `hashchange` and `popstate` and returns the
  unsubscribe function.

Consequences worth knowing:

- **Every screen is code-split.** `routes.tsx` imports each component through `React.lazy`,
  and `App` wraps the render in `<Suspense fallback={<ScreenLoading …/>}>`. The first paint
  carries the shell plus the opened screen only.
- **Deep links work anywhere.** Because routes live in the fragment, no static host needs a
  rewrite rule: `#songs`, `#contact`, and `#/contact` all resolve.
- **Opening `#fretboard` or `#piano` selects the matching visualizer**
  (`visualizerForRoute`), so the rail never hides the screen that is on display.
- **Piano and Fretboard share one rail slot.** `Header` filters on `visibleFor`, so the
  visualizer toggle is the single control for that pair.
- Adding a screen is two steps: add an entry to `ROUTES`, and import the component lazily.
  `src/routes.test.ts` asserts the table's invariants (unique ids, required metadata, known
  instruments, one route per visualizer), and `src/utils/router.test.ts` covers the hash
  helpers against a stubbed `window`.

## Audio architecture

`src/utils/audio.ts` exports one shared `SoundEngine` instance. Components never create
their own audio graph for app sounds; they call the singleton.

```
component → soundEngine.playNote / strumChord / playClick
              → lazy AudioContext init + resume
              → instrument-specific node graph
              → ctx.destination
```

- The context is created on first sound (browsers require a user gesture) and resumed if
  it was suspended.
- Instrument selection is a single field on the engine, so a lock set in the header
  applies everywhere.
- Every method is wrapped in `try/catch` and fails silently, so unsupported audio never
  breaks the UI.

The tuner is the one exception: `GuitarTuner` builds its own `AudioContext` +
`AnalyserNode` for input analysis, and closes it on stop.

## Data flow

There are two independent copies of the theory data, and they serve different consumers.

```
music-theory-reference/                (hand-written source of truth)
  01-foundations/*.md                  prose reference pages
  02-harmony-and-analysis/*.md
  03-instrument-mappings/guitar/*.md
  04-data/*.json                       structured source data
  templates/*.md                       authoring template
  scripts/generate_fretboard_data.py   generator that produced the fretboard map

scripts/build-pages.ts  ──copies──▶  public/data/*.json   (served statically)

src/data/chordsData.ts   ─┐
src/data/scalesData.ts   ─┼──▶ imported directly by components (bundled by Vite)
src/utils/musicTheory.ts ─┘
```

- The **TS data files** are what the running app reads; Vite bundles them.
- The **JSON files** are a parallel, language-agnostic copy that a tool or a person can
  read without a build step. `scripts/build-pages.ts` regenerates them from
  `music-theory-reference/04-data/`.
- Editing theory content therefore means editing the source under
  `music-theory-reference/` (and/or the TS data) and keeping both copies in mind.

## Rendering model

- **No external state library, router, or UI framework.** React `useState` / `useEffect`
  / `useRef` / `useCallback` only, plus plain CSS classes.
- The app root (`div.musix-app-root`) is a two-column flex shell: `Header` renders the
  left navigation rail (`nav.nav-rail`), and `div.musix-main-column` holds `TopBar`, the
  `main.main-content-container` (screen hero + active tab), and the footer. Below 900px
  the rail becomes a scrollable top strip and the top bar stops being sticky.
- The visual language is defined by the design tokens in `:root` (`src/style.css`): warm
  surfaces, one brass accent, and shared radii / elevation / motion primitives. Components
  read tokens rather than hardcoding color.
- Every screen is a self-contained card component (`.glass-card`), so tabs can be
  developed in isolation without touching the shell.
- Strict TypeScript with `noUncheckedIndexedAccess` is enabled, so data lookups use
  guarded access and the "safe" helper variants in `musicTheory.ts` / `chordsData.ts`.

## Extending the architecture

- **New screen** → add one `RouteDefinition` to `ROUTES` in `src/routes.tsx` with a lazily
  imported component. That is the whole change: the rail, the top-bar title, the deep link,
  the Auto-mode instrument, and the code split all follow from the entry.
- **New scale / interval** → add to `src/data/scalesData.ts` (and the JSON source if the
  bundled copy should match).
- **New chord** → add to `COMPREHENSIVE_CHORDS` in `src/data/chordsData.ts`.
- **New instrument** → add a case to `playNote` in `src/utils/audio.ts`, extend
  `InstrumentType`, and add an option in `TopBar.tsx`.
- **New note-level helper** → put it in `src/utils/musicTheory.ts` rather than in a
  component, so all tabs share one implementation.
