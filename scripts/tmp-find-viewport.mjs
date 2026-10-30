// Temporary visual QA: finds the viewport width that produces the reference
// 314x380 team card, and reports crop slack at each candidate width.
import { chromium } from '@playwright/test';

const widths = [1440, 1512, 1600, 1728, 1920, 1366, 1280];
const browser = await chromium.launch({ args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5199/', {
  waitUntil: 'networkidle',
});
await page.evaluate(() => document.getElementById('execom')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1200);

for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const root = document.querySelector('.execom-swiper');
    root.__carouselEngine__?.stopAutoplay();
    const img = [
      ...document.querySelectorAll('.execom-swiper img[alt="Aleetta Mariya Sebastian"]'),
    ].find((i) => i.getBoundingClientRect().width > 0);
    if (!img) return null;
    const box = img.getBoundingClientRect();
    const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const slack = Math.round(img.naturalHeight * scale - box.height);
    return {
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      aspect: (box.width / box.height).toFixed(3),
      slack,
    };
  });
  console.log(String(w).padStart(5), JSON.stringify(info));
}
await browser.close();
