// Tests for the preference store. Storage is stubbed the same way as in router.test.ts, so
// the validation rules can be exercised without a DOM. Preferences now live in cookies and
// are only written with permission, so this file also stubs a `document.cookie` jar and
// grants permission for the store's own tests (the permission gate itself is covered in
// consent.test.ts).

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
import { grantConsent } from './consent';

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

// Cookie jar stub: assigning adds or replaces a cookie in an accumulating jar, and
// Max-Age=0 removes it — the two pieces of real document.cookie behaviour the store uses.
const jar = new Map<string, string>();

(globalThis as unknown as { document: unknown }).document = {
  get cookie(): string {
    return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
  },
  set cookie(assignment: string) {
    const [pair = '', ...attributes] = assignment.split(';').map((part) => part.trim());
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    const expired = attributes.some((attribute) => /^max-age=0$/i.test(attribute));
    if (expired) jar.delete(name);
    else jar.set(name, value);
  },
};

// The store's own tests run as if the learner already allowed preference storage.
jar.set('musix.consent', 'granted');

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

describe('cookie-backed preference storage', () => {
  test('a granted preference is written to a first-party cookie', () => {
    writePreference(PREFERENCE_KEYS.songTranspose, 3);
    expect(document.cookie).toContain('musix.pref.songTranspose=');
    expect(readPreference(PREFERENCE_KEYS.songTranspose, 0, isIntegerInRange(-11, 11))).toBe(3);
  });

  test('a value too big for a cookie falls back to local storage', () => {
    const chart = `[Verse]\n${'C G Am F '.repeat(600)}`; // ~5.4 KB, over the cookie cap
    expect(chart.length).toBeGreaterThan(3500);

    writePreference(PREFERENCE_KEYS.songChart, chart);
    expect(store.has('musix.pref.songChart')).toBe(true);
    expect(document.cookie).not.toContain('musix.pref.songChart=');
    expect(readPreference(PREFERENCE_KEYS.songChart, '', isText)).toBe(chart);
  });

  test('nothing is written before permission, and granting releases it', () => {
    jar.delete('musix.consent'); // back to "not asked yet"
    store.clear();

    writePreference(PREFERENCE_KEYS.root, 'G');
    expect(document.cookie).not.toContain('musix.pref.root=');
    expect(readPreference(PREFERENCE_KEYS.root, 'C', isNoteName)).toBe('C');

    grantConsent();
    expect(document.cookie).toContain('musix.pref.root=');
    expect(readPreference(PREFERENCE_KEYS.root, 'C', isNoteName)).toBe('G');
  });

  test('clearPreference removes both the cookie and the overflow copy', () => {
    writePreference(PREFERENCE_KEYS.songTranspose, -2);
    expect(document.cookie).toContain('musix.pref.songTranspose=');

    clearPreference(PREFERENCE_KEYS.songTranspose);
    expect(document.cookie).not.toContain('musix.pref.songTranspose=');
    expect(readPreference(PREFERENCE_KEYS.songTranspose, 0, isIntegerInRange(-11, 11))).toBe(0);
  });
});
