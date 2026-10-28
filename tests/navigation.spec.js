import { test, expect } from '@playwright/test';
import { waitForLoaderGone } from './helpers';

test.describe('Cross-route navigation', () => {
  // The desktop navbar (anchor links + logo) is replaced by a hamburger menu
  // on mobile, so cross-route navigation via the navbar is desktop-only.
  test.skip(({ isMobile }) => isMobile, 'desktop navbar is replaced by the mobile menu');

  test('clicking Home from /contact navigates home', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    const link = page.locator('#nav-items a[href="/#home"]');
    await expect(link).toBeVisible();
    await Promise.all([page.waitForURL('**/', { timeout: 10000 }), link.click()]);
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
    await page.getByRole('button', { name: 'FOCES home' }).click();
    await page.waitForURL('**/');
    await expect(page.locator('#home')).toBeVisible();
  });

  test('navbar logo can return home from the keyboard', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    const logo = page.getByRole('button', { name: 'FOCES home' });
    await logo.focus();
    await Promise.all([page.waitForURL('**/'), page.keyboard.press('Enter')]);
    await expect(page.locator('#home')).toBeVisible();
  });
});
