import { test, expect } from '@playwright/test';

// ScrollGate chunk-deferral check: AboutUs/Events/Featuring/Execom chunks must
// NOT load at boot, must appear after scrolling near them.
test('scroll-gate defers section chunks', async ({ page }) => {
  const loaded = () =>
    page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((r) => r.name)
        .filter((n) => n.includes('/assets/')),
    );
  await page.goto('/', { waitUntil: 'networkidle' });

  const boot = await loaded();
  const hasChunk = (arr, key) => arr.some((n) => n.toLowerCase().includes(key));
  // Landing *section* chunk is capitalized ("Events-<hash>.js"); the shared
  // data module ("events-<hash>.js") also ships to the /events ROUTE, whose
  // idle prefetch is by design — only flag the capital-E section chunk.
  const hasSectionChunk = (arr, name) => arr.some((n) => n.includes(name));
  // Debug: dump AboutUs resource entries with initiator when assertion will fail
  if (hasChunk(boot, 'aboutus')) {
    const dbg = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .filter((r) => r.name.toLowerCase().includes('aboutus'))
        .map((r) => ({
          name: r.name.split('/').pop(),
          init: r.initiatorType,
          start: Math.round(r.startTime),
        })),
    );
    console.log('ABOUTUS ENTRIES:', JSON.stringify(dbg));
    const gate = await page.evaluate(() => {
      const el = document.getElementById('about');
      return {
        mountedChildren: el ? el.children.length : -1,
        top: el ? Math.round(el.getBoundingClientRect().top) : null,
      };
    });
    console.log('GATE STATE:', JSON.stringify(gate));
  }
  // Nothing section-specific should be eagerly fetched (AboutUs/Events chunks,
  // carousel engine, cube physics, three/vanta).
  expect(hasChunk(boot, 'aboutus'), 'AboutUs chunk eager-loaded').toBeFalsy();
  expect(hasSectionChunk(boot, '/Events-'), 'Events section chunk eager-loaded').toBeFalsy();
  expect(hasChunk(boot, 'execom'), 'Execom chunk eager-loaded').toBeFalsy();
  expect(hasChunk(boot, 'featuring'), 'Featuring chunk eager-loaded').toBeFalsy();

  await page.locator('#featuring').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const afterScroll = await loaded();
  expect(hasChunk(afterScroll, 'featuring'), 'Featuring chunk never loaded on scroll').toBeTruthy();

  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  expect(hasChunk(await loaded(), 'aboutus'), 'AboutUs chunk never loaded on scroll').toBeTruthy();
});

// Toast behavior with a real beforeinstallprompt dispatch.
test('install toast shows once per session', async ({ page }) => {
  await page.addInitScript(() => {
    window.__fireBip = () =>
      window.dispatchEvent(
        Object.assign(new Event('beforeinstallprompt'), {
          prompt: async () => {},
          userChoice: Promise.resolve({ outcome: 'dismissed' }),
        }),
      );
  });
  await page.goto('/');
  await page.evaluate(() => window.__fireBip());
  await expect(page.getByRole('region', { name: 'Install FOCES app' })).toBeVisible();

  // Session cookie written on show
  const cookie = await page.evaluate(() => document.cookie);
  expect(cookie).toContain('foces-install-seen=1');

  // Reload → beforeinstallprompt fires again but toast must NOT nag
  await page.reload();
  await page.evaluate(() => window.__fireBip());
  await page.waitForTimeout(500);
  await expect(page.getByRole('region', { name: 'Install FOCES app' })).toHaveCount(0);
});
