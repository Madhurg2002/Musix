// First-party cookie helpers.
//
// Preferences are kept in cookies rather than plain storage so the learner can see exactly
// what Musix writes (DevTools → Application → Cookies) and clear it like any other site
// data. Values are URL-encoded so a chord chart with spaces and brackets survives the
// round trip, and every call is defensive: a browser with cookies disabled, or a test
// environment without a document, must degrade to "nothing stored" instead of throwing.

/** One year — preferences are settings, not session state. */
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function encodeValue(value: string): string {
  try {
    return encodeURIComponent(value);
  } catch {
    return '';
  }
}

function decodeValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Read one cookie by name, or `null` when it is absent or unreadable. */
export function readCookie(name: string): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const target = `${name}=`;
    for (const part of document.cookie.split(';')) {
      const trimmed = part.trim();
      if (trimmed.startsWith(target)) return decodeValue(trimmed.slice(target.length));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Write a cookie for one year. `Secure` is only added on https so the app keeps working on
 * http://localhost, where a Secure cookie would be dropped.
 */
export function writeCookie(name: string, value: string): void {
  try {
    if (typeof document === 'undefined') return;
    const secure =
      typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${encodeValue(value)}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
  } catch {
    // Cookies blocked → the preference simply is not remembered.
  }
}

/** Remove a cookie by writing the same name with an expired date. */
export function eraseCookie(name: string): void {
  try {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    // Same as above.
  }
}
