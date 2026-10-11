import React, { useEffect, useState } from 'react';
import { Icon } from './Icon';
import {
  PREFERENCE_KEYS,
  isStringList,
  readPreference,
  writePreference,
} from '../utils/preferences';

/** One tickable topic in the guide's syllabus. */
interface GuideTopic {
  id: string;
  title: string;
  /** Lead-in shown when the topic is expanded. */
  info: string;
  /** Detailed key points — the meat of the topic, shown as a list under `info`. */
  details: string[];
  /** Screen that practises this topic, when one exists. */
  screen?: { label: string; route: string };
}

interface GuideSection {
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  topics: GuideTopic[];
}

/**
 * The complete beginner syllabus at top level, mirroring the sections of the repo's own
 * reference notes (`music-theory-reference/01..03`), plus the playing skills the app
 * practises. Ticking a topic is a self-assessment: "I can explain this without looking".
 */
const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Foundations',
    icon: 'bulb',
    topics: [
      { id: 'pitch', title: 'Pitch & the musical alphabet',
            info: "Pitch is how fast something vibrates — higher pitch, faster vibration. The musical alphabet runs A to G and then repeats, with sharps (♯) and flats (♭) filling the gaps. On the fretboard every fret is one half step up.",
            details: [
                "The 12 pitch classes: C C♯ D D♯ E F F♯ G G♯ A A♯ B — then the cycle repeats at the next octave.",
                "Equal temperament divides the octave into 12 equal semitones, so every key and every chord works in tune.",
                "Scientific pitch notation names the octave: middle C is C4, and the reference pitch A4 = 440 Hz.",
            ],
      },
      { id: 'intervals', title: 'Intervals',
            info: "The distance between two pitches, counted in half steps — one fret on guitar, one key on piano. Names like minor 3rd (3 semitones), perfect 5th (7), and octave (12) describe both the size and the character of the jump.",
            details: [
                "Name an interval two ways at once: quantity (count letter names — C to G spans 5 letters, so it is a fifth) and quality (major, minor, perfect, diminished, augmented).",
                "Countable sizes in semitones: m3 = 3, M3 = 4, P4 = 5, tritone = 6, P5 = 7, m7 = 10, P8 = 12.",
                "Consonance grades from stable (octave, fifth) to tense (tritone) — that tension is what resolutions release.",
                "Every scale, chord, and melody is built from interval relationships; learn the twelve well and everything else is assembly.",
            ],
            screen: { label: "Intervals", route: "intervals" },
      },
      { id: 'scale-formulas', title: 'Scale formulas',
            info: "A scale is a recipe of whole (W) and half (H) steps from a root. Major is W-W-H-W-W-W-H; natural minor is W-H-W-W-H-W-W. Pentatonic scales trim the recipe down to five notes.",
            details: [
                "Scale degrees are numbered from the root (1̂ 2̂ 3̂ …) so a formula reads the same in any key.",
                "Major = 2-2-1-2-2-2-1 semitones; natural minor = 2-1-2-2-1-2-2. Same seven letters, different mood — A minor and C major share every note.",
                "Variants from the same recipe: harmonic minor raises the 7th (leading tone), melodic minor raises the 6th and 7th going up.",
                "Pentatonics trim the recipe to five notes — major pentatonic drops degrees 4 and 7, minor pentatonic drops 2 and 6.",
            ],
            screen: { label: "Scales", route: "scales" },
      },
      { id: 'chord-construction', title: 'Chord construction',
            info: "Chords are built by stacking thirds on a scale. A triad is root + 3rd + 5th: major (4 + 3 semitones) sounds bright, minor (3 + 4) sounds dark. Add one more third and you have a seventh chord.",
            details: [
                "Stack alternate scale degrees: root + 3rd + 5th makes a triad; add one more third for a seventh chord.",
                "The four triad qualities in semitones: major (4+3), minor (3+4), diminished (3+3), augmented (4+4).",
                "Seventh chords add colour and pull: dominant 7th (major triad + minor 7th) wants to resolve; major 7th stays smooth, minor 7th sounds mellow.",
                "Inversions (3rd or 5th in the bass) keep the bass line smooth while the chord stays the same.",
            ],
            screen: { label: "Chord Studio", route: "workbench" },
      },
      { id: 'rhythm-meter', title: 'Rhythm & meter',
            info: "Rhythm is when notes happen. Beats group into bars by the time signature — 4/4 counts four quarter-note beats per bar. Tempo is the speed of one beat, measured in BPM.",
            details: [
                "The hierarchy: pulse (steady tap) → meter (grouped strong/weak beats) → rhythm (what you actually play).",
                "Duration ladder: whole → half → quarter → eighth → sixteenth, each half the last; a dot adds half again.",
                "Time signature: bottom number is the beat unit (4 = quarter note), top is beats per bar — 3/4 waltzes, 4/4 rocks, 6/8 swings in two.",
                "Tempo measures the pulse in BPM: 120 BPM = 2 beats per second. Faster tempo or a busier subdivision both raise perceived speed.",
            ],
            screen: { label: "Rhythm", route: "rhythm" },
      },
    ],
  },
  {
    title: 'Harmony & analysis',
    icon: 'staff',
    topics: [
      { id: 'circle-of-fifths', title: 'Circle of fifths',
            info: "A clock face of keys: each step clockwise raises by a perfect fifth (C → G → D …). Opposite keys hold the same notes as relative major/minor pairs, and the face shows which sharps or flats each key signature carries.",
            details: [
                "Clockwise adds a sharp each step: C → G (1♯) → D (2♯) → A (3♯) → E (4♯) → B (5♯). Counter-clockwise adds flats: C → F (1♭) → B♭ (2♭) …",
                "Each step is 7 semitones; the fourth below (5 semitones) is the same face — so a fifth up and a fourth down land on the same key.",
                "Opposite faces are relative pairs: C major / A minor share a key signature and every note.",
                "Chords a fifth apart pull hard — the V → I motion at the circle's core is the strongest resolution in tonal music.",
            ],
      },
      { id: 'diatonic-harmony', title: 'Diatonic harmony (I–vi–IV–V)',
            info: "In any key the chords built on each scale degree follow a pattern — in a major key: I, ii, iii, IV, V, vi, vii°. Most pop songs lean on four of them, like I–V–vi–IV.",
            details: [
                "Build a triad on each degree of C major: C, Dm, Em, F, G, Am, B° — uppercase for major, lowercase for minor, ° for diminished.",
                "Primary triads (I, IV, V) carry the progression; the others (ii, iii, vi) colour the space between them.",
                "Three functions drive everything: tonic (rest — I, vi), predominant (motion — ii, IV), dominant (tension — V, vii°).",
                "Extend the same stacking to four notes and each degree grows a seventh chord: Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7♭5.",
            ],
            screen: { label: "Chord Studio", route: "workbench" },
      },
      { id: 'voice-leading', title: 'Voice leading',
            info: "When chords change, each note should travel as little as possible into the next chord. Small, smooth moves between voicings make a progression sound connected instead of jumpy.",
            details: [
                "Move each voice the smallest distance possible into the next chord; a step beats a leap, a held note beats a move.",
                "Common tones stay put — the note both chords share should not jump octave for no reason.",
                "Voicing (which octave each chord tone sits in, what is doubled or dropped) decides how smooth the leading can be.",
                "Watch for parallel fifths and octaves: two voices sliding together at that distance erases their independence.",
            ],
      },
      { id: 'roman-numerals', title: 'Roman numeral analysis',
            info: "A way to name chords by their job in the key instead of their letter: C–G–Am–F in C major is I–V–vi–IV. Analyse a song once this way and you can transpose it to any key.",
            details: [
                "Case encodes quality: I major, i minor, V7 dominant seventh, viio diminished — the numeral names the job, not the letter.",
                "In C major, C–G–Am–F is I–V–vi–IV; transpose the numerals to any key and the song follows.",
                "Inversions get figured numbers: V⁶ is V with the third in the bass, I⁶₄ is the classic cadential 6-4.",
                "Analysing by function (tonic / predominant / dominant) exposes why a progression works — and where to substitute.",
            ],
      },
    ],
  },
  {
    title: 'On the guitar',
    icon: 'guitar',
    topics: [
      { id: 'fretboard-layout', title: 'Fretboard layout & standard tuning',
            info: "Six strings tuned E–A–D–G–B–E, thickest to thinnest. Each fret up raises one half step; position dots mark frets 3, 5, 7, 9 and 12, and the 12th fret is the octave of the open string.",
            details: [
                "Standard tuning E2–A2–D3–G3–B3–E4: each string a fourth up, except the G–B gap which is a major third.",
                "Every fret is one semitone; the 12th fret lands exactly one octave above the open string (same note name, double the frequency).",
                "Fret markers sit at 3, 5, 7, 9, 12 — the double dot at 12 is the neck's halfway octave landmark.",
                "The same note often exists in several places; learning which fingering suits the phrase is half of fretboard fluency.",
            ],
            screen: { label: "Fretboard", route: "fretboard" },
      },
      { id: 'caged', title: 'CAGED system & movable shapes',
            info: "Five open shapes — C, A, G, E, D — tile the whole neck. Slide one up with a barre finger and it becomes a movable chord in any key; the shapes connect in that same C-A-G-E-D order.",
            details: [
                "Five open shapes — C, A, G, E, D — connect across the neck in that repeating order (the name of the system).",
                "Barre any open shape up the neck and it becomes movable: E-shape at fret 5 is an A chord, A-shape at fret 5 is a D.",
                "Each shape is a map of chord tones, not just a grip — the root position tells you where you are in any key.",
                "One chord, five shapes: picking the nearest shape to where you already are keeps changes small and smooth.",
            ],
            screen: { label: "Fretboard", route: "fretboard" },
      },
      { id: 'scale-boxes', title: 'Scale box patterns & 3NPS',
            info: "Scale patterns repeat in small 'boxes' across the neck so your hand can stay in one position. Three-notes-per-string (3NPS) versions spread the same notes evenly for alternate picking.",
            details: [
                "A box is a comfortable 4–5 fret region with a fixed finger-per-fret pattern; learn five and the whole neck connects.",
                "3NPS (three notes per string) runs the same scale in even groups — ideal for alternate picking and legato drills.",
                "Boxes overlap: the last notes of one box are the first of the next, so you can slide between them without a visual jump.",
                "Anchor boxes to their root or pentatonic skeleton so every pattern still tells you where the key lives.",
            ],
            screen: { label: "Scales", route: "scales" },
      },
      { id: 'alternate-tunings', title: 'Alternate tunings',
            info: "Standard tuning is not the only option. Drop D lowers the low E a whole step for easy power chords; open tunings (D, G) let a fretless strum ring a full chord — favourites for slide and open-chord writing.",
            details: [
                "Drop D: low E down a whole step — one finger bars all six strings for a D power chord, and the low range opens up.",
                "Open tunings (open G, open D, DADGAD) let every string ring as a full chord unfretted — the slide-guitar standard.",
                "Alternate keys like D-G-D-G-B-D tune to a chord, making open-string drones and folk voicings easy.",
                "Retuning changes fret spacing and tension: check intonation at the 12th fret and expect familiar shapes to shift slightly.",
            ],
            screen: { label: "Tuner", route: "tuner" },
      },
      { id: 'drop-chords', title: 'Triads & drop chords',
            info: "A triad's three notes can be rearranged into inversions; dropping one note an octave makes guitar-friendly drop-2 and drop-3 voicings. Smaller than full barre chords, they cut through a band.",
            details: [
                "A triad in three positions: root position, 1st inversion (3rd in bass), 2nd inversion (5th in bass).",
                "Drop-2 takes the second-highest voice down an octave — the workhorse four-string jazz guitar voicing.",
                "Drop-3 does the same to the third voice: a wider, bass-friendly shape used for chord–melody and comping.",
                "Fewer notes, clearer voice: three or four strings ring clearer than a full barre in a band mix.",
            ],
            screen: { label: "Chord Studio", route: "workbench" },
      },
    ],
  },
  {
    title: 'Playing songs',
    icon: 'play',
    topics: [
      { id: 'chord-charts', title: 'Reading chord charts',
            info: "Songs are written as chord names over lyric lines, sometimes with bar lines or rhythm slashes. The chord lands on the syllable above it, |: :| means repeat, and G/B means play G with B in the bass.",
            details: [
                "The chord sits above the exact syllable where it changes — if it lands between words, change on that beat.",
                "|: :| repeats, 1. / 2. endings split the pass, and a bar line | marks one measure of the time signature.",
                "Colour codes on charts: Cm is minor, C7 is dominant, C△7 is major seventh; C/B puts B in the bass.",
                "Common shorthand: N.C. = no chord (rhythm only), x/4 = the measure where playback loops, and fret numbers above a staff mean a capo or position shift.",
            ],
            screen: { label: "Songs", route: "songs" },
      },
      { id: 'tuning', title: 'Tuning by ear or microphone',
            info: "Match each string to a reference pitch. The Tuner listens through your microphone and shows when you are sharp or flat; tune up to the pitch, never past it, and re-check string 1 last.",
            details: [
                "Standard reference: E4 A4 D4 G4 B3 E4 (strings 1–6); A4 = 440 Hz is the tuning fork the world agrees on.",
                "The pitch wheel shows cents — the target string glows when you are within roughly ±5 cents.",
                "Always tune up to the pitch, never down past it: approaching from below seats the string evenly on the nut and saddle.",
                "Check with harmonics: 5th-fret harmonic of one string should match the open string above it (except G to B).",
            ],
            screen: { label: "Tuner", route: "tuner" },
      },
      { id: 'ear-training', title: 'Ear training with intervals',
            info: "Name the distance between two notes you hear. Anchor the landmarks first — a major 3rd is 'Oh When the Saints', a perfect 5th is 'Star Wars', an octave is 'Somewhere Over the Rainbow' — then drill the rest.",
            details: [
                "Train recognition, not just singing: hear two notes, name the distance, then check yourself against the screen.",
                "Interval anchors to songs: m2 = Jaws, M3 = Oh When the Saints, P4 = Here Comes the Bride, P5 = Star Wars, P8 = Somewhere Over the Rainbow.",
                "Start with the wide, obvious ones (octave, fifth) and work inward — tritones and seconds are the last to get easy.",
                "Do it in context too: the V–I cadence is a P5 falling, the blues riff lives on the minor 3rd and minor 7th.",
            ],
            screen: { label: "Intervals", route: "intervals" },
      },
    ],
  },
];

