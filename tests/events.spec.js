import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

test.describe('Events', () => {
  test('Explore All Events navigates to /events and lands at the top', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.getByText('Explore All Events').click();
    await page.waitForURL('**/events');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  });

  test('event cards render', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await expect(page.locator('main img').first()).toBeVisible();
    expect(await page.locator('main').count()).toBeGreaterThan(0);
  });

  test('lightbox opens and image is not clipped by the viewport', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await page.locator('[aria-haspopup="dialog"]').first().click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img').first()).toBeVisible();
    await page.waitForTimeout(800);
    const fits = await page.evaluate(() => {
      const imgs = document.querySelectorAll('[role="dialog"] img');
      const vh = window.innerHeight;
      return [...imgs].every((img) => {
        const r = img.getBoundingClientRect();
        return r.bottom <= vh + 1 && r.top >= -1;
      });
    });
    expect(fits).toBe(true);
  });

  test('lightbox closes on Escape', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await page.locator('[aria-haspopup="dialog"]').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
