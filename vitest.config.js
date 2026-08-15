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
    // Coverage is measured over the unit-test contract and enforced in CI
    // (the CI unit step runs with --coverage). Pure logic lives in
    // src/utils, src/data, src/hooks, the *.js modules inside Components,
    // and pure modules beside route components (src/Pages — e.g. Navbar's
    // navSpy) — those are unit-spec'd (ADR-0009), and check:specs fails any
    // new module that lands without a spec. JSX wiring components are
    // deliberately excluded: they carry no behavior and are covered by the
    // Playwright E2E suite, so counting them here would drag the threshold
    // to noise. Thresholds are set just under measured values so a
    // regression fails the run that produced it.
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
      thresholds: {
        lines: 90,
        functions: 85,
        statements: 90,
        branches: 85,
      },
    },
  },
});
