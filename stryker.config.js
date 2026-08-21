// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  plugins: ['@stryker-mutator/vitest-runner'],
  mutate: [
    'src/utils/**/*.js',
    'src/data/**/*.js',
    'src/hooks/**/*.js',
    'src/Components/**/*.js',
    'src/Pages/**/*.js',
  ],
  coverageAnalysis: 'perTest',
  reporters: ['clear-text', 'progress'],
  concurrency: 4,
  timeoutMs: 10000,
  vitest: {
    configFile: 'vitest.config.js',
  },
  tempDirName: '.stryker-tmp',
};
