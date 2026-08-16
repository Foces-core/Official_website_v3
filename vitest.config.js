import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';

// Unit tests run in jsdom: the modules under test (detectProfile,
// keyboardLock, srcset) read browser globals (window, navigator, matchMedia,
// document.activeElement), which Vitest's jsdom environment provides without
// a browser. E2E stays on Playwright (tests/); this file only covers the
// fast pure-logic suites in tests/unit/.
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/unit/**/*.spec.{js,jsx}'],
    environment: 'jsdom',
    setupFiles: ['tests/unit/setup.js'],
    // Coverage is measured over the unit-test contract and reported in CI
    // (the CI unit step runs with --coverage) but NOT gated: enforcement
    // lives in check:specs (ADR-0009), which fails any pure module that
    // lands without a unit spec — named and fast, instead of an aggregate
    // percentage that drifts with unrelated refactors. Pure logic lives in
    // src/utils, src/data, src/hooks, the *.js modules inside Components,
    // and pure modules beside route components (src/Pages — e.g. Navbar's
    // navSpy). JSX wiring components are deliberately excluded: they carry
    // no behavior and are covered by the Playwright E2E suite.
    coverage: {
      provider: 'v8',
      include: [
        'src/utils/**/*.{js,jsx}',
        'src/data/**/*.js',
        'src/hooks/**/*.js',
        'src/Components/**/*.js',
        'src/Pages/**/*.js',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
});
