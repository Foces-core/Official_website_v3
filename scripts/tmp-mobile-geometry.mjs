// Temporary visual QA: reports mobile cube card geometry and crop math.
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--no-sandbox', '--mute-audio'] });
const page = await browser.newPage({
  viewport: { width: 375, height: 667 },
  isMobile: true,
  hasTouch: true,
});
await page.goto(process.env.CAPTURE_URL || 'http://127.0.0.1:5199/', {
  waitUntil: 'networkidle',
});
await page.evaluate(() => document.getElementById('execom')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(1500);
await page.evaluate(() => {
  document.querySelector('.execom-cube-swiper').__carouselEngine__?.stopAutoplay();
});

const out = [];
for (let i = 0; i < 11; i += 1) {
  await page.evaluate((i) => {
    document.querySelector('.execom-cube-swiper').__carouselEngine__.slideTo(11 + i, 0);
  }, i);
  await page.waitForTimeout(400);
  const row = await page.evaluate(() => {
    const slide = document.querySelector('.execom-cube-swiper [data-slide-active]');
    const img = slide?.querySelector('img:not([aria-hidden="true"])');
    if (!img) return null;
    const box = img.getBoundingClientRect();
    const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight);
    const renderedH = img.naturalHeight * scale;
    const slideStyle = getComputedStyle(slide);
    return {
      alt: img.alt,
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      nat: `${img.naturalWidth}x${img.naturalHeight}`,
      slackH: Math.round(renderedH - box.height),
      objectPosition: getComputedStyle(img).objectPosition,
      transform: slideStyle.transform === 'none' ? 'none' : slideStyle.transform.slice(0, 40),
      bg: getComputedStyle(slide.querySelector('.container-execom')).backgroundColor,
    };
  });
  out.push(row);
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
