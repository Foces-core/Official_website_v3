import puppeteer from 'puppeteer-core';
import { PREVIEW_URL, resolveChrome } from './constants.mjs';

// Boot profiler: where does the JS boot time go?
//
// Usage:  node scripts/probes/boot-profile.mjs [throttle] [url]
//   throttle: CPU throttle multiplier (1 = no throttle, 4 = mid-tier phone sim)
//   url:      default PREVIEW_URL
//
// Collects three layers of evidence:
//   1. Long-task attribution — total main-thread busy time, and per-script
//      breakdown (Chrome attributes long tasks to the script that caused them).
//   2. V8 CPU profile — function-level self time aggregated per chunk URL,
//      so "React internals" vs "our app code" vs "third-party libs" separate.
//   3. Resource + paint timings — how much of the gap is network vs compute.

const THROTTLE = Number(process.argv[2] || '1');
const URL = process.argv[3] || PREVIEW_URL;

const chromePath = resolveChrome();
if (!chromePath) {
  console.error('Chrome not found — set CHROME_PATH to the Chrome/Chromium binary.');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-extensions'],
});

const page = await browser.newPage();
await page.setViewport({ width: 412, height: 823 });
await page.setUserAgent(
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
);

// Install collectors before any page script runs.
await page.evaluateOnNewDocument(() => {
  window.__boot = { longtasks: [], paints: {}, resources: [], marks: {} };
  // Stamp when the boot splash element is removed (it occludes the hero, and
  // occluded elements don't contribute LCP). Observe `document` — at
  // document-start, document.documentElement does not exist yet.
  new MutationObserver(() => {
    if (!document.getElementById('boot-splash')) window.__bootSplashGoneAt = performance.now();
  }).observe(document, { childList: true, subtree: true });
  window.__boot.markStart = performance.now();
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        const attrs = (e.attribution || []).map((a) => ({
          src: a.containerSrc || '',
          name: a.containerName || '',
          type: a.containerType || '',
        }));
        window.__boot.longtasks.push({ dur: e.duration, start: e.startTime, attrs });
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__boot.paints[e.name] = Math.round(e.startTime);
    }).observe({ type: 'paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) {
        if (e.entryType === 'largest-contentful-paint') {
          // Keep the LATEST candidate (hero image), not the first (splash logo).
          window.__boot.lcp = Math.round(e.startTime);
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
});

const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.setBypassServiceWorker', { bypass: true });
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); // 1ms samples
await cdp.send('Profiler.start');

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

// Wait for boot to settle: first paint + main-thread quiet. Under throttle the
// boot stretches, so wait proportionally longer.
const settleMs = 3000 + THROTTLE * 2500;
await new Promise((r) => setTimeout(r, settleMs));

const metrics = await page.evaluate(() => {
  // LCP read from the observer value first (window.__boot.lcp), falling back
  // to the buffer. The buffer alone is unreliable: Chromium drops LCP entries
  // whose candidate element is later removed from the DOM (our inline splash
  // logo img is removed with the splash, so its entry vanishes — measured).
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  const lcp =
    window.__boot.lcp ??
    (lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : undefined);
  // When did the inline boot splash go away? While it covers the viewport the
  // hero is occluded, which delays its LCP entry.
  const splashGoneAt = window.__bootSplashGoneAt || null;
  const res = performance.getEntriesByType('resource');
  const scripts = res
    .filter((r) => /\.js(\?|$)/.test(r.name) || /\.js$/.test(r.name))
    .map((r) => ({
      name: r.name.split('/').pop().split('?')[0].slice(0, 48),
      start: Math.round(r.startTime),
      dur: Math.round(r.duration),
      xfer: Math.round(r.transferSize / 1024),
    }));
  const paints = performance
    .getEntriesByType('paint')
    .reduce((a, e) => ({ ...a, [e.name]: Math.round(e.startTime) }), {});
  const nav = performance.getEntriesByType('navigation')[0];
  const lt = window.__boot.longtasks;
  const byScript = {};
  for (const t of lt) {
    const src = t.attrs[0]?.src || 'unknown';
    byScript[src] = (byScript[src] || 0) + t.dur;
  }
  return {
    FCP: window.__boot.paints['first-contentful-paint'] ?? paints['first-contentful-paint'],
    LCP: lcp,
    DCL: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
    splashGoneAt,
    tbt: Math.round(lt.reduce((a, t) => a + Math.max(t.dur - 50, 0), 0)),
    busy: Math.round(lt.reduce((a, t) => a + t.dur, 0)),
    longtaskCount: lt.length,
    scripts,
    byScript: Object.entries(byScript)
      .map(([k, v]) => ({ src: k.split('/').pop().slice(0, 48), ms: Math.round(v) }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 8),
  };
});

const profile = await cdp.send('Profiler.stop');
await browser.close();

// Aggregate the CPU profile: wall-time per sample (timeDeltas), attributed to
// the sampled function's URL; then self-time per function within each URL.
const nodes = new Map(profile.profile.nodes.map((n) => [n.id, n]));
const perUrl = new Map();
const perFn = new Map();
let totalMs = 0;
profile.profile.samples.forEach((nodeId, i) => {
  const deltaMs = (profile.profile.timeDeltas[i] || 0) / 1000;
  totalMs += deltaMs;
  const node = nodes.get(nodeId);
  if (!node) return;
  const url = node.callFrame.url || '(unknown)';
  const key = url.split('/').pop().slice(0, 48);
  perUrl.set(key, (perUrl.get(key) || 0) + deltaMs);
  const fn = `${node.callFrame.functionName || '(anon)'}`;
  const fkey = `${key} :: ${fn}`;
  perFn.set(fkey, (perFn.get(fkey) || 0) + deltaMs);
});

const urlTable = [...perUrl.entries()]
  .map(([url, ms]) => ({ url, ms: Math.round(ms) }))
  .sort((a, b) => b.ms - a.ms)
  .slice(0, 12);

const fnTable = [...perFn.entries()]
  .map(([name, ms]) => ({ name, ms: Math.round(ms) }))
  .sort((a, b) => b.ms - a.ms)
  .slice(0, 25);

console.log(
  JSON.stringify(
    {
      throttle: THROTTLE,
      url: URL,
      totalCpuMs: Math.round(totalMs),
      metrics,
      cpuByUrl: urlTable,
      topFunctions: fnTable,
    },
    null,
    1,
  ),
);
