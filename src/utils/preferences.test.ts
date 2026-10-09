// Tests for the preference store. Storage is stubbed the same way as in router.test.ts, so
// the validation rules can be exercised without a DOM.

import {
  PREFERENCE_KEYS,
  clearPreference,
  isBoolean,
  isIntegerInRange,
  isNoteName,
  isNumberInRange,
  isOneOf,
  isOneOfValue,
  isText,
  readPreference,
  writePreference,
} from './preferences';

const store = new Map<string, string>();

const stubLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

(globalThis as unknown as { localStorage: unknown }).localStorage = stubLocalStorage;

describe('preference store', () => {
  test('round-trips a stored value', () => {
    writePreference(PREFERENCE_KEYS.songBpm, 132);
    expect(readPreference(PREFERENCE_KEYS.songBpm, 80, isNumberInRange(40, 200))).toBe(132);
  });

  test('falls back when nothing is stored', () => {
    expect(readPreference('never-written', 'fallback', isText)).toBe('fallback');
    expect(readPreference('never-written-either', 4, isIntegerInRange(1, 4))).toBe(4);
  });

  test('falls back instead of throwing on unparseable storage', () => {
    store.set('musix.pref.broken', '{not json');
    expect(readPreference('broken', 'safe', isText)).toBe('safe');
  });

  test('rejects a stored value that fails validation', () => {
    writePreference(PREFERENCE_KEYS.songTranspose, 'not-a-number');
    expect(readPreference(PREFERENCE_KEYS.songTranspose, 0, isIntegerInRange(-11, 11))).toBe(0);

    writePreference(PREFERENCE_KEYS.songTranspose, 99);
    expect(readPreference(PREFERENCE_KEYS.songTranspose, 0, isIntegerInRange(-11, 11))).toBe(0);
  });

  test('clearPreference removes the value', () => {
    writePreference('temporary', 'value');
    clearPreference('temporary');
    expect(readPreference('temporary', 'gone', isText)).toBe('gone');
  });

  test('a blocked store never throws', () => {
    (globalThis as unknown as { localStorage: unknown }).localStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };

    expect(readPreference('anything', 'safe', isText)).toBe('safe');
    expect(() => writePreference('anything', 1)).not.toThrow();
    expect(() => clearPreference('anything')).not.toThrow();

    (globalThis as unknown as { localStorage: unknown }).localStorage = stubLocalStorage;
  });
});

describe('preference validators', () => {
  test('isOneOf accepts only listed ids', () => {
    const isVisualizer = isOneOf('piano', 'guitar');
    expect(isVisualizer('piano')).toBe(true);
    expect(isVisualizer('drums')).toBe(false);
    expect(isVisualizer(7)).toBe(false);
  });

  test('isOneOfValue handles numeric presets', () => {
    const isBeats = isOneOfValue([1, 2, 4] as const);
    expect(isBeats(2)).toBe(true);
    expect(isBeats(3)).toBe(false);
  });

  test('isIntegerInRange rejects fractions, NaN, and out-of-range values', () => {
    const isValid = isIntegerInRange(40, 200);
    expect(isValid(120)).toBe(true);
    expect(isValid(120.5)).toBe(false);
    expect(isValid(NaN)).toBe(false);
    expect(isValid(240)).toBe(false);
  });

  test('isNoteName only accepts real note names', () => {
    expect(isNoteName('C♯')).toBe(true);
    expect(isNoteName('A♯')).toBe(true);
    expect(isNoteName('Db')).toBe(false);
    expect(isNoteName('')).toBe(false);
  });

  test('isBoolean and isText are strict about types', () => {
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean('false')).toBe(false);
    expect(isText('')).toBe(true);
    expect(isText(0)).toBe(false);
  });
});
