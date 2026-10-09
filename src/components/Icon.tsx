import type { ReactNode } from 'react';

/**
 * The app's one icon set. Emoji render differently on every platform and undercut the
 * craft feel, so every decorative glyph in the UI is drawn here instead: one 24×24 grid,
 * stroke-based, `currentColor` throughout so an icon always matches the text around it.
 *
 * Musical notation (♯ ♭ ♪ ♫) is deliberately *not* here — that is theory content, not
 * iconography, and lives in the data and copy where it belongs.
 */
export type IconName =
  | 'alert'
  | 'book'
  | 'bulb'
  | 'cards'
  | 'check'
  | 'chevron'
  | 'clock'
  | 'close'
  | 'copy'
  | 'grip'
  | 'guitar'
  | 'lock'
  | 'mic'
  | 'notes'
  | 'pencil'
  | 'piano'
  | 'play'
  | 'plus'
  | 'refresh'
  | 'ruler'
  | 'staff'
  | 'stop'
  | 'tap'
  | 'target'
  | 'volume'
  | 'volume-off'
  | 'zap';

const ICONS: Record<IconName, ReactNode> = {
  alert: (
    <>
      <path d="M12 3.6 21.4 20H2.6z" />
      <path d="M12 10v4.6" />
      <path d="M12 17.6h.01" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.6C10.5 5.1 8.5 4.5 4 4.5v13c4.5 0 6.5.6 8 2.1 1.5-1.5 3.5-2.1 8-2.1v-13c-4.5 0-6.5.6-8 2.1z" />
      <path d="M12 6.6v13" />
    </>
  ),
  cards: (
    <>
      <rect x="3.5" y="7" width="11" height="14" rx="2" />
      <path d="M8.5 7V5.5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H17" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3.2a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2l.1.7h4.8l.1-.7c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3.2z" />
      <path d="M10 19.6h4M10.8 21.9h2.4" />
    </>
  ),
  check: <path d="M4.5 12.6 9.4 17.5 19.5 7" />,
  chevron: <path d="M9 5.5 15.5 12 9 18.5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.4l3.6 2.1" />
    </>
  ),
  close: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 5.5v-.6a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.6" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  guitar: (
    <>
      <circle cx="8.6" cy="15.4" r="5.4" />
      <circle cx="8.6" cy="15.4" r="1.6" />
      <path d="m12.5 11.5 7.2-7.2" />
      <path d="m18.4 3.4 2.4 2.4" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8.2 10.5V7.6a3.8 3.8 0 0 1 7.6 0v2.9" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.6" width="6" height="11.2" rx="3" />
      <path d="M5.6 11.6a6.4 6.4 0 0 0 12.8 0" />
      <path d="M12 18v3.4M8.6 21.4h6.8" />
    </>
  ),
  notes: (
    <>
      <circle cx="7" cy="17.4" r="2.4" />
      <path d="M9.4 17.4V6.6l8-2v3.2" />
      <circle cx="15" cy="14.4" r="2.4" />
      <path d="M9.4 10.4 17.4 8.4" />
    </>
  ),
  pencil: (
    <>
      <path d="M16.5 4.6 19.4 7.5 8.8 18.1 4.6 19.4 5.9 15.2z" />
      <path d="m14.6 6.5 2.9 2.9" />
    </>
  ),
  piano: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.6" />
      <path d="M9 5.5v13M15 5.5v13" />
      <path d="M7.4 5.5v5.6M13.4 5.5v5.6" />
    </>
  ),
  play: <path d="M8 5.4v13.2L19 12z" fill="currentColor" stroke="none" />,
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 3.6V8h-4.4" />
    </>
  ),
  ruler: (
    <>
      <path d="M3.6 16.4 16.4 3.6l4 4L7.6 20.4z" />
      <path d="m7.4 12.6 2.2 2.2M10.6 9.4l2.2 2.2M13.8 6.2l2.2 2.2" />
    </>
  ),
  staff: (
    <>
      <path d="M3.5 8.5h17M3.5 12.5h17M3.5 16.5h17" />
      <circle cx="9.5" cy="16.4" r="2.1" />
      <path d="M11.6 16.4V6.4l4-1.2" />
    </>
  ),
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor" stroke="none" />,
  tap: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="7.6" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 1.8v3M12 19.2v3M1.8 12h3M19.2 12h3" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9.4h3.6L12 5.8v12.4L7.6 14.6H4z" />
      <path d="M15.6 9.6a3.6 3.6 0 0 1 0 4.8" />
      <path d="M18.2 7.4a7 7 0 0 1 0 9.2" />
    </>
  ),
  'volume-off': (
    <>
      <path d="M4 9.4h3.6L12 5.8v12.4L7.6 14.6H4z" />
      <path d="m15.8 9.8 4.8 4.4M20.6 9.8l-4.8 4.4" />
    </>
  ),
  zap: <path d="M13.2 2.4 4.6 13.8h6.2L10.4 21.6l8.9-11.9h-6.3z" fill="currentColor" stroke="none" />,
};

export interface IconProps {
  name: IconName;
  /** Rendered at 1em by default, so an icon tracks the text size around it. */
  className?: string;
  size?: string | number;
}

/**
 * Decorative by construction: an icon only ever *accompanies* a label or an
 * `aria-label`, so it is hidden from the accessibility tree rather than announced twice.
 */
export function Icon({ name, className, size = '1em' }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}
