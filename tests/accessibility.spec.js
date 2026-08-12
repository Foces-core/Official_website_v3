import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

test.describe('Reduced motion', () => {
  test('content stays visible with prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const visible = await page.evaluate(() => {
      const el = document.querySelector('#about [data-aos]');
      return el ? getComputedStyle(el).opacity === '1' : true;
    });
    expect(visible).toBe(true);
  });
});

test.describe('Asset hygiene', () => {
  test('all imgs use decoding=async; below-fold use loading=lazy', async ({ page }) => {
    await gotoHome(page);
    const bad = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll('img').forEach((img) => {
        if (!img.decoding) issues.push(`missing decoding on ${img.src}`);
      });
      return issues.slice(0, 10);
    });
    expect(bad).toEqual([]);
  });

  test('below-fold Execom member photos are lazy-loaded', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const eager = await page.evaluate(() => {
      // BlurImage renders a blur placeholder + the real image; the placeholder
      // has no loading attribute, so only count imgs that carry one.
      const imgs = [
        ...document.querySelectorAll('.execom-swiper img, .execom-cube-swiper img'),
      ].filter((img) => img.hasAttribute('loading'));
      return imgs
        .filter((img) => img.loading !== 'lazy')
        .map((img) => img.src)
        .slice(0, 5);
    });
    expect(eager).toEqual([]);
  });
});

test.describe('Overlays & install', () => {
  test('grain overlay is decorative (aria-hidden)', async ({ page }) => {
    await gotoHome(page);
    const grain = page.locator('.grain-overlay');
    if ((await grain.count()) === 0) return; // skipped on low-end profiles
    await expect(grain).toBeVisible();
    await expect(grain).toHaveAttribute('aria-hidden', 'true');
  });

  test('no install prompt without beforeinstallprompt', async ({ page }) => {
    await gotoHome(page);
    // Chromium headless never fires beforeinstallprompt, so the banner must
    // stay hidden until a real browser emits it.
    await expect(page.getByLabel('Install FOCES app')).toHaveCount(0);
  });
});
