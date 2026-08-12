import { test, expect } from '@playwright/test';
import { waitForLoaderGone } from './helpers';

test.describe('Navbar', () => {
  test('desktop renders the inline nav links', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navbar only');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await expect(page.locator('#nav-items a')).toHaveCount(6);
  });

  test('mobile hamburger opens the overlay, locks scroll, Escape closes and refocuses the toggle', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'mobile menu only');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);

    const toggle = page.locator('#nav-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();

    const overlay = page.locator('#nav-items-mobile');
    await expect(overlay).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    // Body scroll is locked while the full-screen overlay is open.
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    // Focus moves into the overlay (the close button) on open.
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('nav-close');

    // Escape closes the menu and returns focus to the hamburger.
    await page.keyboard.press('Escape');
    await expect(overlay).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('nav-toggle');
  });
});
