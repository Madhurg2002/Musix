/**
 * build-pages.ts
 *
 * Generates Astro pages under src/pages/docs/<section}/{file}.astro from the
 * existing music-theory-reference/ markdown tree and copies the JSON data into
 * public/data/ at build time.
 *
 * This keeps the canonical sources in music-theory-reference/ and avoids
 * editing two copies of the same content. Run this before `astro build`.
 */

import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const _this = fileURLToPath(import.meta.url);
const _thisDir = dirname(_this);

const SITE = resolve(_thisDir, '..');
const ROOT = resolve(SITE, '..');
const REF = join(ROOT, 'music-theory-reference');
const PAGES = join(SITE, 'src/pages');
const PUBLIC_DATA = join(SITE, 'public/data');

const MD_EXT = /\.md$/;

type Doc = {
  title: string;
  description?: string;
  section: 'foundations' | 'harmony' | 'guitar' | 'template';
  order: number;
};

function readFrontmatter(text: string): Doc {
  const first = text.indexOf('---');
  if (first !== 0) {
    return defaultDocFromPath(text);
  }
  const end = text.indexOf('---', first + 3);
  if (end === -1) {
    return defaultDocFromPath(text);
  }
  const block = text.slice(first + 3, end).trim();
  const doc: Doc = { title: 'Untitled', section: 'foundations', order: 99 };

  for (const line of block.split('\n')) {
    const m = line.match(/^title:\s*"?([^"]+)"?\s*$/);
    if (m) doc.title = m[1].trim();
    const d = line.match(/^description:\s*"?([^"]+)"?\s*$/);
    if (d) doc.description = d[1].trim();
    const s = line.match(/^section:\s*(\w+)/);
    if (s && (s[1] === 'foundations' || s[1] === 'harmony' || s[1] === 'guitar' || s[1] === 'template')) {
      doc.section = s[1] as Doc['section'];
    }
    const o = line.match(/^order:\s*(\d+)/);
    if (o) doc.order = Number(o[1]);
  }

  if (!doc.title || doc.title === 'Untitled') {
    doc.title = defaultDocFromPath(text).title;
  }
  return doc;
}

function defaultDocFromPath(text: string): Doc {
  const match = text.match(/^#\s+(.+)/m);
  const title = match ? match[1].trim() : 'Untitled';
  return { title, section: 'foundations', order: 99 };
}

/**
 * music-theory-reference/01-foundations/02-intervals.md
 * -> docs/foundations/02-intervals
 */
function slugFromPath(rel: string): string {
  const parts = rel.replace(/\.md$/, '').split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Unexpected doc path layout: ${rel}`);
  }
  const file = parts[parts.length - 1];
  const dir = parts[parts.length - 2];
  const section = sectionFromDir(dir);
  return `docs/${section}/${file}`;
}

function sectionFromDir(dir: string): 'foundations' | 'harmony' | 'guitar' | 'template' {
  if (dir.startsWith('01-foundations') || dir === 'foundations') return 'foundations';
  if (dir.startsWith('02-harmony-and-analysis') || dir === 'harmony') return 'harmony';
  if (dir.startsWith('03-instrument-mappings') || dir === 'guitar' || dir.includes('guitar')) return 'guitar';
  if (dir.startsWith('templates') || dir === 'template') return 'template';
  return 'foundations';
}

function pageTitleFromRel(rel: string, doc: Doc): string {
  if (doc.title && doc.title !== 'Untitled') return doc.title;
  const file = rel.replace(/\.md$/, '').split('/').pop() || '';
  return file.replace(/^\d+-/, '').replace(/-/g, ' ');
}

function walkSync(dir: string): string[] {
  const out: string[] = [];
  const list = readdirSync(dir);
  for (const name of list) {
    const p = join(dir, name);
    const stat = statSync(p);
    if (stat.isDirectory()) {
      out.push(...walkSync(p));
    } else {
      out.push(p);
    }
  }
  return out;
}

function buildDocsPages() {
  const mdFiles = walkSync(REF).filter((p) => MD_EXT.test(p));
  const pagesWritten: string[] = [];
  for (const filePath of mdFiles) {
    const rel = relative(REF, filePath);
    if (!rel.includes('/')) {
      // Skip top-level files like README.md (rendered by the home page).
      continue;
    }
    const doc = readFrontmatter(readFileSync(filePath, 'utf-8'));
    const slug = slugFromPath(rel);
    const pageDir = join(PAGES, dirnameRel(slug));
    mkdirSync(pageDir, { recursive: true });
    const pagePath = join(PAGES, `${slug}.astro`);
    const levelsFromPages = slug.split('/').length; // e.g. docs/foundations/01 -> 2 levels

    const title = pageTitleFromRel(rel, doc);
    const section = doc.section;

    const level = slug.split('/').length;
    const up = '../'.repeat(level);
    const astro = `---
import Doc from '${up}layouts/Doc.astro';
import Markdown from '${up}components/Markdown.astro';
import { readFileSync } from 'node:fs';

const mdPath = '${filePath.replace(/\\/g, '/')}';
const raw = readFileSync(mdPath, 'utf-8');
---

<Doc title="${escapeFrontmatter(title)}" description="${escapeFrontmatter(doc.description || '')}" section="${section}">
  <Markdown content={raw} />
</Doc>
`;
    writeFileSync(pagePath, astro, 'utf-8');
    pagesWritten.push(slug);
  }

  return pagesWritten;
}

function copyData() {
  mkdirSync(PUBLIC_DATA, { recursive: true });
  const dataDir = join(ROOT, 'music-theory-reference/04-data');
  for (const name of ['intervals.json', 'scale-formulas.json', 'chord-formulas.json', 'guitar-fretboard-map.json']) {
    const src = join(dataDir, name);
    const dest = join(PUBLIC_DATA, name);
    copyFileSync(src, dest);
  }
}

function dirnameRel(slug: string): string {
  // docs/foundations/01-pitch-and-frequencies -> docs/foundations
  const i = slug.lastIndexOf('/');
  return i >= 0 ? slug.slice(0, i) : '';
}

function escapeFrontmatter(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function main() {
  console.log('Generating docs pages from music-theory-reference/ ...');
  const pages = buildDocsPages();
  console.log(`Wrote ${pages.length} pages under src/pages/docs/`);
  copyData();
  console.log('Copied data/*.json into public/data/');
}

main();
