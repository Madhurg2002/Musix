// Selectable interface themes.
//
// A theme is just a palette: every tint in style.css derives from the channel tokens
// (--accent-rgb, --overlay-rgb, …), so switching `data-theme` on <html> restyles the whole
// app without touching component markup.
//
// Remembering the choice is preference storage, so it goes through the same permission
// gate as everything else: the theme always applies for the session, but it is only saved
// once the learner allows preference cookies.

import { hasConsent, whenGranted } from './consent';

export const THEMES = [
  { id: 'studio', label: 'Analog Studio' },
  { id: 'nocturne', label: 'Nocturne' },
  { id: 'paper', label: 'Sheet Paper' },
  { id: 'arcade', label: 'Arcade' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

const STORAGE_KEY = 'musix.theme';
const DEFAULT_THEME: ThemeId = 'studio';

function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}

/** Read the saved theme, falling back to the default when storage is empty or blocked. */
export function readTheme(): ThemeId {
  // Before permission is given nothing was stored, so the default is the honest answer.
  if (!hasConsent()) return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeId(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** Apply a theme to the document and remember the choice once permission exists. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset.theme = id;
  whenGranted(() => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private mode can block storage; the theme still applies for this session.
    }
  });
}
