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
    <div className="glass-card flex flex-col gap-5">
      <header>
        <span className="section-badge">Contact</span>
        <h2 className="mt-2 mb-1.5">Talk to the author</h2>
        <p className="m-0 max-w-[62ch] text-ink-soft leading-[1.6]">
          Musix is an open, self-contained study app. Feedback, corrections, and pull requests
          are welcome — everything runs through GitHub, so a single link reaches the person
          who built it.
        </p>
      </header>

      <ul className="m-0 grid list-none gap-2.5 p-0 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a
              className={`grid h-full [grid-template-columns:1fr_auto] gap-x-3 gap-y-1 rounded-[14px] border px-4 py-3.5 text-ink no-underline transition-[border-color,transform,background-color] duration-150 ease-[ease] hover:-translate-y-0.5 hover:border-accent hover:bg-[rgba(var(--accent-rgb),0.1)] focus-visible:border-accent focus-visible:bg-[rgba(var(--accent-rgb),0.1)] ${
                link.primary
                  ? 'border-[rgba(var(--accent-rgb),0.5)] bg-[rgba(var(--accent-rgb),0.12)]'
                  : 'border-[rgba(var(--overlay-rgb),0.14)] bg-[rgba(var(--inset-rgb),0.22)]'
              }`}
              href={link.href}
              data-tip="Opens GitHub in a new tab"
              target="_blank"
              rel="noreferrer noopener"
            >
              <span className="font-semibold">{link.label}</span>
              <span className="[grid-column:1/-1] text-[0.86rem] text-ink-soft leading-[1.5]">
                {link.detail}
              </span>
              <span className="text-accent" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>

      <section className="border-t border-[rgba(var(--overlay-rgb),0.1)] pt-4">
        <h3 className="mb-2 text-base">Licence — {LICENSE_NAME}</h3>
        <p className="mb-2 max-w-[72ch] text-ink-soft leading-[1.6]">
          Copyright (c) {LICENSE_YEAR} {GITHUB_OWNER}. You may use, modify, and redistribute
          this code, including commercially, provided the copyright notice and the licence
          text ship with it. The app comes with no warranty.
        </p>
        <p className="mb-2 max-w-[72ch] text-ink-soft leading-[1.6]">
          The theory notes in{' '}
          <code className="rounded-[5px] bg-[rgba(var(--overlay-rgb),0.08)] px-[5px] py-px text-[0.85em]">
            music-theory-reference/
          </code>{' '}
          and the bundled JSON in{' '}
          <code className="rounded-[5px] bg-[rgba(var(--overlay-rgb),0.08)] px-[5px] py-px text-[0.85em]">
            public/data/
          </code>{' '}
          are covered by the same {LICENSE_NAME} licence.{' '}
          <a
            className="text-accent"
            href={GITHUB_LICENSE_URL}
            data-tip="Read the licence on GitHub"
            target="_blank"
            rel="noreferrer noopener"
          >
            Read the full licence text
          </a>
          .
        </p>
      </section>

      <section className="border-t border-[rgba(var(--overlay-rgb),0.1)] pt-4">
        <h3 className="mb-2 text-base">A note on song charts</h3>
        <p className="mb-2 max-w-[72ch] text-ink-soft leading-[1.6]">
          The Song Follower works from chart text you paste yourself. It does not scrape tab
          sites — their pages are not fetchable from a browser and their terms disallow it —
          so please respect those terms when you copy a chart across.
        </p>
      </section>
    </div>
  );
};
