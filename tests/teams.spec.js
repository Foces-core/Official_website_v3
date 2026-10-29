import { test, expect } from '@playwright/test';

test.describe('Execom archive (/teams)', () => {
  test('opens from the execom section button and shows the latest group photo', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('#execom').scrollIntoViewIfNeeded();

    await page.getByRole('link', { name: 'Execom Archive' }).click();
    await expect(page).toHaveURL(/\/teams$/);
    await expect(page.locator('.teams-title')).toHaveText('Execom 2024–2025');
    await expect(page.locator('.teams-group-placeholder')).toBeVisible();
  });

  test('year strip switches the batch title', async ({ page }) => {
    await page.goto('/teams', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: '2017-18' }).click();
    await expect(page.locator('.teams-title')).toHaveText('Execom 2017–2018');

    await page.getByRole('button', { name: '2024-25' }).click();
    await expect(page.locator('.teams-title')).toHaveText('Execom 2024–2025');
  });
});
