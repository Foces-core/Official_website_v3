import puppeteer from 'puppeteer-core';
import { PREVIEW_URL, QUIET_CHROMIUM_ARGS, resolveChrome } from './constants.mjs';

// Boot-failure probe: load the page, capture every console error / page
// error / failed request, and report whether React actually painted.
const target = process.env.PROBE_TARGET ?? PREVIEW_URL;
const chromePath = resolveChrome();
if (!chromePath) {
  console.error('Chrome not found — set CHROME_PATH.');
  process.exit(1);
}
const b = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: [...QUIET_CHROMIUM_ARGS],
});

// Crash-safe lifecycle: errors are collected from the start, a navigation
// or evaluation failure still prints everything gathered so far, and the
// browser is ALWAYS closed (no orphaned Chromium on a failed run).
const errors = [];
try {
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 900 });

  p.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      errors.push(`[console.${msg.type()}] ${msg.text()}`);
    }
  });
  p.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  p.on('requestfailed', (req) => {
    errors.push(`[requestfailed] ${req.url()} — ${req.failure()?.errorText}`);
  });

  await p.goto(`${target}/`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));

  const painted = await p.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootChildren: root ? root.children.length : -1,
      splashGone: !document.getElementById('boot-splash'),
      heroText: document.body.innerText.slice(0, 120).replace(/\n/g, ' | '),
    };
  });

  console.log('TARGET:', target);
  console.log('PAINTED:', JSON.stringify(painted));
  console.log('ERRORS:', errors.length === 0 ? 'none' : '');
  errors.slice(0, 20).forEach((e) => console.log(' ', e));
  if (
    !painted.rootChildren ||
    !painted.splashGone ||
    errors.some((e) => e.startsWith('[pageerror]'))
  ) {
    process.exitCode = 1;
  }
} catch (err) {
  console.log('PROBE FAILED:', err.message);
  console.log('ERRORS COLLECTED SO FAR:', errors.length === 0 ? 'none' : '');
  errors.slice(0, 20).forEach((e) => console.log(' ', e));
  process.exitCode = 1;
} finally {
  await b.close();
}