const ALL_TOPIC_IDS = new Set(
  GUIDE_SECTIONS.flatMap((section) => section.topics.map((topic) => topic.id))
);
const TOTAL_TOPICS = ALL_TOPIC_IDS.size;

export const TheoryCheatSheet: React.FC = () => {
  // Topics the learner has ticked. Stored ids are filtered against the live syllabus, so
  // a renamed or removed topic never counts toward progress after an update.
  const [done, setDone] = useState<string[]>(() =>
    readPreference(PREFERENCE_KEYS.guideProgress, [], isStringList).filter((id) =>
      ALL_TOPIC_IDS.has(id)
    )
  );

  // One info panel open at a time keeps the syllabus scannable; null = all collapsed.
  const [openTopic, setOpenTopic] = useState<string | null>(null);

  useEffect(() => writePreference(PREFERENCE_KEYS.guideProgress, done), [done]);

  const toggleTopic = (id: string) => {
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const percent = Math.round((done.length / TOTAL_TOPICS) * 100);

  return (
    <>
    <div className="glass-card">
      <div>
        <span className="section-badge inline-flex items-center gap-1.5">
          <Icon name="book" /> Beginner Starter Guide
        </span>
        <h2>Visual Music Theory Basics</h2>
        <p>
          Tick each topic once you can explain it without looking — your progress is saved on
          this device. Open a topic's summary for its detailed key points and the screen that
          practises it; the cards below are the quick reference for the first steps.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.07)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="text-[30px] font-extrabold leading-none tabular-nums text-accent"
              aria-hidden="true"
            >
              {percent}%
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="text-[15px] font-bold text-ink">Your progress</h3>
              <span className="text-[13px] text-ink-soft" role="status" aria-live="polite">
                {done.length} of {TOTAL_TOPICS} topics ticked
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            data-tip="Clear every ticked topic on this device"
            onClick={() => setDone([])}
          >
            Reset
          </button>
        </div>
        <div
          className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[rgba(var(--inset-rgb),0.3)] shadow-[inset_0_1px_2px_rgba(var(--inset-rgb),0.35)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TOTAL_TOPICS}
          aria-valuenow={done.length}
          aria-label="Guide progress"
        >
          <div
            className="h-full rounded-full bg-[linear-gradient(135deg,var(--accent-primary)_0%,#c98a3f_100%)] shadow-[0_0_12px_rgba(var(--accent-rgb),0.5)] transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {GUIDE_SECTIONS.map((section) => {
          const sectionDone = section.topics.filter((topic) => done.includes(topic.id)).length;
          return (
            <div key={section.title}>
              <div className="flex items-center justify-between gap-3">
                <h4 className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-hairline bg-[rgba(var(--accent-rgb),0.12)] text-accent">
                    <Icon name={section.icon} size={15} />
                  </span>
                  {section.title}
                </h4>
                <span className="rounded-full border border-hairline bg-[rgba(var(--overlay-rgb),0.05)] px-2.5 py-1 text-[12px] font-bold tabular-nums text-ink-soft">
                  {sectionDone}/{section.topics.length}
                </span>
              </div>
              <div className="mt-2 overflow-hidden rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)]">
                {section.topics.map((topic, index) => {
                  const isDone = done.includes(topic.id);
                  const isOpen = openTopic === topic.id;
                  return (
                    <div
                      key={topic.id}
                      className={index === 0 ? undefined : 'border-t border-hairline'}
                    >
                      <div className="flex items-center gap-2.5 p-2.5">
                        <button
                          type="button"
                          aria-pressed={isDone}
                          aria-label={topic.title}
                          data-tip={
                            isDone
                              ? `Tick off "${topic.title}" again to reopen it`
                              : `Mark "${topic.title}" as understood`
                          }
                          className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center appearance-none rounded-md border transition-all duration-200 ${
                            isDone
                              ? 'border-accent bg-[linear-gradient(135deg,var(--accent-primary)_0%,#c98a3f_100%)] text-black shadow-[0_0_10px_var(--accent-primary)]'
                              : 'border-hairline bg-[rgba(var(--overlay-rgb),0.05)] text-transparent hover:border-[rgba(var(--accent-rgb),0.55)] hover:text-ink-muted'
                          }`}
                          onClick={() => toggleTopic(topic.id)}
                        >
                          <Icon name="check" size={12} />
                        </button>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`guide-info-${topic.id}`}
                          className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 rounded-lg border-0 bg-transparent px-2.5 py-1.5 text-left font-[inherit] transition-colors hover:bg-[rgba(var(--accent-rgb),0.08)]"
                          onClick={() => setOpenTopic(isOpen ? null : topic.id)}
                        >
                          <span
                            className={`text-[13px] font-semibold ${isDone ? 'text-ink-soft' : 'text-ink'}`}
                          >
                            {topic.title}
                          </span>
                          <span
                            className={`inline-flex shrink-0 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-accent' : 'text-ink-muted'
                            }`}
                            data-tip={isOpen ? 'Hide the summary' : 'Read the summary'}
                            aria-hidden="true"
                          >
                            <Icon name="chevron" size={14} />
                          </span>
                        </button>
                      </div>
                      {isOpen && (
                        <div
                          id={`guide-info-${topic.id}`}
                          className="border-t border-hairline bg-[rgba(var(--accent-rgb),0.07)] px-4 py-3 text-[13px] leading-relaxed text-ink-soft"
                        >
                          <p>{topic.info}</p>
                          <ul className="mt-2 flex list-none flex-col gap-1.5">
                            {topic.details.map((point) => (
                              <li
                                key={point}
                                className="flex gap-2 text-[13px] leading-relaxed text-ink-soft"
                              >
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                          {topic.screen && (
                            <p className="mt-2 text-[12px] font-semibold">
                              <span className="text-ink-muted">Practise it on the </span>
                              <a
                                className="font-bold text-accent hover:underline"
                                href={`#${topic.screen.route}`}
                              >
                                {topic.screen.label}
                              </a>
                              <span className="text-ink-muted"> screen.</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>

    <section className="mt-6">
      <div className="flex items-center gap-3">
        <h3 className="text-[18px] font-bold text-ink">Quick reference</h3>
        <span className="h-px flex-1 bg-hairline" aria-hidden="true" />
      </div>

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="guitar" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Reading Guitar Cards</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Strings 6 to 1:</strong> String 6 is the thickest (Low E, bottom). String 1 is the thinnest (High E, top).</li>
            <li><strong>Fret Numbers:</strong> Numbers like <code>1, 2, 3</code> tell you which fret space to press.</li>
            <li><strong>Finger Numbers:</strong> 1 = Index, 2 = Middle, 3 = Ring, 4 = Pinky.</li>
            <li><strong>Symbols:</strong> <code>○</code> means play string open. <code>✕</code> means mute the string.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="piano" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Half Steps & Whole Steps</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Half Step (Semitone):</strong> Moving 1 key on piano or 1 fret on guitar (e.g. C ➔ C♯, or E ➔ F).</li>
            <li><strong>Whole Step (Tone):</strong> Moving 2 keys on piano or 2 frets on guitar (e.g. C ➔ D, or F ➔ G).</li>
            <li><strong>Sharps (♯):</strong> Raise note by 1 half step.</li>
            <li><strong>Flats (♭):</strong> Lower note by 1 half step.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="staff" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Building Chords</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Major Triad:</strong> Root (1) + Major 3rd (4 semitones) + Perfect 5th (7 semitones). Happy sound.</li>
            <li><strong>Minor Triad:</strong> Root (1) + Minor 3rd (3 semitones) + Perfect 5th (7 semitones). Sad/Somber sound.</li>
            <li><strong>Dominant 7th:</strong> Major Triad + Flat 7th. Bluesy, tense sound pointing back to root.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="notes" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Scale Formulas</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>W and H:</strong> W = whole step (2 frets), H = half step (1 fret). Every scale is a recipe of W's and H's from the root.</li>
            <li><strong>Major (Ionian):</strong> W-W-H-W-W-W-H — bright, happy. C major is C D E F G A B.</li>
            <li><strong>Natural Minor (Aeolian):</strong> W-H-W-W-H-W-W — darker, sad. A minor uses the same white keys as C major.</li>
            <li><strong>Minor Pentatonic:</strong> five-note shortcut (0-3-5-7-10 semitones) that skips the edgy steps — the backbone of guitar solos.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="ruler" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Pitch Movement (Intervals)</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Count in frets:</strong> an interval is the distance between two notes, counted in half steps (semitones) — one fret on guitar, one key on piano.</li>
            <li><strong>m3 vs M3:</strong> 3 semitones (m3) makes a chord minor; 4 semitones (M3) makes it major. That one-fret shift changes the whole mood.</li>
            <li><strong>P5 (7 frets):</strong> the open, powerful fifth — a power chord is root + P5 only. <strong>P8 (12 frets):</strong> the octave, the same note higher.</li>
            <li><strong>Ear anchors:</strong> “Here Comes the Bride” is a P4; the “Jaws” theme is an m2. The Intervals screen plays every one of these.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-hairline bg-[rgba(var(--overlay-rgb),0.03)] p-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.35)]">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-hairline bg-[rgba(var(--accent-rgb),0.1)] text-accent">
            <Icon name="play" size={20} />
          </div>
          <h3 className="mb-3 text-[18px]">Practise it here</h3>
          <ul className="flex list-none flex-col gap-2 text-[14px] text-ink-soft">
            <li><strong>Chord cards on the neck:</strong> <a className="font-bold text-accent hover:underline" href="#fretboard">Fretboard</a> shows every press position.</li>
            <li><strong>Scales &amp; modes:</strong> <a className="font-bold text-accent hover:underline" href="#scales">Scales</a> lights up the notes as you hear them.</li>
            <li><strong>Intervals by ear:</strong> <a className="font-bold text-accent hover:underline" href="#intervals">Intervals</a> plays each distance with a song anchor.</li>
            <li><strong>Compare chords:</strong> <a className="font-bold text-accent hover:underline" href="#workbench">Chord Studio</a> puts voicings side by side.</li>
            <li><strong>Tune up:</strong> <a className="font-bold text-accent hover:underline" href="#tuner">Tuner</a> listens through your microphone. <strong>Songs:</strong> <a className="font-bold text-accent hover:underline" href="#songs">Songs</a> puts it together over a chord chart.</li>
          </ul>
        </div>
      </div>
    </section>
    </>
  );
};
