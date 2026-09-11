// @ts-check
/**
 * Mutation testing (AGENTS.md contract enforcement).
 *
 * AGENTS.md requires mutation testing when changing pure decision modules
 * with a break threshold of 70% overall (80% for critical decision modules).
 * There is deliberately NO CI gate — mutation runs are slow and noisy under
 * shared CI contention (same rationale as the perf lab probes). Run manually
 * on a quiet machine when you touch src/utils, src/data, src/hooks, or the
 * pure *.js modules beside components/pages:
 *
 *   pnpm test:mutation                                    # everything in scope (slow)
 *   pnpm test:mutation -- --mutate src/utils/offlineToast.js   # one module (fast)
 *
 * The mutate globs mirror scripts/maintenance/check-specs.mjs (the ADR-0009
 * contract): src/utils (.js + .jsx — DeferredAnalytics.jsx is pure logic),
 * src/data (.js), src/hooks (.js), src/Components + src/Pages (.js only —
 * .jsx there is wiring, covered by the Playwright E2E suite).
 *
 * Thresholds: `break: 70` fails the run below 70% overall. The 80% bar for
 * critical decision modules (routePrefetchLogic, experienceTier, …) is review
 * policy, not a config value — Stryker only supports a global break, so a
 * green run with a weak critical file still needs human/AGENTS.md judgment.
 * Conversely, wiring-heavy hooks legitimately score below 70 per file: SSR
 * guards, listener cleanup, and effect dep arrays produce equivalent mutants
 * no test can kill (AGENTS.md: ~23% equivalent mutants are expected). Judge
 * the per-file report — survived mutants in pure decision logic need new
 * assertions; survivors in defensive wiring usually need none.
 */

/** @type {import('@stryker-mutator/api').StrykerOptions} */
export default {
  testRunner: 'vitest',
  reporters: ['clear-text'],
  // Explicit plugin list: Stryker's default '@stryker-mutator/*' glob does not
  // resolve under pnpm's strict node_modules layout ("no TestRunner plugins
  // were loaded"). Pin the runner directly.
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: [
    'src/utils/**/*.js',
    'src/utils/**/*.jsx',
    'src/data/**/*.js',
    'src/hooks/**/*.js',
    'src/Components/**/*.js',
    '!src/Components/**/*.jsx',
    'src/Pages/**/*.js',
    '!src/Pages/**/*.jsx',
  ],
  ignorePatterns: ['foces-webv23/**', 'dist/**', 'coverage/**', '.stryker-tmp/**'],
  thresholds: { high: 80, low: 70, break: 70 },
  timeoutMS: 20000,
  timeoutFactor: 1.5,
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
};
