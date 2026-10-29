// Temporary visual QA: captures every mobile cube face for framing review.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';

const OUT = 'test-results/frames-m';
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({
  viewport: { width: 375, height: 667 },
  isMobile: true,
  hasTouch: true,
});
await page.goto((process.env.CAPTURE_URL || 'http://127.0.0.1:5199/') + '?motion=off', {
  waitUntil: 'networkidle',
});
await page.evaluate(() => document.getElementById('execom')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1500);

const ready = await page.evaluate(() => Boolean(document.querySelector('.execom-cube-swiper')));
if (!ready) throw new Error('mobile cube not found');

await page.evaluate(() => {
  document.querySelector('.execom-cube-swiper').__carouselEngine__?.stopAutoplay();
});

for (let i = 0; i < 11; i += 1) {
  await page.evaluate((i) => {
    const root = document.querySelector('.execom-cube-swiper');
    root.__carouselEngine__.stopAutoplay();
    root.__carouselEngine__.slideTo(11 + i, 0);
  }, i);
  // Wait for the cube rotation to settle on the requested member.
  await page.waitForFunction(
    (i) => {
      const root = document.querySelector('.execom-cube-swiper');
      const img = root.querySelector('[data-slide-active] img:not([aria-hidden="true"])');
      return root.__carouselEngine__.activeIndex % 11 === i && img?.complete;
    },
    i,
    { timeout: 5000 },
  );
  await page.waitForTimeout(1400);
  const alt = await page.evaluate(
    () =>
      document.querySelector(
        '.execom-cube-swiper [data-slide-active] img:not([aria-hidden="true"])',
      )?.alt,
  );
  const slug = alt
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
  console.log(i, alt);
  const card = page.locator('.execom-cube-swiper [data-slide-active] .container-execom').first();
  await card.screenshot({ path: `${OUT}/card-${i}-${slug}.png` });
}

const files = (await fs.readdir(OUT)).filter((f) => f.startsWith('card-'));
const idx = (f) => Number(f.match(/(\d+)/)[1]);
files.sort((a, b) => idx(a) - idx(b));

// Two sheets of 6/5 for review.
const sheet = async (slice, name) => {
  const metas = await Promise.all(slice.map((f) => sharp(`${OUT}/${f}`).metadata()));
  const targetH = 420;
  const widths = metas.map((m) => Math.round((m.width * targetH) / m.height));
  const totalW = widths.reduce((a, b) => a + b, 0) + 8 * (slice.length - 1);
  let x = 0;
  const composites = [];
  for (let i = 0; i < slice.length; i += 1) {
    composites.push({
      input: await sharp(`${OUT}/${slice[i]}`).resize({ height: targetH }).toBuffer(),
      left: x,
      top: 0,
    });
    x += widths[i] + 8;
  }
  await sharp({
    create: { width: totalW, height: targetH, channels: 3, background: { r: 20, g: 20, b: 22 } },
  })
    .composite(composites)
    .png()
    .toFile(name);
};

await sheet(files.slice(0, 6), 'test-results/frames-mobile-a.png');
await sheet(files.slice(6), 'test-results/frames-mobile-b.png');
await browser.close();
console.log('captured', files.length, 'mobile faces');
