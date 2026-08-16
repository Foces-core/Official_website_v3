import { test, expect } from '@playwright/test';

test.describe('Contact', () => {
  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.locator('form')).toBeVisible();
    expect(await page.locator('form input, form textarea').count()).toBeGreaterThan(0);
  });

  test('form inputs have white background', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    const inputs = page.locator('form input:visible, form textarea:visible');
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

test.describe('Contact form validation', () => {
  const fillValid = async (page) => {
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#subject', 'Hello');
    await page.fill('#message', 'Hi there');
  };

  test('empty submit shows a validation toast', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Please fill in all fields.')).toBeVisible({ timeout: 4000 });
  });

  test('malformed email shows a validation toast', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await fillValid(page);
    await page.fill('#email', 'not-an-email');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible({
      timeout: 4000,
    });
  });

  test('valid form without EmailJS keys falls back to the mail app', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await fillValid(page);
    await page.locator('button[type="submit"]').click();
    // No VITE_EMAILJS_* env vars in the test environment, so the mailto
    // fallback toast is what a successful submission shows.
    await expect(page.getByText(/Opening your email app to send message/)).toBeVisible({
      timeout: 5000,
    });
  });

  test('keyboard Enter submits the form instead of moving focus', async ({ page }) => {
    // Regression: handleKeyDown used to preventDefault() Enter in every
    // single-line input to advance focus — which also blocked native form
    // submission, so a keyboard user could never submit with Enter.
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await fillValid(page);
    await page.focus('#name');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/Opening your email app to send message/)).toBeVisible({
      timeout: 5000,
    });
  });
});
