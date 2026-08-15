// Reads .perf-report.json (written by probe:perf) and fails when any measured
// profile breaches a budget. Runs nightly via .github/workflows/perf-nightly.yml
// so ADR-0001 ("performance is a feature") is guarded without blocking PRs on
// Lighthouse timing jitter.
//
// Budgets are deliberately generous — the point is catching real regressions
// (a new heavy dependency, images without srcset, a removed lazy-load), not
// run-to-run noise.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(__dirname, '../.perf-report.json');

// Baseline (measured 2026-08-15, probe:perf against a local preview):
//   mobile-4g LCP 3.33s, CLS 0.0, desktop transfer ~370KB.
// Budgets are baseline + headroom so the nightly tracks *regressions*, not
// the current state — the 3.3s 4G LCP is a known opportunity, not a failure.
const BUDGETS = {
  lcpMs: 4000, // Largest Contentful Paint on the throttled mobile-4g profile
  cls: 0.15, // Cumulative Layout Shift (Lighthouse "good" is ≤ 0.1, leave headroom)
  transferKB: 2500, // total transfer on desktop-fast
};

const report = JSON.parse(await readFile(reportPath, 'utf8'));
const byId = Object.fromEntries(report.map((r) => [r.id, r]));

const failures = [];
const mobile4g = byId['mobile-4g'];
if (mobile4g) {
  if (mobile4g.lcp > BUDGETS.lcpMs) {
    failures.push(`mobile-4g LCP ${(mobile4g.lcp / 1000).toFixed(2)}s > ${BUDGETS.lcpMs / 1000}s`);
  }
  if (mobile4g.cls > BUDGETS.cls) {
    failures.push(`mobile-4g CLS ${mobile4g.cls} > ${BUDGETS.cls}`);
  }
}
const desktop = byId['desktop-fast'];
if (desktop && desktop.transferKB > BUDGETS.transferKB) {
  failures.push(`desktop-fast transfer ${desktop.transferKB}KB > ${BUDGETS.transferKB}KB`);
}

if (failures.length) {
  console.error('PERF BUDGET BREACHED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Perf budgets OK');
