// Saved progressions are the one place the app writes learner data that outlives the tab,
// so these tests cover the two ways that can go wrong: a saved set that comes back as the
// wrong chords, and a stored value from another build that half-loads.

import {
  MAX_PROGRESSION_NAME,
  MAX_SAVED_PROGRESSIONS,
  cardsFromSavedCards,
  cardsFromSavedProgression,
  isSavedProgressionList,
  isStudioBoard,
  removeSavedProgression,
  saveProgression,
  suggestProgressionName,
  toSavedCards,
  type SavedProgression,
} from './savedProgressions';
import type { ChordCardItem } from '../types';
import { findOrCreateChord } from '../data/chordsData';

const card = (root: Parameters<typeof findOrCreateChord>[0], type: string): ChordCardItem => ({
  id: `${root}-${type}`,
  chord: findOrCreateChord(root, type),
  transposeOffset: 0,
  fretPosition: 0,
});

const draft = {
  name: 'My blues',
  key: 'C' as const,
  cards: toSavedCards([card('C', 'Major'), card('F', 'Major'), card('G', 'Major')]),
};

describe('saving a progression', () => {
  test('stores only the choices, never the drawing', () => {
    // Storing frets would freeze a drawing the table may later correct.
    const saved = toSavedCards([card('C', 'Major')])[0]!;
    expect(saved).toEqual({ root: 'C', type: 'Major' });
  });

  test('keeps a fret position and a mute flag', () => {
    const moved: ChordCardItem = { ...card('C', 'Major'), fretPosition: 5, isMuted: true };
    expect(toSavedCards([moved])[0]).toEqual({ root: 'C', type: 'Major', fretPosition: 5, isMuted: true });
  });

  test('assigns an id and puts the new progression first', () => {
    const { list, saved } = saveProgression([], draft, 'id-1', 1000);
    expect(saved.id).toBe('id-1');
    expect(saved.savedAt).toBe(1000);
    expect(list).toHaveLength(1);
    expect(list[0]!.name).toBe('My blues');
  });

  test('saving under an existing name overwrites that entry instead of duplicating it', () => {
    const first = saveProgression([], draft, 'id-1', 1000);
    const second = saveProgression(
      first.list,
      { ...draft, name: '  my BLUES  ', key: 'G', cards: toSavedCards([card('G', 'Major')]) },
      'id-2',
      2000
    );
    expect(second.list).toHaveLength(1);
    // The id survives, so the picker's selection does not jump to a different entry.
    expect(second.saved.id).toBe('id-1');
    expect(second.list[0]!.key).toBe('G');
    expect(second.list[0]!.cards).toEqual([{ root: 'G', type: 'Major' }]);
  });

  test('trims and clips the name', () => {
    const long = 'x'.repeat(MAX_PROGRESSION_NAME + 20);
    const { saved } = saveProgression([], { ...draft, name: `  ${long}  ` });
    expect(saved.name).toHaveLength(MAX_PROGRESSION_NAME);
  });

  test('the library is capped, dropping the oldest', () => {
    let list: SavedProgression[] = [];
    for (let n = 0; n < MAX_SAVED_PROGRESSIONS + 3; n += 1) {
      list = saveProgression(list, { ...draft, name: `Song ${n}` }, `id-${n}`, n).list;
    }
    expect(list).toHaveLength(MAX_SAVED_PROGRESSIONS);
    expect(list[0]!.name).toBe(`Song ${MAX_SAVED_PROGRESSIONS + 2}`);
  });

  test('deleting removes exactly one entry', () => {
    const a = saveProgression([], draft, 'id-a', 1).list;
    const b = saveProgression(a, { ...draft, name: 'Other' }, 'id-b', 2).list;
    expect(removeSavedProgression(b, 'id-a').map((entry) => entry.id)).toEqual(['id-b']);
  });
});

