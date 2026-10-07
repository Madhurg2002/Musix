// Build the public data copy used by the Vite React app.
//
// This script is intentionally a plain Node ESM helper, not part of the app build.
// It copies the reference data JSON into public/data/ so the built site can serve
// pitch, scale, chord, and guitar-fretboard data as static assets.
//
// Usage:
//   node scripts/build-pages.ts

import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const _this = fileURLToPath(import.meta.url);
const _thisDir = dirname(_this);
const SITE = resolve(_thisDir, '..');
const ROOT = resolve(SITE);
const REF = join(ROOT, 'music-theory-reference');
const PUBLIC_DATA = join(SITE, 'public/data');
const DATA_DIR = join(ROOT, 'music-theory-reference/04-data');

const DATA_FILES = [
  'intervals.json',
  'scale-formulas.json',
  'chord-formulas.json',
  'guitar-fretboard-map.json',
];

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

function main() {
  const mdFiles = walkSync(REF).filter((p) => p.endsWith('.md'));

  for (const name of DATA_FILES) {
    const src = join(DATA_DIR, name);
    const dest = join(PUBLIC_DATA, name);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }

  console.log(`Copied ${DATA_FILES.length} data files into ${PUBLIC_DATA}`);
}

main();
