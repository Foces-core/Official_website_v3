/**
 * Shared constants + browser launchers for probe scripts.
 *
 * All probes read PREVIEW_URL from the environment, defaulting to the local
 * preview server, and resolve Chrome via CHROME_PATH (or Firefox via
 * FIREFOX_PATH), falling back to Playwright's installed Chromium and then
 * common system locations. That keeps the same scripts runnable on any
 * developer machine and in CI — no hardcoded user paths.
 */

import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173';
export const DEV_URL = process.env.DEV_URL ?? 'http://localhost:5173';

function findPlaywrightChromium() {
  try {
    const cache = path.join(os.homedir(), '.cache', 'ms-playwright');
    if (!existsSync(cache)) return null;
    const dirs = readdirSync(cache).filter((d) => d.startsWith('chromium'));
    for (const dir of dirs) {
      const candidates =
        process.platform === 'win32'
          ? [path.join(cache, dir, 'chrome.exe')]
          : process.platform === 'darwin'
            ? [path.join(cache, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium')]
            : [path.join(cache, dir, 'chrome-linux', 'chrome')];
      for (const c of candidates) {
        if (existsSync(c)) return c;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

// Puppeteer spawns the browser binary directly, so Windows script shims
// (.bat/.cmd — e.g. a CHROME_PATH pointing at an agent wrapper) can never
// work. Reject them and any non-file path.
function isLaunchableBinary(p) {
  if (typeof p !== 'string' || !p || !existsSync(p)) return false;
  if (/(?:\.(?:bat|cmd|ps1))$/i.test(p)) return false;
  return true;
}

/** Resolve a Chrome/Chromium binary, or null (caller decides how to fail). */
export function resolveChrome() {
  if (isLaunchableBinary(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const playwrightChrome = findPlaywrightChromium();
  if (playwrightChrome) return playwrightChrome;

  const platformCandidates =
    process.platform === 'win32'
      ? [
          process.env.LOCALAPPDATA
            ? path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
            : null,
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        ]
      : process.platform === 'darwin'
        ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
        : ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];

  return platformCandidates.filter(isLaunchableBinary).find(() => true) ?? null;
}

/** Resolve a Firefox binary (firefox-probe only), or null. */
export function resolveFirefox() {
  if (isLaunchableBinary(process.env.FIREFOX_PATH)) {
    return process.env.FIREFOX_PATH;
  }
  const candidates =
    process.platform === 'win32'
      ? ['C:/Program Files/Mozilla Firefox/firefox.exe', 'C:/Program Files/Waterfox/waterfox.exe']
      : process.platform === 'darwin'
        ? ['/Applications/Firefox.app/Contents/MacOS/firefox']
        : ['/usr/bin/firefox'];
  return candidates.filter(isLaunchableBinary).find(() => true) ?? null;
}
