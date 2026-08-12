import { test, expect } from '@playwright/test';
import { waitForLoaderGone } from './helpers';

test.describe('Boot splash & route loader', () => {
  test('inline boot splash is removed after first load', async ({ page }) => {
    await page.goto('/');
    await waitForLoaderGone(page);
    // The splash is faded and removed from the DOM (failsafe hides it even if
    // fonts/paint never resolve, so this must eventually be true).
    await expect
      .poll(() => page.evaluate(() => !document.getElementById('boot-splash')))
      .toBe(true);
  });

  test('Suspense fallback (Loader) shows while a lazy route chunk is delayed', async ({ page }) => {
    // Delay the /events route chunk so the Loader (Suspense fallback) is
    // visible long enough to assert on. The exact chunk filename is hashed,
    // so match any chunk that only the events route pulls in.
    await page.route('**/*Eventpage*.js', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/events');
    const loader = page.locator('[role="status"][aria-label="Loading content"]');
    await expect(loader).toBeVisible({ timeout: 4000 });
    // Once the chunk lands, the page renders and the loader unmounts.
    await expect(page.locator('#main-content')).toBeVisible({ timeout: 20000 });
  });
});
