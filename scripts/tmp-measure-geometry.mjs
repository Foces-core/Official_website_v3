// Temporary visual QA: reads each desktop portrait's runtime cover geometry so
// vertical crop offsets can be converted between percentages and pixels.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5199/', {
  waitUntil: 'networkidle',
});
await page.evaluate(() => document.getElementById('execom')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1500);

// Drive the carousel through every slot so lazy portraits load, then return.
await page.evaluate(() => {
  const root = document.querySelector('.execom-swiper');
  root.__carouselEngine__?.stopAutoplay();
});
for (let i = 0; i < 11; i += 1) {
  await page.evaluate((i) => {
    const root = document.querySelector('.execom-swiper');
    root.__carouselEngine__.slideTo(11 + i, 0);
  }, i);
  await page.waitForTimeout(350);
}
await page.waitForTimeout(500);

const rows = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.execom-swiper img:not([aria-hidden="true"])')];
  const seen = new Set();
  const out = [];
  for (const img of imgs) {
    const alt = img.alt;
    if (!alt || seen.has(alt)) continue;
    seen.add(alt);
    const box = img.getBoundingClientRect();
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    const scale = Math.max(box.width / natW, box.height / natH);
    const renderedH = natH * scale;
    const renderedW = natW * scale;
    const style = getComputedStyle(img);
    out.push({
      alt,
      boxW: Math.round(box.width),
      boxH: Math.round(box.height),
      natW,
      natH,
      renderedW: Math.round(renderedW),
      renderedH: Math.round(renderedH),
      slackH: Math.round(renderedH - box.height),
      objectPosition: style.objectPosition,
      src: (img.currentSrc || img.src).split('/').pop(),
    });
  }
  return out;
});

console.log(
  [
    'name'.padEnd(26),
    'box'.padStart(9),
    'nat'.padStart(10),
    'rendH'.padStart(7),
    'slackH'.padStart(7),
    'objectPosition',
  ].join(' '),
);
for (const r of rows) {
  console.log(
    [
      r.alt.padEnd(26),
      `${r.boxW}x${r.boxH}`.padStart(9),
      `${r.natW}x${r.natH}`.padStart(10),
      String(r.renderedH).padStart(7),
      String(r.slackH).padStart(7),
      r.objectPosition,
    ].join(' '),
  );
}

await browser.close();