describe('reopening a progression', () => {
  test('resolves the chords against the current table', () => {
    const cards = cardsFromSavedCards(
      [
        { root: 'C♯', type: 'Major' },
        { root: 'A', type: 'Minor' },
      ],
      'saved-x'
    );
    expect(cards.map((item) => item.chord.name)).toEqual(['C♯ Major', 'A Minor']);
    // The shape comes from the table, so a corrected grip is what gets drawn.
    expect(cards[0]!.chord.frets).toEqual(findOrCreateChord('C♯', 'Major').frets);
    expect(cards[0]!.id).toBe('saved-x-0');
  });

  test('restores mute flags and fret positions', () => {
    const saved: SavedProgression = {
      id: 'p1',
      name: 'Moved',
      key: 'D',
      cards: [{ root: 'D', type: 'Major', fretPosition: 3, isMuted: true }],
      savedAt: 1,
    };
    const [restored] = cardsFromSavedProgression(saved);
    expect(restored!.isMuted).toBe(true);
    expect(restored!.fretPosition).toBe(3);
  });

  test('keeps the order the learner built', () => {
    const restored = cardsFromSavedProgression({
      id: 'p1',
      name: 'Order',
      key: 'C',
      cards: [
        { root: 'G', type: 'Major' },
        { root: 'C', type: 'Major' },
        { root: 'F', type: 'Major' },
      ],
      savedAt: 1,
    });
    expect(restored.map((item) => item.chord.name)).toEqual(['G Major', 'C Major', 'F Major']);
  });
});

describe('reading a stored library', () => {
  const entry = {
    id: 'p1',
    name: 'My blues',
    key: 'C',
    cards: [{ root: 'C', type: 'Major' }],
    savedAt: 1700000000000,
  };

  test('accepts a well-formed library', () => {
    expect(isSavedProgressionList([entry])).toBe(true);
    expect(isSavedProgressionList([])).toBe(true);
  });

  test('rejects junk, partial entries and unknown notes', () => {
    expect(isSavedProgressionList('nonsense')).toBe(false);
    expect(isSavedProgressionList([{ ...entry, key: 'H' }])).toBe(false);
    expect(isSavedProgressionList([{ ...entry, cards: 'C' }])).toBe(false);
    expect(isSavedProgressionList([{ ...entry, cards: [{ root: 'C' }] }])).toBe(false);
    expect(isSavedProgressionList([{ ...entry, savedAt: Number.NaN }])).toBe(false);
    expect(isSavedProgressionList([{ ...entry, name: '   ' }])).toBe(false);
    expect(isSavedProgressionList([{ ...entry, cards: [] }])).toBe(false);
  });

  test('rejects a library past the ceiling', () => {
    const many = Array.from({ length: MAX_SAVED_PROGRESSIONS + 1 }, (_, n) => ({
      ...entry,
      id: `p${n}`,
    }));
    expect(isSavedProgressionList(many)).toBe(false);
  });

  test('accepts a stored working board, and rejects a broken one', () => {
    expect(isStudioBoard({ key: 'G', cards: [{ root: 'G', type: 'Major' }] })).toBe(true);
    expect(isStudioBoard({ key: 'H', cards: [{ root: 'G', type: 'Major' }] })).toBe(false);
    // Deleting every card is a choice, not corruption: an empty board reopens empty.
    expect(isStudioBoard({ key: 'G', cards: [] })).toBe(true);
    expect(isStudioBoard(null)).toBe(false);
  });

  test('a named progression still needs at least one card', () => {
    expect(isSavedProgressionList([{ ...entry, cards: [] }])).toBe(false);
  });
});

describe('suggestProgressionName', () => {
  test('names a loaded preset after the preset and its key', () => {
    expect(suggestProgressionName('12-bar blues', 'C', [])).toBe('12-bar blues in C');
  });

  test('does not silently overwrite an existing name', () => {
    expect(suggestProgressionName('12-bar blues', 'C', ['12-bar blues in C'])).toBe(
      '12-bar blues in C (2)'
    );
  });

  test('numbers hand-built progressions', () => {
    expect(suggestProgressionName(undefined, 'C', [])).toBe('My progression 1');
    expect(suggestProgressionName(undefined, 'C', ['My progression 1'])).toBe('My progression 2');
  });

  test('compares names case-insensitively', () => {
    expect(suggestProgressionName('ii–V–I', 'D', ['II–V–I IN D'])).toBe('ii–V–I in D (2)');
  });
});
