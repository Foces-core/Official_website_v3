// Firefox-engine probe (Gecko rendering + boot behavior).
//
// Primary: Playwright's bundled Firefox (BiDi transport maintained by the
// Playwright team; works out of the box where raw puppeteer-core + system
// Firefox fails on Windows since FF ~140+ removed the legacy remote-agent
// flags puppeteer still emits). Fallback: puppeteer-core with FIREFOX_PATH —
// kept for systems where puppeteer's BiDi handshake still works.
//
// CPU throttling is Chrome/CDP-only, so it is reported as n/a here.
//
// Usage:
//   node scripts/probes/firefox-probe.mjs
//   PREVIEW_URL=http://localhost:4173 node scripts/probes/firefox-probe.mjs
import { PREVIEW_URL, resolveFirefox } from './constants.mjs';

const FF = process.env.FIREFOX_PATH ?? resolveFirefox();
if (!FF) {
  console.error('Firefox not found — set FIREFOX_PATH to the Firefox binary.');
  process.exit(1);
}

const errors = [];
let browser = null;
let flavor = '';

// --- Primary: Playwright firefox -------------------------------------------
try {
  // Resolve playwright-core out of the repo's pnpm store — it is not hoisted
  // to node_modules directly; the `.pnpm` store owns it.
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { fileURLToPath } = await import('node:url');
  const pwDir = fileURLToPath(
    new URL(
      '../../node_modules/.pnpm/playwright@1.64.0/node_modules/playwright-core/index.js',
      import.meta.url,
    ),
  );
  const pw = require(pwDir);
  // Prefer the Playwright-bundled Firefox (its remote-agent transport is kept
  // in lockstep with the library). A system Firefox install is often TOO NEW
  // for the bundled Juggler/BiDi handshake → "Failed to launch: Code: 0".
  try {
    browser = await pw.firefox.launch({
      headless: true,
      firefoxUserPrefs: { 'dom.user.disable_js_slow_scripts': false },
      timeout: 45_000,
    });
  } catch {
    // Registry entry missing (installed cache older than the registry rev):
    // use the newest ms-playwright Firefox found on disk, then FIREFOX_PATH.
    const os = await import('node:os');
    const fs = await import('node:fs');
    const path = await import('node:path');
    const cache = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright');
    let exe = FF;
    if (fs.existsSync(cache)) {
      const revs = fs
        .readdirSync(cache)
        .filter((d) => d.startsWith('firefox-'))
        .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
      for (const d of revs) {
        const candidate = path.join(cache, d, 'firefox', 'firefox.exe');
        if (fs.existsSync(candidate)) {
          exe = candidate;
          break;
        }
      }
    }
    browser = await pw.firefox.launch({
      headless: true,
      executablePath: exe,
      firefoxUserPrefs: { 'dom.user.disable_js_slow_scripts': false },
      timeout: 45_000,
    });
  }
  flavor = `playwright-firefox (${await browser.version()})`;
} catch (e) {
  console.log(
    `playwright firefox launch failed (${String(e.message).split('\n')[0]}) — falling back to puppeteer`,
  );
}

// --- Fallback: puppeteer-core ----------------------------------------------
if (!browser) {
  const puppeteer = (await import('puppeteer-core')).default;
  const os = await import('node:os');
  const path = await import('node:path');
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: FF,
      product: 'firefox',
      userDataDir: process.env.FIREFOX_PROFILE_DIR ?? path.join(os.tmpdir(), 'foces-ffprobe'),
      args: ['--no-sandbox'],
    });
    flavor = 'puppeteer-firefox';
  } catch (e) {
    console.log('Firefox launch failed:', e.message.split('\n')[0]);
    process.exit(1);
  }
}

// --- Shared checks (API-neutral subset) -------------------------------------
const page = await (flavor.startsWith('playwright')
  ? browser.newPage().then(async (p) => {
      await p.setViewportSize({ width: 390, height: 844 });
      return p;
    })
  : (async () => {
      const p = await browser.newPage();
      await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      return p;
    })());
page.setDefaultNavigationTimeout?.(90_000);
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 120));
});
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 120)));

console.log('engine:', flavor);
console.log('CPU throttle: n/a (CDP-only, not supported on Gecko)');

await page.goto(`${PREVIEW_URL}/`, { waitUntil: 'domcontentloaded' });
let waitMs = 3000;
await new Promise((r) => setTimeout(r, waitMs));

const out = await page.evaluate(() => ({
  title: document.title.slice(0, 40),
  joinBtn: !!document.querySelector('button.contact'),
  nav: !!document.getElementById('nav-items'),
  featured: [...document.querySelectorAll('img[alt*="ECHO"]')].map((i) =>
    i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN',
  ),
  eventImgs: [...document.querySelectorAll('.group img')]
    .slice(0, 3)
    .map((i) => (i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN')),
  fonts: document.fonts.check('16px "Inter Variable"'),
  splashGone: !document.querySelector('.coffee'),
}));
console.log('gecko home:', JSON.stringify(out));
console.log('console errors:', errors.length ? errors.slice(0, 5) : 'none');

// /events route — puppeteer needs networkidle2, playwright networkidle.
await page.goto(`${PREVIEW_URL}/events`, {
  waitUntil: flavor.startsWith('playwright') ? 'networkidle' : 'networkidle2',
});
await new Promise((r) => setTimeout(r, 1500));
const ev = await page.evaluate(() => ({
  h2s: [...document.querySelectorAll('h2')].map((h) => h.textContent),
  posters: [...document.querySelectorAll('img')].filter(
    (i) => i.naturalWidth > 0 && i.closest('a,div'),
  ).length,
}));
console.log('gecko /events:', JSON.stringify(ev));

await browser.close();
