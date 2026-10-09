import React from 'react';
import {
  GITHUB_OWNER,
  GITHUB_REPO_URL,
  LICENSE_NAME,
  LICENSE_YEAR,
} from '../utils/links';

interface FooterProps {
  /** Navigate to an in-app route, e.g. the Contact screen. */
  onNavigate: (routeId: string) => void;
  /** Reopen the preference-cookie panel. */
  onCookieSettings?: () => void;
}

/** Shared pill styling for every link in the strip; one place to restyle the row. */
const LINK_CLASS =
  'cursor-pointer rounded-full border border-line-soft bg-tint px-3.5 py-1.5 font-sans text-[0.82rem] leading-normal text-ink no-underline transition-colors duration-150 hover:border-accent hover:bg-tint-accent hover:text-accent focus-visible:border-accent focus-visible:bg-tint-accent focus-visible:text-accent max-sm:flex-1 max-sm:basis-[45%] max-sm:text-center';

/**
 * The footer is the project's identity strip: it carries the licence, the source link, and
 * the way to reach the author, so none of that has to be hunted for inside the tools.
 */
export const Footer: React.FC<FooterProps> = ({ onNavigate, onCookieSettings }) => {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-hairline px-6 py-6 text-center text-[13px] text-ink-muted [padding-bottom:max(24px,env(safe-area-inset-bottom))]">
      <p className="m-0 max-w-[62ch]">
        Musix — a warm studio for learning music theory. Guitar, tuner, piano and song
        visualizers, all in the browser.
      </p>

      <nav className="flex flex-wrap justify-center gap-x-2 gap-y-1.5 max-sm:w-full" aria-label="Project links">
        <button
          type="button"
          className={LINK_CLASS}
          data-tip="Open the Contact screen"
          onClick={() => onNavigate('contact')}
        >
          Contact
        </button>
        <a
          className={LINK_CLASS}
          href={GITHUB_REPO_URL}
          data-tip="Open the Musix source on GitHub"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>
        <a
          className={LINK_CLASS}
          href="/LICENSE"
          data-tip={`Read the full ${LICENSE_NAME} licence text`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {LICENSE_NAME} licence
        </a>
        {onCookieSettings && (
          <button
            type="button"
            className={LINK_CLASS}
            data-tip="Review what Musix remembers on this device"
            onClick={onCookieSettings}
          >
            Cookie settings
          </button>
        )}
      </nav>

      <p className="m-0 text-[0.8rem] text-ink-muted">
        © {LICENSE_YEAR} {GITHUB_OWNER} · {LICENSE_NAME} licensed · No accounts, no tracking,
        no server.
      </p>
    </footer>
  );
};
