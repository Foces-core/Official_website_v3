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

  test('fixed bar layers above page content', async ({ page }) => {
    // Regression: the bar used to sit at z-10, below page layers (carousel
    // arrows z-20, toast pills z-40), and only won by stacking-context luck.
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    const z = await page
      .locator('.nav-w.fixed, .nav-b.fixed')
      .first()
      .evaluate((el) => getComputedStyle(el).zIndex);
    expect(Number(z)).toBeGreaterThanOrEqual(50);
  });

  test('mobile overlay layers above the fixed bar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu only');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await page.locator('#nav-toggle').click();
    const overlay = page.locator('#nav-items-mobile');
    await expect(overlay).toBeVisible();
    const [barZ, overlayZ] = await page.evaluate(() => {
      const bar = document.querySelector('.nav-w.fixed, .nav-b.fixed');
      const menu = document.getElementById('nav-items-mobile');
      return [getComputedStyle(bar).zIndex, getComputedStyle(menu).zIndex];
    });
    expect(Number(overlayZ)).toBeGreaterThan(Number(barZ));
  });
});
