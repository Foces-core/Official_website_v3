// Temporary visual QA helper: captures every desktop team card from the dev
// server and stitches them into contact sheets for side-by-side review.
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import fs from 'node:fs/promises';

const BASE = process.env.CAPTURE_URL || 'http://127.0.0.1:5199/';
const OUT = 'test-results/frames';

const NAMES = [
  'Aleetta Mariya Sebastian',
  'Lisha Jins',
  'Steve Jose',
  'Anna Rachel Mathew',
  'Amanul Farhan K S',
  'Abel S Mathew',
  'Saniya K Shibu',
  'Sebin Mathew',
  'Anjitha Aravind',
  'Abhirami P',
  'Devadarsana R',
];

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.getElementById('execom')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1200);

const state = await page.evaluate(() => {
  const root = document.querySelector('.execom-swiper');
  if (!root) return { ok: false };
  root.__carouselEngine__?.stopAutoplay();
  return { ok: true, mode: root.getAttribute('data-carousel-mode') };
});
if (!state.ok) throw new Error('desktop carousel not found');

const total = NAMES.length;
const files = [];
for (let i = 0; i < total; i += 1) {
  await page.evaluate(
    ({ index, total: t }) => {
      const root = document.querySelector('.execom-swiper');
      root.__carouselEngine__.slideTo(t + index, 0);
    },
    { index: i, total },
  );
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    const img = document.querySelector(
      '.execom-swiper [data-slide-center] img:not([aria-hidden="true"])',
    );
    return img?.complete ? null : img?.decode?.().catch(() => {});
  });
  await page.waitForTimeout(250);
  const card = page.locator('.execom-swiper [data-slide-center] .container-execom').first();
  const alt = await page.evaluate(
    () =>
      document.querySelector('.execom-swiper [data-slide-center] img:not([aria-hidden="true"])')
        ?.alt,
  );
  const slug = (alt || `slot-${i}`)
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
  const file = `${OUT}/card-${i}-${slug}.png`;
  await card.screenshot({ path: file });
  files.push(file);
}

// Row sheets: 6 + 5, downscaled enough to stay readable but small enough to load.
const sheet = async (slice, name) => {
  const metas = await Promise.all(slice.map((f) => sharp(f).metadata()));
  const targetH = 380;
  const widths = metas.map((m) => Math.round((m.width * targetH) / m.height));
  const totalW = widths.reduce((a, b) => a + b, 0) + 8 * (slice.length - 1);
  const composites = [];
  let x = 0;
  for (let i = 0; i < slice.length; i += 1) {
    composites.push({
      input: await sharp(slice[i]).resize({ height: targetH }).toBuffer(),
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

await sheet(files.slice(0, 6), 'test-results/frames-sheet-a.png');
await sheet(files.slice(6), 'test-results/frames-sheet-b.png');

await browser.close();
console.log('captured', files.length, 'cards');
