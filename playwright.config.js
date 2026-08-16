import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PLAYWRIGHT_PORT || 5174;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  // Vitest owns tests/unit/ (pure-logic suites) — exclude them so Playwright
  // doesn't try to run them as browser E2E.
  testIgnore: ['**/unit/**'],
  fullyParallel: false,
  timeout: 60_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  // Run E2E against the PRODUCTION build (vite build + vite preview), not the
  // dev server — catches minification, code-splitting, and asset-hash issues
  // that never surface in dev. Locally, a preview server can be started
  // manually and this will reuse it (reuseExistingServer).
  webServer: {
    command: `pnpm build && node scripts/static-server.mjs`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 375, height: 667 },
        baseURL: BASE_URL,
      },
    },
  ],
});
