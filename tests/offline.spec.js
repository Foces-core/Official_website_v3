import { test, expect } from '@playwright/test';

// Global offline indicator: notify ONLY while offline, never interrupt when
// everything works. Playwright's context.setOffline drives the same
// online/offline events a real connection drop fires.
test('offline toast appears while offline and clears silently on reconnect', async ({
  page,
  context,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const toast = page.getByRole('status', { name: 'Offline notice' });

  // Online: nothing shown, nothing announced.
  await expect(toast).toHaveCount(0);

  await context.setOffline(true);
  await expect(toast).toBeVisible();
  await expect(toast).toContainText('offline');

  // Reconnect: the pill goes away with no "back online" fanfare.
  await context.setOffline(false);
  await expect(toast).toHaveCount(0);
});

test('offline toast can be dismissed and stays dismissed while offline', async ({
  page,
  context,
}) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const toast = page.getByRole('status', { name: 'Offline notice' });

  await context.setOffline(true);
  await expect(toast).toBeVisible();
  await toast.getByRole('button', { name: 'Dismiss offline notice' }).click();
  await expect(toast).toHaveCount(0);

  await context.setOffline(false);
});
