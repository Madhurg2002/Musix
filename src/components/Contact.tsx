import React from 'react';
import {
  GITHUB_ISSUES_URL,
  GITHUB_LICENSE_URL,
  GITHUB_NEW_ISSUE_URL,
  GITHUB_OWNER,
  GITHUB_PROFILE_URL,
  GITHUB_REPO_URL,
  GITHUB_SOURCE_URL,
  LICENSE_NAME,
  LICENSE_YEAR,
} from '../utils/links';

interface ContactLink {
  label: string;
  href: string;
  detail: string;
  primary?: boolean;
}

const LINKS: ContactLink[] = [
  {
    label: 'Open an issue',
    href: GITHUB_NEW_ISSUE_URL,
    detail: 'Bugs, wrong chord shapes, missing scales — anything that looks off.',
    primary: true,
  },
  {
    label: 'Browse existing issues',
    href: GITHUB_ISSUES_URL,
    detail: 'See whether someone already reported it, or add to the thread.',
  },
  {
    label: `GitHub profile — @${GITHUB_OWNER}`,
    href: GITHUB_PROFILE_URL,
    detail: 'Everything else this author works on.',
  },
  {
    label: 'Read the source',
    href: GITHUB_SOURCE_URL,
    detail: 'The whole app is plain TypeScript and React under src/.',
  },
  {
    label: 'Repository',
    href: GITHUB_REPO_URL,
    detail: 'Clone it, fork it, or send a pull request.',
  },
];

/** How to reach the author and what the licence allows. Links out to GitHub. */
export const Contact: React.FC = () => {
  return (
    <div className="contact-screen glass-card">
      <header className="contact-header">
        <span className="section-badge">Contact</span>
        <h2>Talk to the author</h2>
        <p>
          Musix is an open, self-contained study app. Feedback, corrections, and pull requests
          are welcome — everything runs through GitHub, so a single link reaches the person
          who built it.
        </p>
      </header>

      <ul className="contact-links">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              className={`contact-link ${link.primary ? 'contact-link--primary' : ''}`}
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="contact-link__label">{link.label}</span>
              <span className="contact-link__detail">{link.detail}</span>
              <span className="contact-link__arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <section className="contact-license">
        <h3>
          Licence — {LICENSE_NAME}
        </h3>
        <p>
          Copyright (c) {LICENSE_YEAR} {GITHUB_OWNER}. You may use, modify, and redistribute
          this code, including commercially, provided the copyright notice and the licence
          text ship with it. The app comes with no warranty.
        </p>
        <p>
          The theory notes in <code>music-theory-reference/</code> and the bundled JSON in{' '}
          <code>public/data/</code> are covered by the same {LICENSE_NAME} licence.{' '}
          <a href={GITHUB_LICENSE_URL} target="_blank" rel="noreferrer noopener">
            Read the full licence text
          </a>
          .
        </p>
      </section>

      <section className="contact-note">
        <h3>A note on song charts</h3>
        <p>
          The Song Follower works from chart text you paste yourself. It does not scrape tab
          sites — their pages are not fetchable from a browser and their terms disallow it —
          so please respect those terms when you copy a chart across.
        </p>
      </section>
    </div>
  );
};
