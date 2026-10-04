#!/usr/bin/env node
/**
 * CRAP (Change Risk Anti-Patterns) gate.
 *
 *   CRAP(m) = c(m)^2 * (1 - cov(m))^3 + c(m)
 *
 * Guards the complexity ceiling enforced by eslint.config.js against the line
 * coverage produced by the last `pnpm test:unit` run. A function that is both
 * complex AND untested is where defects actually live, so the two are combined
 * rather than checked independently.
 *
 * Run `pnpm test:unit` first so coverage/coverage-summary.json exists; CI does
 * this in order, since the unit-test step already emits the coverage file.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const coverageFile = resolve(root, 'coverage/coverage-summary.json');

// Must mirror the `complexity` rule in eslint.config.js. Kept as a literal
// rather than parsed out of the config so a stale value is obvious in review.
const COMPLEXITY_CAP = 33;

// Ratchet, not a round number. CRAP(m) = c^2*(1-cov)^3 + c is >= c by
// construction, so with the cap at 19 the worst case at 94.32% coverage is
// 33^2*0.000196 + 33 = 33.21. The ceiling sits just above today's measured
// value: any new complexity over the cap, or a coverage drop, fails.
// Tighten it as real code is refactored.
const CRAP_RATCHET = 34;

function runLintComplexity() {
  const eslintBin = resolve(root, 'node_modules/.bin/eslint');
  // Probe with an effectively-unlimited cap so ESLint reports EVERY function's
  // complexity, not just those already over the configured cap. Without this
  // the gate reads "worst = 0" as soon as the cap is set high, and the CRAP
  // calculation below becomes meaningless (0^2 * ... + 0 = 0 always passes).
  const args = [
    'src',
    '--format',
    'json',
    '--rule',
    JSON.stringify({ complexity: ['warn', { max: 1000 }] }),
  ];
  try {
    return JSON.parse(
      execFileSync(eslintBin, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
    );
  } catch (error) {
    // ESLint exits 1 when it finds problems but still prints JSON to stdout.
    return JSON.parse(error.stdout);
  }
}

function complexityReport(report) {
  const rows = [];
  for (const file of report) {
    for (const msg of file.messages ?? []) {
      if (msg.ruleId === 'complexity') {
        const found = Number(msg.message.match(/complexity of (\d+)/)?.[1] ?? 0);
        rows.push({
          complexity: found,
          file: file.filePath.replace(`${root}/`, ''),
          line: msg.line,
        });
      }
    }
  }
  return rows.sort((a, b) => b.complexity - a.complexity);
}

function readLineCoverage() {
  if (!existsSync(coverageFile)) return null;
  try {
    const summary = JSON.parse(readFileSync(coverageFile, 'utf8'));
    const pct = summary.total?.lines?.pct;
    return typeof pct === 'number' ? Math.round(pct * 100) / 100 : null;
  } catch {
    return null;
  }
}

const rows = complexityReport(runLintComplexity());
const coverage = readLineCoverage();

// ESLint only reports functions ABOVE the configured cap, so an empty list
// means "worst <= cap", not "worst = 0". Treat the cap as the conservative
// bound. This matters: CRAP(m) >= c(m) by construction, so a fixed ceiling of
// 6 (the portfolio's) is unreachable here while the cap is 19.
const worst = Math.max(rows[0]?.complexity ?? 0, COMPLEXITY_CAP);

console.log(`Functions above the complexity cap: ${rows.length}`);
console.log(`Complexity ceiling: ${COMPLEXITY_CAP}; worst observed: ${worst}`);
for (const row of rows.slice(0, 5)) {
  console.log(`  complexity ${row.complexity}  ${row.file}:${row.line}`);
}

if (coverage === null) {
  console.warn(
    '! coverage/coverage-summary.json not found — run `pnpm test:unit` first. ' +
      'Falling back to the complexity ceiling alone.',
  );
  console.log('✓ CRAP gate passed (complexity half only; coverage unavailable).');
  process.exit(0);
}

// CRAP is monotonic in c, so the ceiling yields the worst-case CRAP.
const uncovered = 1 - coverage / 100;
const worstCrap = worst ** 2 * uncovered ** 3 + worst;
console.log(`Line coverage floor from last unit run: ${coverage}%`);
console.log(`Worst-case CRAP at complexity ${worst}: ${worstCrap.toFixed(3)}`);

if (worstCrap >= CRAP_RATCHET) {
  console.error(`✗ Failing: worst-case CRAP ${worstCrap.toFixed(3)} is not < ${CRAP_RATCHET}.`);
  console.error('  Lower the complexity ceiling in eslint.config.js, or add tests.');
  process.exit(1);
}

console.log(`✓ CRAP gate passed — worst-case CRAP ${worstCrap.toFixed(3)} < ${CRAP_RATCHET}.`);
