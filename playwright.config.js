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
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    // Kill Chromium's background phone-home (component updater →
    // clients2.google.com, FCM → mtalk.google.com, Safe Browsing pings).
    // Harmless read-only telemetry, but in block-mode CI every attempt trips
    // a Harden-Runner alert, so tests run a fully quiet browser.
    launchOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--no-pings',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-features=Translate,OptimizationHints,MediaRouter,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CaptivePortal',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-device-discovery-notifications',
        '--disable-breakpad',
        '--disable-crash-reporter',
        '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE 127.0.0.1 , EXCLUDE localhost',
      ],
    },
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
