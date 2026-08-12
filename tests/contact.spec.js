import { test, expect } from '@playwright/test';

test.describe('Contact', () => {
  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.locator('form')).toBeVisible();
    expect(await page.locator('form input, form textarea').count()).toBeGreaterThan(0);
  });

  test('form inputs have white background', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    const inputs = page.locator('form input, form textarea');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const bg = await inputs.nth(i).evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toBe('rgb(255, 255, 255)');
    }
  });

  test('all four social links are present', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.locator('a[href*="facebook.com"]').first()).toBeVisible();
    await expect(page.locator('a[href*="x.com"]').first()).toBeVisible();
    await expect(page.locator('a[href*="instagram.com"]').first()).toBeVisible();
    await expect(page.locator('a[href*="linkedin.com"]').first()).toBeVisible();
  });

  test('LinkedIn icon has explicit size', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    const linkedinIcon = page.locator('a[href*="linkedin.com"] svg').first();
    await expect(linkedinIcon).toBeVisible();
    const width = await linkedinIcon.evaluate(
      (el) => el.getAttribute('width') || el.getBoundingClientRect().width,
    );
    expect(Number(width)).toBeGreaterThan(0);
  });
});
