// Unit tests for the hash routing helpers.
//
// The helpers only touch `window` when they are called, so a minimal stub is enough to
// exercise every branch without a DOM. Bun runs each test file in its own environment, so
// installing the stub here does not leak into the other suites.

import { readHashRoute, subscribeToRoute, writeHashRoute } from './router';

interface ListenerRecord {
  type: string;
  listener: () => void;
}

const listeners: ListenerRecord[] = [];

const stubWindow = {
  location: { hash: '' },
  addEventListener: (type: string, listener: () => void) => {
    listeners.push({ type, listener });
  },
  removeEventListener: (type: string, listener: () => void) => {
    const index = listeners.findIndex(
      (entry) => entry.type === type && entry.listener === listener
    );
    if (index >= 0) listeners.splice(index, 1);
  },
};

(globalThis as unknown as { window: unknown }).window = stubWindow;

const ROUTES = ['workbench', 'songs', 'contact'];
const FALLBACK = 'workbench';

describe('hash routing helpers', () => {
  describe('readHashRoute', () => {
    test('reads a plain hash', () => {
      stubWindow.location.hash = '#songs';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe('songs');
    });

    test('tolerates a leading slash so #/contact works too', () => {
      stubWindow.location.hash = '#/contact';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe('contact');
    });

    test('normalizes surrounding whitespace and casing', () => {
      stubWindow.location.hash = '  #WORKBENCH  ';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe('workbench');
    });

    test('falls back when the hash is empty', () => {
      stubWindow.location.hash = '';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe(FALLBACK);
    });

    test('falls back when the hash is not a known route', () => {
      stubWindow.location.hash = '#/definitely-not-a-screen';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe(FALLBACK);
    });

    test('does not match a route id that only starts with a valid one', () => {
      stubWindow.location.hash = '#songs-extra';
      expect(readHashRoute(ROUTES, FALLBACK)).toBe(FALLBACK);
    });
  });

  describe('writeHashRoute', () => {
    test('writes the hash when it differs', () => {
      stubWindow.location.hash = '#songs';
      writeHashRoute('contact');
      expect(stubWindow.location.hash).toBe('contact');
    });

    test('leaves the hash alone when it already points at the route', () => {
      stubWindow.location.hash = '#contact';
      writeHashRoute('contact');
      expect(stubWindow.location.hash).toBe('#contact');
    });

    test('recognizes a slash-prefixed hash as already current', () => {
      stubWindow.location.hash = '#/contact';
      writeHashRoute('contact');
      expect(stubWindow.location.hash).toBe('#/contact');
    });
  });

  describe('subscribeToRoute', () => {
    test('listens to both hashchange and popstate', () => {
      listeners.length = 0;
      const unsubscribe = subscribeToRoute(() => {});

      expect(listeners.map((entry) => entry.type).sort()).toEqual(['hashchange', 'popstate']);

      unsubscribe();
      expect(listeners.length).toBe(0);
    });

    test('fires the listener when the address changes', () => {
      listeners.length = 0;
      let calls = 0;
      const unsubscribe = subscribeToRoute(() => {
        calls += 1;
      });

      stubWindow.location.hash = '#piano';
      for (const entry of listeners) entry.listener();

      expect(calls).toBe(2);
      unsubscribe();
    });
  });
});
