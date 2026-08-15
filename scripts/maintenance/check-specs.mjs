#!/usr/bin/env node
/**
 * Pure-module spec guard (ADR-0009 contract enforcement).
 *
 * Fails (exit 1) when a "pure" module — a file the unit contract says must
 * be unit-spec'd — is not imported by any spec in tests/unit/. Behavior
 * lives in pure tested modules; components are wiring (JSX is covered by the
 * Playwright E2E suite, deliberately excluded here).
 *
 * Why: the vitest coverage thresholds catch an untested module only
 * indirectly (as an aggregate coverage drop). This check names the file
 * explicitly and fails fast, so a new extraction that lands without its spec
 * is caught by its own PR.
 *
 * Usage:  node scripts/maintenance/check-specs.mjs
 *         pnpm check:specs
 *
 * Matching is reference-based (a spec counts if it imports the module path),
 * so the codebase's existing naming conventions all work:
 *   - validators spec'd alongside their data module
 *     (validateTeam -> teamData.spec.js, validateEvents -> eventsData.spec.js)
 *   - hook/reducer specs that use the JSX harness
 *     (useLowPower.js -> useLowPower.spec.jsx, lazyWithRetry -> .spec.jsx)
 *   - module-specific data specs (events -> eventsData.spec.js)
 *
 * Contract dirs (mirror vitest.config.js's coverage include, plus
 * src/Pages/**\/*.js for pure modules that live beside route components,
 * e.g. Navbar's navSpy):
 *   - src/utils/**  (.js and .jsx — DeferredAnalytics.jsx is pure logic)
 *   - src/data/**   (.js)
 *   - src/hooks/**  (.js)
 *   - src/Components/**  (.js only — .jsx is wiring, E2E-covered)
 *   - src/Pages/**  (.js only)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const testsDir = path.join(root, 'tests', 'unit');

// [dir, allowed extensions]
const CONTRACT_DIRS = [
  ['src/utils', new Set(['.js', '.jsx'])],
  ['src/data', new Set(['.js'])],
  ['src/hooks', new Set(['.js'])],
  ['src/Components', new Set(['.js'])],
  ['src/Pages', new Set(['.js'])],
];

function walk(dir, allowedExt, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, allowedExt, acc);
    else if (allowedExt.has(path.extname(entry.name))) acc.push(full);
  }
  return acc;
}

// A spec counts when it imports the module (any relative-path spelling, e.g.
// '../../src/utils/validateTeam.js' contains 'src/utils/validateTeam.js').
const specs = walk(testsDir, new Set(['.js', '.jsx']));
const specTexts = specs.map((f) => fs.readFileSync(f, 'utf8'));

const missing = [];
let total = 0;

for (const [dir, allowedExt] of CONTRACT_DIRS) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  for (const module of walk(abs, allowedExt)) {
    total += 1;
    const rel = module.slice(root.length + 1).replace(/\\/g, '/'); // "src/..."
    if (!specTexts.some((t) => t.includes(rel))) missing.push(rel);
  }
}

if (missing.length === 0) {
  console.log(`✓ check-specs: ${total} pure modules, all imported by a unit spec (ADR-0009).`);
  process.exit(0);
}

console.error(`✗ Pure modules with no unit spec importing them (${missing.length}):`);
for (const m of missing) console.error(`  ${m}`);
console.error(
  '\nBehavior lives in pure tested modules (ADR-0009) — add a spec under tests/unit/ that imports this module.',
);
process.exit(1);
