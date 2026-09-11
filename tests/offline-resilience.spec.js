import { test, expect } from '@playwright/test';

// Offline resilience: already-downloaded content must survive losing the
// connection. Regression test for the blank-page bug where an offline lazy
// chunk failure (footer/sections/routes) climbed to the root error boundary
// and unmounted the entire app behind "Something went wrong".
//
// Each test gets a fresh browser context (no service worker yet), so the
// online leg installs the SW + precache and populates the runtime chunk
// caches — mirroring a real returning visitor — before the offline leg.
//
// NOTE: every interaction here is locator-based (never a long-lived
// page.evaluate scroll loop). SW install/claim cycles invalidate the JS
// execution context mid-flight, which makes one-shot evaluates flake;
// locator actions re-resolve the live context and only fail on real breakage.
// The SW only controls pages from the navigation after its install
// finishes — under parallel-worker load that install can lag well behind
// React's first paint, so wait for each lifecycle beat explicitly instead of
// assuming one reload is enough. A timeout here fails loudly (real problem),
// never silently.
async function waitForServiceWorkerControl(page) {
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return true;
          const regs = await navigator.serviceWorker.getRegistrations();
          return regs.some((r) => !!r.active);
        }),
      { timeout: 30000 },
    )
    .toBe(true);
  await page.reload({ waitUntil: 'load' });
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          'serviceWorker' in navigator ? !!navigator.serviceWorker.controller : true,
        ),
      { timeout: 30000 },
    )
    .toBe(true);
}

async function scrollThroughSections(page) {
  for (const id of ['#about', '#featuring', '#events', '#execom']) {
    await page.locator(id).scrollIntoViewIfNeeded();
  }
  await page.locator('footer').scrollIntoViewIfNeeded();
}

test('downloaded home content survives an offline reload', async ({ page, context }) => {
  await page.goto('/', { waitUntil: 'load' });
  // Settle the "returning visitor" state: SW installed + controlling, lazy
  // chunks + images fetched into the runtime caches.
  await waitForServiceWorkerControl(page);
  await scrollThroughSections(page);
  await expect(page.locator('footer')).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });
  await scrollThroughSections(page);

  // The page stands: hero + footer render from cache, no island fallback and
  // no full-page error fallback anywhere.
  await expect(page.locator('#home')).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);

  await context.setOffline(false);
});

test('visited /events route renders offline from the runtime chunk cache', async ({
  page,
  context,
}) => {
  await page.goto('/events', { waitUntil: 'load' });
  await waitForServiceWorkerControl(page);
  await expect(page.locator('main img').first()).toBeVisible();

  await context.setOffline(true);
  await page.reload({ waitUntil: 'load' });

  await expect(page.locator('main img').first()).toBeVisible();
  await expect(page.getByText('Something went wrong')).toHaveCount(0);

  await context.setOffline(false);
});
