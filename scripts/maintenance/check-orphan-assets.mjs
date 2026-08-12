#!/usr/bin/env node
/**
 * Orphan-asset guard.
 *
 * Fails (exit 1) when a file under `src/assets/` is never referenced anywhere
 * in the app: `src/`, `public/`, `index.html`, or `tests/`.
 *
 * Why: assets accumulate fast (webp variants, one-off SVGs) and a dead asset
 * is pure repo weight. knip only guards code, so this script closes the gap
 * (see docs/adr/0006-knip-dead-code-guard.md).
 *
 * Usage:  node scripts/maintenance/check-orphan-assets.mjs
 *         pnpm check:assets
 *
 * Reference matching:
 * - Any quoted string containing `assets/<file>` (handles `../assets/...`,
 *   `./assets/...`, absolute `/src/assets/...`).
 * - Vite query strings are stripped (`?blur&w=20`, `?v=3`) — they target the
 *   same file.
 * - Imports inside scripts/maintenance are intentionally NOT treated as
 *   references: maintenance scripts can name assets they generate but the
 *   app never consumes.
 * - Basename matching can mask an orphan if a reference shares a basename
 *   with a different asset (e.g. a ref to assets/events/foo.webp marks
 *   src/assets/foo.webp as used). The duplicate-basename check only catches
 *   file-vs-file collisions; full-path refs avoid the ambiguity.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');

// Every asset under src/assets (recursively), with forward-slash paths.
function walkAssets(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkAssets(full, acc);
    else acc.push(full.replace(/\\/g, '/'));
  }
  return acc;
}

const assetsDir = path.join(root, 'src', 'assets');
const assets = walkAssets(assetsDir).map((p) => p.slice(root.length + 1)); // "src/assets/..."

// Directories that may reference assets. maintenance/ is deliberately
// excluded (see header comment).
const scanDirs = ['src', 'public', 'tests'];
const extraFiles = ['index.html'];

function collectReferences() {
  const refs = new Set();
  const push = (raw) => {
    // strip query string (?blur&w=20, ?v=3, ?w=400 ...)
    const clean = raw.split('?')[0];
    refs.add(clean);
    refs.add(path.basename(clean));
  };
  const scanFile = (file) => {
    const text = fs.readFileSync(file, 'utf8');
    // quoted OR backticked strings containing assets/ (covers imports,
    // url(), data attrs, and template literals)
    const re = /['"`][^'"`]*assets\/[^'"`]+['"`]/g;
    for (const m of text.matchAll(re)) {
      push(m[0].slice(1, -1));
    }
    // bare references like src=/assets/foo.webp (rare, but cheap to catch)
    const re2 = /(?:\/src\/|\/)?assets\/[\w./-]+\.(?:webp|png|jpe?g|avif|gif|svg)/g;
    for (const m of text.matchAll(re2)) {
      push(m[0]);
    }
  };
  for (const dir of scanDirs) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const entry of fs.readdirSync(abs, { recursive: true })) {
      const full = path.join(abs, entry);
      if (fs.statSync(full).isFile()) scanFile(full);
    }
  }
  for (const f of extraFiles) {
    const full = path.join(root, f);
    if (fs.existsSync(full)) scanFile(full);
  }
  return refs;
}

const refs = collectReferences();

// An asset is orphaned when neither its full path nor its basename appears
// in any reference (basename matching covers relative imports from subdirs
// like src/Pages/.../assets/... and dynamic template refs).
const orphans = assets.filter(
  (asset) =>
    !refs.has(asset) &&
    !refs.has(asset.replace('src/assets/', 'assets/')) &&
    !refs.has(path.basename(asset)),
);

// Basename collisions: if two assets share a basename, a reference to one
// silently "covers" the other. Report them loudly so the guard stays honest.
const byBasename = new Map();
for (const asset of assets) {
  const b = path.basename(asset);
  if (!byBasename.has(b)) byBasename.set(b, []);
  byBasename.get(b).push(asset);
}
const collisions = [...byBasename.entries()].filter(([, list]) => list.length > 1);

if (orphans.length === 0 && collisions.length === 0) {
  console.log(`✓ check-orphan-assets: ${assets.length} assets, all referenced.`);
  process.exit(0);
}

if (orphans.length > 0) {
  console.error(`✗ Unreferenced assets under src/assets/ (${orphans.length}):`);
  for (const o of orphans) console.error(`  ${o}`);
}
if (collisions.length > 0) {
  console.error('✗ Duplicate basenames — a reference to one may hide the other:');
  for (const [b, list] of collisions) console.error(`  ${b}: ${list.join(', ')}`);
}
console.error('\nDelete orphaned files (git rm), or reference them from app code.');
process.exit(1);
