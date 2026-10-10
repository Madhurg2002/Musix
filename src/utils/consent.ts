// Permission gate for everything Musix remembers between visits.
//
// The key, instrument, theme, scale, song chart, and practice settings are only written
// once the learner allows it. The decision itself lives in a first-party cookie
// (`musix.consent`) — it is the record the app needs in order to honour the choice next
// visit, and nothing else is stored before a choice is made. Writes attempted before then
// are queued in memory and released if permission is granted; a refusal drops them.

import { readCookie, writeCookie } from './cookies';

export type ConsentChoice = 'granted' | 'declined';

const CONSENT_COOKIE = 'musix.consent';

/** Writes waiting for permission. Cleared on grant (flushed) or refusal (dropped). */
let queued: Array<() => void> = [];

/** The stored decision, or `null` while the learner has not been asked. */
export function readConsent(): ConsentChoice | null {
  const raw = readCookie(CONSENT_COOKIE);
  return raw === 'granted' || raw === 'declined' ? raw : null;
}

/** True only when the learner has explicitly allowed preference storage. */
export function hasConsent(): boolean {
  return readConsent() === 'granted';
}

/**
 * Run `task` now when permission exists; otherwise hold it until the learner decides.
 * A refusal discards the task, so nothing is written after the learner says no.
 */
export function whenGranted(task: () => void): void {
  if (hasConsent()) {
    task();
    return;
  }
  if (readConsent() === 'declined') return;
  queued.push(task);
}

/** Record permission and release everything that was waiting for it. */
export function grantConsent(): void {
  writeCookie(CONSENT_COOKIE, 'granted');
  const pending = queued;
  queued = [];
  for (const task of pending) {
    try {
      task();
    } catch {
      // One unwritable value must not stop the rest from being saved.
    }
  }
}

/** Record a refusal and drop anything that was waiting to be written. */
export function declineConsent(): void {
  writeCookie(CONSENT_COOKIE, 'declined');
  queued = [];
}
