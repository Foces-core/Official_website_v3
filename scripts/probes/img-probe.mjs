import puppeteer from 'puppeteer-core';
import { PREVIEW_URL, resolveChrome } from './constants.mjs';

const chromePath = resolveChrome();
if (!chromePath) {
  console.error('Chrome not found — set CHROME_PATH to the Chrome/Chromium binary.');
  process.exit(1);
}
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox'],
  executablePath: chromePath,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
await page.goto(PREVIEW_URL, { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2200));
const out = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(
    (i) => i.src.includes('webp') || i.src.includes('assets'),
  );
  return {
    webpCount: imgs.length,
    broken: imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.slice(-30)),
    featureSlides: [...document.querySelectorAll('img[alt*="ECHO"]')].map((i) =>
      i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN',
    ),
    eventImgs: [...document.querySelectorAll('.group img')]
      .slice(0, 3)
      .map((i) => (i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN')),
    fontLoaded: document.fonts.check('16px "Inter Variable"'),
    sputnik: document.fonts.check('16px "Space Grotesk Variable"'),
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
