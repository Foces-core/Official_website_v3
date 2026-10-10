#!/usr/bin/env node
/**
 * ci-fast — the blocking-but-fast local gate (runs on `pnpm ci:fast` and the
 * pre-push hook). Complements CI: same checks, fewer of them, all parallel,
 * deterministic. Budget: < 90s on a dev machine.
 *
 * Parallel lanes:
 *   1. eslint          (lint)
 *   2. prettier check  (format:check)
 *   3. vitest unit     (test:unit)
 *   4. production vite build + prerender (build)
 *
 * Any lane failing → non-zero exit, so the hook blocks. The full CI in
 * .github/workflows keeps the E2E (Playwright) and probe checks; this gate
 * covers everything that must not even reach CI broken.
 *
 * Env passthrough: SWC_NATIVE_BINDING_CACHE (see AGENTS.md §2.1a).
 */
import { spawn } from 'node:child_process';
import { performance } from 'node:perf_hooks';

const LANE_LABEL = {
  lint: 'eslint',
  'format:check': 'prettier',
  'test:unit': 'vitest unit',
  build: 'vite build + prerender',
};

const pnpmBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function runLane(script) {
  return new Promise((resolve) => {
    const started = performance.now();
    const child = spawn(pnpmBin, ['run', script], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      env: process.env,
    });
    let out = '';
    const tail = (chunk) => {
      out += chunk;
      // keep only the most recent 4KB per lane; failures print the tail.
      if (out.length > 8192) out = out.slice(-8192);
    };
    child.stdout.on('data', tail);
    child.stderr.on('data', tail);
    child.on('close', (code) =>
      resolve({ script, code, ms: Math.round(performance.now() - started), out }),
    );
  });
}

const t0 = performance.now();
const lanes = ['lint', 'format:check', 'test:unit', 'build'].map((s) => runLane(s));
const results = await Promise.all(lanes);
const total = Math.round(performance.now() - t0);

let failed = false;
for (const r of results) {
  const ok = r.code === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${LANE_LABEL[r.script] ?? r.script}  (${r.ms}ms)`);
}
if (failed) {
  for (const r of results.filter((x) => x.code !== 0)) {
    console.log(`\n===== ${LANE_LABEL[r.script] ?? r.script} (tail) =====`);
    console.log(r.out.trim().split('\n').slice(-25).join('\n'));
  }
  console.log(`\nci-fast: FAILED in ${total}ms — fix before push (CI runs the full suite).`);
  process.exit(1);
}
console.log(`\nci-fast: all lanes green in ${total}ms.`);
