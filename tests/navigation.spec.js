import { test, expect } from '@playwright/test';
import { waitForLoaderGone } from './helpers';

test.describe('Cross-route navigation', () => {
  // The desktop navbar (anchor links + logo) is replaced by a hamburger menu
  // on mobile, so cross-route navigation via the navbar is desktop-only.
  test.skip(({ isMobile }) => isMobile, 'desktop navbar is replaced by the mobile menu');

  test('clicking Execom from /contact navigates home and scrolls to execom section', async ({
    page,
  }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    // Verify the link exists and what href it has
    const link = page.locator('a[href="/#execom"]');
    await expect(link).toBeVisible();
    // Click and wait for navigation
    await Promise.all([page.waitForURL('**/', { timeout: 10000 }), link.click()]);
    // Poll instead of sleeping: the lazy Execom section mounts asynchronously
    // and the smooth scroll lands after that.
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 15000 })
      .toBeGreaterThan(0);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.getElementById('execom');
            return el ? el.getBoundingClientRect().top : Infinity;
          }),
        { timeout: 15000 },
      )
      .toBeLessThan(1000);
  });

  test('clicking About from /events navigates home and scrolls to about section', async ({
    page,
  }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await page.locator('a[href="/#about"]').click();
    await page.waitForURL('**/');
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const el = document.getElementById('about');
            return el ? el.getBoundingClientRect().top : Infinity;
          }),
        { timeout: 15000 },
      )
      .toBeLessThan(800);
  });

  test('clicking Contact from /events navigates to /contact', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await page.locator('a[href="/contact"]').first().click();
    await page.waitForURL('**/contact');
    await expect(page.locator('form')).toBeVisible();
  });

  test('logo click from /contact returns to home', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    // The navbar logo is the only clickable FOCES wordmark. The static hero
    // LCP placeholder (#hero-lcp-static) also renders img[alt="FOCES"] and
    // comes FIRST in the DOM — but it is pointer-events: none, so a plain
    // `.first()` click would be permanently intercepted. Scope to the
    // cursor-pointer navbar logo instead.
    await page.locator('img[alt="FOCES"].cursor-pointer:visible').first().click();
    await page.waitForURL('**/');
    await expect(page.locator('#home')).toBeVisible();
  });
});
