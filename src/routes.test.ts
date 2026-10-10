// Invariants for the route table.
//
// The table is the single source of truth for the rail, the top-bar title, deep links, and
// each screen's default instrument, so a mistake in it breaks several things at once. These
// tests assert the shape rather than the markup, and need no DOM: `React.lazy` only wraps a
// loader, so importing the table never actually loads a screen.

import {
  DEFAULT_ROUTE_ID,
  ROUTES,
  ROUTE_IDS,
  routeFor,
  visualizerForRoute,
} from './routes';

const INSTRUMENT_IDS = [
  'auto',
  'acoustic-guitar',
  'electric-guitar',
  'piano',
  'bass',
  'ukulele',
  'synth',
];

describe('route table', () => {
  test('every route id is a unique, url-safe token', () => {
    expect(new Set(ROUTE_IDS).size).toBe(ROUTE_IDS.length);
    for (const id of ROUTE_IDS) {
      expect(/^[a-z][a-z0-9-]*$/.test(id)).toBe(true);
    }
  });

  test('every route carries the metadata the shell needs', () => {
    for (const route of ROUTES) {
      expect(route.title.length).toBeGreaterThan(0);
      expect(route.label.length).toBeGreaterThan(0);
      expect(typeof route.render).toBe('function');
      expect(INSTRUMENT_IDS.includes(route.instrument)).toBe(true);
    }
  });

  test('exactly one route hides behind the piano visualizer and one behind the guitar one', () => {
    const planned = ROUTES.filter((route) => route.visibleFor === 'piano');
    const plucked = ROUTES.filter((route) => route.visibleFor === 'guitar');
    expect(planned.length).toBe(1);
    expect(plucked.length).toBe(1);
    expect(planned[0]!.id).toBe('piano');
    expect(plucked[0]!.id).toBe('fretboard');
  });

  test('the default route exists in the table', () => {
    expect(ROUTE_IDS.includes(DEFAULT_ROUTE_ID)).toBe(true);
  });

  test('routeFor resolves a known id and falls back for anything else', () => {
    for (const route of ROUTES) {
      expect(routeFor(route.id).id).toBe(route.id);
    }
    expect(routeFor('nope').id).toBe(ROUTES[0].id);
    expect(routeFor('').id).toBe(ROUTES[0].id);
  });

  test('the contact screen is reachable and grouped as its own project section', () => {
    const contact = routeFor('contact');
    expect(contact.id).toBe('contact');
    expect(contact.group).toBe('Project');
  });

  test('only the piano/fretboard pair implies a visualizer', () => {
    expect(visualizerForRoute('fretboard')).toBe('guitar');
    expect(visualizerForRoute('piano')).toBe('piano');
    for (const id of ROUTE_IDS.filter((routeId) => routeId !== 'piano' && routeId !== 'fretboard')) {
      expect(visualizerForRoute(id)).toBe(null);
    }
  });
});
