// Hash-based routing.
//
// The app is a static single-page site, so routes live in the URL fragment. That keeps
// deep links working on any static host (no server rewrite rules needed) while still
// giving every screen a real, shareable address such as `#songs` or `#/contact`.
//
// These helpers are deliberately DOM-only and free of React so the route table and the
// screens stay independent of how the address is stored.

/** Read the current route id, falling back when the hash is missing or unknown. */
export function readHashRoute(validIds: readonly string[], fallback: string): string {
  const raw = window.location.hash
    // Tolerate both `#songs` and `#/songs`.
    .replace(/^#/, '')
    .replace(/^\//, '')
    .trim()
    .toLowerCase();

  return validIds.includes(raw) ? raw : fallback;
}

/** Write a route to the hash, skipping the write when it is already current. */
export function writeHashRoute(id: string): void {
  if (window.location.hash.replace(/^#\/?/, '') === id) return;
  window.location.hash = id;
}

/**
 * Subscribe to every way the address can change (link clicks, back/forward, manual edits)
 * and return the unsubscribe function.
 */
export function subscribeToRoute(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  window.addEventListener('popstate', listener);

  return () => {
    window.removeEventListener('hashchange', listener);
    window.removeEventListener('popstate', listener);
  };
}
