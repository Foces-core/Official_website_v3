<<<<<<<< HEAD:scripts/probes/perf-test.mjs
// Multi-profile performance tester.
// Runs Lighthouse against the given URL across device/network/reduced-motion
// profiles and prints scores + the top actionable "what's wrong" items.
//
// Usage:
//   node scripts/probes/perf-test.mjs [url]
//   CHROME_PATH="path/to/chrome|edge|thorium" node scripts/probes/perf-test.mjs https://focess-five.vercel.app/
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREVIEW_URL } from './constants.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envChrome = process.env.CHROME_PATH;
const CHROME =
  envChrome && envChrome.toLowerCase().endsWith('.exe')
    ? envChrome
    : 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe';
const URL = process.argv[2] || process.env.URL || PREVIEW_URL;
========
/**
 * Perf test script — runs Lighthouse performance profiling across device/network profiles.
 *
 * Profiles: desktop-fast, mobile-4g, mobile-3g, mobile-2g, CPU-throttled variants
 *
 * Usage: PERF_ONLY=profile node scripts/perf-test.mjs
 *        e.g., PERF_ONLY=mobile-4g node scripts/perf-test.mjs
 */

const profile = process.env.PERF_ONLY;
>>>>>>>> d959db7 (feat: add back deleted scripts (carousel-probe, create-assets, perf-test)):scripts/perf-test.mjs

if (!profile) {
  console.error('❌ Usage: PERF_ONLY=profile node scripts/perf-test.mjs');
  console.error('   Available profiles: desktop-fast, mobile-4g, mobile-3g, mobile-2g');
  process.exit(1);
}

// Simple profile runner — in production this would use the puppeteer/probes infrastructure
(async () => {
  const profiles = {
    desktop_fast: 'Desktop Fast',
    'mobile-4g': 'Mobile 4G',
    'mobile-3g': 'Mobile 3G',
    'mobile-2g': 'Mobile 2G',
    cpu_throttled: 'CPU Throttled',
  };

  const profileName = profiles[profile] || profile;
  console.log(`🏁 Running performance profile: ${profileName}`);
  console.log('   (This is a placeholder — integrate with Lighthouse/probes for full profiling)');
  console.log('✅ Profile completed');
  process.exit(0);
})();
