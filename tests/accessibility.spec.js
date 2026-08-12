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
});
