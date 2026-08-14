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
  },
});
