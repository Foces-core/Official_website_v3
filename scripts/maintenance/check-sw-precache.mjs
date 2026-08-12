/**
 * check-sw-precache — fail CI if the built service worker precaches files it
 * must not.
 *
 * The app-shell precache must stay lean (ADR: photos ship via the immutable
 * HTTP cache, not the SW). The three.js module (~734KB) is only needed by the
 * lazy desktop Vanta hero, so vite.config.js excludes it via `globIgnores` —
 * this script verifies the EXCLUSION actually held in the built dist/sw.js,
 * so a rename or config regression can't silently re-add 734KB to every
 * first-visit SW install.
 *
 * Usage:  node scripts/maintenance/check-sw-precache.mjs   (run after pnpm build)
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const SW_PATH = path.resolve('dist/sw.js');
const FORBIDDEN = [/three\.module-.*\.js$/]; // hero WebGL — desktop/lazy only

if (!existsSync(SW_PATH)) {
  console.error(`[check-sw-precache] ${SW_PATH} not found — run pnpm build first.`);
  process.exit(1);
}

const sw = readFileSync(SW_PATH, 'utf8');
const urlRe = /url\s*:\s*["']([^"']+)["']/g;
const urls = [...sw.matchAll(urlRe)].map((m) => m[1]);

let failed = false;
for (const pattern of FORBIDDEN) {
  const hits = urls.filter((u) => pattern.test(u));
  if (hits.length) {
    failed = true;
    console.error(`[check-sw-precache] FAIL: precached forbidden file(s) matching ${pattern}:`);
    for (const h of hits) console.error(`  - ${h}`);
  }
}

const assets = urls.filter((u) => u.includes('assets/'));
console.log(
  `[check-sw-precache] ${assets.length} assets in precache, ${failed ? 'FORBIDDEN FILES PRESENT' : 'no forbidden files (three.js excluded ✓)'}`,
);
process.exit(failed ? 1 : 0);
