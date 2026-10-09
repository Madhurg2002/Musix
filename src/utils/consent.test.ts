// Tests for the permission gate and the cookie helpers behind it.
//
// Bun runs each test file in its own environment, so the cookie jar stub installed here
// does not leak into the other suites. The stub reproduces the one piece of real
// `document.cookie` semantics the code relies on: assigning adds or replaces a cookie in
// an accumulating jar, and `Max-Age=0` removes one.

import { eraseCookie, readCookie, writeCookie } from './cookies';
import { declineConsent, grantConsent, hasConsent, readConsent, whenGranted } from './consent';

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

/** A fresh visit: no cookies, no decision. */
function freshVisit(): void {
  jar.clear();
}

describe('cookie helpers', () => {
  test('round-trips a value, encoding anything a cookie cannot hold', () => {
    freshVisit();
    writeCookie('musix.test', '[Verse]\nC   G\nwait & see = 100%');
    expect(readCookie('musix.test')).toBe('[Verse]\nC   G\nwait & see = 100%');
    expect(jar.get('musix.test')).not.toContain(' ');
    expect(jar.get('musix.test')).not.toContain('=');
  });

  test('returns null for a cookie that was never written', () => {
    freshVisit();
    expect(readCookie('musix.absent')).toBeNull();
  });

  test('eraseCookie removes it', () => {
    freshVisit();
    writeCookie('musix.gone', 'value');
    expect(readCookie('musix.gone')).toBe('value');
    eraseCookie('musix.gone');
    expect(readCookie('musix.gone')).toBeNull();
  });
});

describe('permission gate', () => {
  test('starts undecided', () => {
    freshVisit();
    expect(readConsent()).toBeNull();
    expect(hasConsent()).toBe(false);
  });

  test('holds writes until permission is granted, then releases them', () => {
    freshVisit();
    const released: string[] = [];
    whenGranted(() => released.push('waiting'));
    expect(released).toEqual([]);

    grantConsent();
    expect(readConsent()).toBe('granted');
    expect(hasConsent()).toBe(true);
    expect(released).toEqual(['waiting']);
  });

  test('runs later writes immediately once permission exists', () => {
    freshVisit();
    grantConsent();
    const released: string[] = [];
    whenGranted(() => released.push('now'));
    expect(released).toEqual(['now']);
  });

  test('a refusal drops what was waiting and blocks what comes next', () => {
    freshVisit();
    const released: string[] = [];
    whenGranted(() => released.push('before the refusal'));

    declineConsent();
    expect(readConsent()).toBe('declined');
    expect(hasConsent()).toBe(false);

    whenGranted(() => released.push('after the refusal'));
    expect(released).toEqual([]); // nothing was written either side of the refusal
  });
});
