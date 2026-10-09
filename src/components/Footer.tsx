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
}

/**
 * The footer is the project's identity strip: it carries the licence, the source link, and
 * the way to reach the author, so none of that has to be hunted for inside the tools.
 */
export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="musix-footer">
      <p className="musix-footer__tagline">
        Musix — a warm studio for learning music theory. Guitar, tuner, piano and song
        visualizers, all in the browser.
      </p>

      <nav className="musix-footer__links" aria-label="Project links">
        <button
          type="button"
          className="footer-link"
          data-tip="Open the Contact screen"
          onClick={() => onNavigate('contact')}
        >
          Contact
        </button>
        <a
          className="footer-link"
          href={GITHUB_REPO_URL}
          data-tip="Open the Musix source on GitHub"
          target="_blank"
          rel="noreferrer noopener"
        >
          GitHub
        </a>
        <a
          className="footer-link"
          href="/LICENSE"
          data-tip={`Read the full ${LICENSE_NAME} licence text`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {LICENSE_NAME} licence
        </a>
      </nav>

      <p className="musix-footer__legal">
        © {LICENSE_YEAR} {GITHUB_OWNER} · {LICENSE_NAME} licensed · No accounts, no tracking,
        no server.
      </p>
    </footer>
  );
};
