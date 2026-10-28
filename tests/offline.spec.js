import { test, expect } from '@playwright/test';

// The app shell no longer mounts an offline toast. Playwright's context.setOffline
// still exercises the browser events so the disabled indicator stays absent.
test('offline toast stays absent while offline and after reconnect', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const toast = page.getByRole('status', { name: 'Offline notice' });

  // Nothing shown while online.
  await expect(toast).toHaveCount(0);

  await context.setOffline(true);
  await expect(toast).toHaveCount(0);

  await context.setOffline(false);
  await expect(toast).toHaveCount(0);
});

test('offline toast stays absent after an offline transition', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const toast = page.getByRole('status', { name: 'Offline notice' });

  await context.setOffline(true);
  await expect(toast).toHaveCount(0);

  await context.setOffline(false);
});
