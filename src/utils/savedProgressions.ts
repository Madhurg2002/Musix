// The learner's own progressions, kept between sessions.
//
// Two things shape this file:
//
// 1. **Store the choices, not the drawing.** A saved card remembers a root, a quality, a
//    fret position and a mute flag — never frets, fingers, note names or difficulty. When
//    the chord table is corrected (as it has been: C♯ Major used to draw C Major's grip), a
//    saved progression picks up the corrected shape instead of resurrecting the old one.
// 2. **Validate on read.** The stored value comes from a cookie or `localStorage`, so it can
//    be anything: an older build's format, hand-edited text, a half-written entry. Anything
//    that is not a well-formed list of saved progressions is discarded whole rather than
//    half-rendered, and the studio falls back to its default board.
//
// Reading and writing live in `preferences.ts` (consent gate, cookie with a localStorage
// overflow); this module is pure so it can be unit tested without a DOM.

import type { ChordCardItem, NoteName } from '../types';
import { findOrCreateChord } from '../data/chordsData';
import { ALL_NOTES } from './musicTheory';

/** One card as it is stored: enough to rebuild the chord, and nothing more. */
export interface SavedCardItem {
  root: NoteName;
  type: string;
  fretPosition?: number;
  isMuted?: boolean;
}

export interface SavedProgression {
  id: string;
  name: string;
  /** The key the progression was built in — the chart numerals are read against it. */
  key: NoteName;
  cards: readonly SavedCardItem[];
  /** Epoch ms, so the picker can show newest first. */
  savedAt: number;
}

/** What the studio is holding right now, restored on the next visit. */
export interface StudioBoard {
  key: NoteName;
  cards: readonly SavedCardItem[];
}

/** A saved progression without the fields the store assigns. */
export interface ProgressionDraft {
  name: string;
  key: NoteName;
  cards: readonly SavedCardItem[];
}

/** Library ceiling: enough for a learner's songs, small enough for a cookie-sized store. */
export const MAX_SAVED_PROGRESSIONS = 24;
/**
 * Card ceiling. Well past any real song form (a twelve-bar blues is twelve), but finite so a
 * tampered stored value cannot bloat the store — and the studio refuses to add past it, so
 * a board can never be too long to reopen.
 */
export const MAX_SAVED_CARDS = 64;
export const MAX_PROGRESSION_NAME = 40;

/** A stored name is trimmed and clipped, so a pasted novel cannot fill the store. */
function cleanName(name: string): string {
  return name.trim().slice(0, MAX_PROGRESSION_NAME);
}

/** Stable ids without assuming `crypto.randomUUID` (it is absent on older Safari). */
export function newProgressionId(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return `prog-${random}`;
}

/** Reduce a live card to what the store keeps. */
export function toSavedCard(card: ChordCardItem): SavedCardItem {
  const saved: SavedCardItem = { root: card.chord.root, type: card.chord.type };
  if (card.fretPosition) saved.fretPosition = card.fretPosition;
  if (card.isMuted) saved.isMuted = true;
  return saved;
}

export function toSavedCards(cards: readonly ChordCardItem[]): SavedCardItem[] {
  return cards.map(toSavedCard);
}

/**
 * Rebuild live cards from stored ones, resolving each chord against the current table so a
 * saved progression always draws the shapes this build ships. `idPrefix` keeps React keys
 * stable per progression without colliding with hand-added cards.
 */
export function cardsFromSavedCards(
  cards: readonly SavedCardItem[],
  idPrefix: string
): ChordCardItem[] {
  return cards.map((card, index) => ({
    id: `${idPrefix}-${index}`,
    chord: findOrCreateChord(card.root, card.type),
    transposeOffset: 0,
    fretPosition: card.fretPosition ?? 0,
    isMuted: card.isMuted,
  }));
}

export function cardsFromSavedProgression(saved: SavedProgression): ChordCardItem[] {
  return cardsFromSavedCards(saved.cards, `saved-${saved.id}`);
}

