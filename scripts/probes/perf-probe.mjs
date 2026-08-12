import puppeteer from 'puppeteer-core';
import { PREVIEW_URL } from './constants.mjs';

const URL = process.argv[2] || PREVIEW_URL;
const NAME = process.argv[3] || 'SITE';
const THROTTLE = parseFloat(process.argv[4] || '4');

const b = await puppeteer.launch({
  executablePath: 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--user-data-dir=C:/Users/sebin/AppData/Local/Temp/opencode/lh-prof3',
  ],
});
const pg = await b.newPage();
await pg.setViewport({ width: 412, height: 823 });
await pg.setUserAgent(
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
);
await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
const cdp = await pg.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });
await cdp.send('Network.enable');
await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
await cdp.send('Network.setBypassServiceWorker', { bypass: true });

const longTasks = [];
await cdp.send('Performance.enable');
cdp.on('Performance.longTask', (e) => longTasks.push(e));
await pg.evaluateOnNewDocument(() => {
  window.__lcp = 0;
  try {
    new PerformanceObserver((list) => {
      const e = list.getEntries();
      if (e.length) window.__lcp = Math.round(e[e.length - 1].startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
});
const longObs = [];
await pg.evaluateOnNewDocument(() => {
  try {
    new PerformanceObserver((list) => {
      list
        .getEntries()
        .forEach((e) => (window.__lt = (window.__lt || 0) + Math.max(e.duration - 50, 0)));
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
});

await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
await new Promise((r) => setTimeout(r, 5000));

const metrics = await pg.evaluate(() => {
  const paint = performance
    .getEntriesByType('paint')
    .reduce((a, e) => ({ ...a, [e.name]: Math.round(e.startTime) }), {});
  const res = performance.getEntriesByType('resource');
  const js = res.filter((e) => /\.js$/.test(e.name));
  const fonts = res.filter((e) => /\.woff2$/.test(e.name));
  const img = res.filter((e) => /\.(webp|png|avif)$/.test(e.name));
  const sum = (a) => Math.round(a.reduce((s, e) => s + e.transferSize, 0) / 1024);
  return {
    FCP: paint['first-contentful-paint'],
    LCP: window.__lcp,
    DCL: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
    jsCount: js.length,
    jsKB: sum(js),
    fontKB: sum(fonts),
    imgKB: sum(img),
    totalKB: sum(res),
    obsTBT: Math.round(window.__lt || 0),
  };
});
metrics.TBTms = Math.round(
  longTasks
    .map((t) => t.duration - 50)
    .filter((d) => d > 0)
    .reduce((a, d) => a + d, 0),
);
metrics.longTaskCount = longTasks.length;

// are the woff2 fonts actually delaying first paint? check font request start vs FCP
const fontTiming = await pg.evaluate(() => {
  const f = performance
    .getEntriesByType('resource')
    .filter((e) => /\.woff2$/.test(e.name))
    .map((e) => ({
      n: e.name.split('/').pop(),
      start: Math.round(e.startTime),
      dur: Math.round(e.duration),
    }));
  return f;
});

console.log(
  JSON.stringify({ run: NAME, throttle: THROTTLE, ...metrics, fonts: fontTiming }, null, 1),
);
await b.close();
