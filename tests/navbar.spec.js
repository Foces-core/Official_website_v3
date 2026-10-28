import { test, expect } from '@playwright/test';
import { waitForLoaderGone } from './helpers';

test.describe('Navbar', () => {
  test('desktop renders the inline nav links', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navbar only');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await expect(page.locator('#nav-items a')).toHaveCount(6);
  });

  test('events and contact show distinct route-specific links', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop navbar only');
    await page.goto('/events', { waitUntil: 'networkidle' });
    await expect(page.locator('#nav-items a')).toHaveCount(3);
    await expect(page.locator('#nav-items a[href="/#about"]')).toHaveCount(0);
    await expect(page.locator('#nav-items a[href="/#execom"]')).toHaveCount(0);
    await expect(page.locator('#nav-items a[href="/events"]')).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect(page.getByText('EVENTS', { exact: true }).first()).toBeVisible();

    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.locator('#nav-items a')).toHaveCount(2);
    await expect(page.locator('#nav-items a[href="/#execom"]')).toHaveCount(0);
    await expect(page.locator('#nav-items a[href="/events"]')).toHaveCount(0);
    await expect(page.locator('#nav-items a[href="/#about"]')).toHaveCount(0);
  });

  test('mobile route-specific drawer keeps one keyboard tab stop', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile navbar only');
    await page.goto('/contact', { waitUntil: 'domcontentloaded' });
    await page.locator('#nav-toggle').click();
    await expect(page.locator('#nav-items-mobile a')).toHaveCount(2);
    await expect(page.locator('#nav-items-mobile a[tabindex="0"]')).toHaveCount(1);
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

  test('mobile menu Tab key cycles through tabbable items only', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile menu only');
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await page.locator('#nav-toggle').click();

    await expect(page.locator('#nav-close')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nav-items-mobile a[tabindex="0"]')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#nav-close')).toBeFocused();
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