/**
 * Save `draft` into the library. Saving under a name that is already taken overwrites that
 * entry (keeping its id, so the picker's selection survives); otherwise the new progression
 * goes to the front of the list. The oldest entries fall off the end at
 * `MAX_SAVED_PROGRESSIONS`.
 */
export function saveProgression(
  list: readonly SavedProgression[],
  draft: ProgressionDraft,
  id: string = newProgressionId(),
  savedAt: number = Date.now()
): { list: SavedProgression[]; saved: SavedProgression } {
  const name = cleanName(draft.name);
  const cards = draft.cards.slice(0, MAX_SAVED_CARDS);
  const existing = list.find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase()
  );

  const saved: SavedProgression = {
    id: existing?.id ?? id,
    name,
    key: draft.key,
    cards,
    savedAt,
  };

  const rest = list.filter((entry) => entry.id !== saved.id);
  return { list: [saved, ...rest].slice(0, MAX_SAVED_PROGRESSIONS), saved };
}

export function removeSavedProgression(
  list: readonly SavedProgression[],
  id: string
): SavedProgression[] {
  return list.filter((entry) => entry.id !== id);
}

/**
 * A sensible default name for the Save dialog: the preset that is loaded, otherwise a
 * numbered "My progression" so two saves on the same key do not silently overwrite.
 */
export function suggestProgressionName(
  presetName: string | undefined,
  key: NoteName,
  existingNames: readonly string[]
): string {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  if (presetName) {
    const base = `${presetName} in ${key}`;
    if (!taken.has(base.toLowerCase())) return base;
    for (let copy = 2; copy <= 9; copy += 1) {
      const candidate = `${base} (${copy})`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
    return base;
  }

  for (let n = 1; n <= 99; n += 1) {
    const candidate = `My progression ${n}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return 'My progression';
}

/* ----------------------------------------------------------------------------- validators */

const isNoteName = (value: unknown): value is NoteName =>
  typeof value === 'string' && (ALL_NOTES as readonly string[]).includes(value);

function isSavedCardItem(value: unknown): value is SavedCardItem {
  if (typeof value !== 'object' || value === null) return false;
  const card = value as Record<string, unknown>;
  if (!isNoteName(card.root)) return false;
  if (typeof card.type !== 'string' || card.type.length === 0 || card.type.length > 32) {
    return false;
  }
  if (card.fretPosition !== undefined) {
    const position = card.fretPosition;
    if (typeof position !== 'number' || !Number.isInteger(position) || position < 0 || position > 24) {
      return false;
    }
  }
  if (card.isMuted !== undefined && typeof card.isMuted !== 'boolean') return false;
  return true;
}

/** A stored card list. Empty is allowed: a learner may clear the board on purpose. */
export function isSavedCardList(value: unknown): value is SavedCardItem[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_SAVED_CARDS &&
    value.every(isSavedCardItem)
  );
}

function isSavedProgression(value: unknown): value is SavedProgression {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    entry.id.length > 0 &&
    entry.id.length <= 64 &&
    typeof entry.name === 'string' &&
    entry.name.trim().length > 0 &&
    entry.name.length <= MAX_PROGRESSION_NAME &&
    isNoteName(entry.key) &&
    isSavedCardList(entry.cards) &&
    // A named progression with no cards would be a dead entry in the picker.
    entry.cards.length > 0 &&
    typeof entry.savedAt === 'number' &&
    Number.isFinite(entry.savedAt)
  );
}

/** The whole library, or nothing: a single malformed entry does not half-load the list. */
export function isSavedProgressionList(value: unknown): value is SavedProgression[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_SAVED_PROGRESSIONS &&
    value.every(isSavedProgression)
  );
}

/** The working board restored on the next visit. */
export function isStudioBoard(value: unknown): value is StudioBoard {
  if (typeof value !== 'object' || value === null) return false;
  const board = value as Record<string, unknown>;
  return isNoteName(board.key) && isSavedCardList(board.cards);
}
