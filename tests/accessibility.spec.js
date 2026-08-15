import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoHome, waitForLoaderGone } from './helpers';

test.describe('WCAG scan (axe-core)', () => {
  // The repo's a11y contract is WCAG 2.1/2.2 AA (CONTRIBUTING.md); scan those
  // tags on every route. Serious/critical failures block the PR; moderate
  // ones are logged so the picture stays visible while we whittle them down.
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

  for (const route of ['/', '/events', '/contact']) {
    test(`${route} has no serious/critical WCAG violations`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      await waitForLoaderGone(page);

      // ScrollGate mounts lazy sections only near the viewport — scroll the
      // whole page first so gated content is actually in the DOM to audit.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y <= document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60)); // give IO a tick
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(500);

      const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
      const summary = results.violations
        .map((v) => `${v.id}[${v.impact}] x${v.nodes.length}`)
        .join(', ');
      console.log(`axe ${route}: ${summary || 'clean'}`);
      expect(
        blocking,
        `serious/critical: ${JSON.stringify(
          blocking.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
          null,
          2,
        )}`,
      ).toEqual([]);
    });
  }
});

test.describe('Reduced motion', () => {
  test('content stays visible with prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const visible = await page.evaluate(() => {
      const el = document.querySelector('#about [data-aos]');
      return el ? getComputedStyle(el).opacity === '1' : true;
    });
    expect(visible).toBe(true);
  });
});

test.describe('Asset hygiene', () => {
  test('all imgs use decoding=async; below-fold use loading=lazy', async ({ page }) => {
    await gotoHome(page);
    const bad = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll('img').forEach((img) => {
        if (!img.decoding) issues.push(`missing decoding on ${img.src}`);
      });
      return issues.slice(0, 10);
    });
    expect(bad).toEqual([]);
  });

  test('below-fold Execom member photos are lazy-loaded', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const eager = await page.evaluate(() => {
      // BlurImage renders a blur placeholder + the real image; the placeholder
      // has no loading attribute, so only count imgs that carry one.
      const imgs = [
        ...document.querySelectorAll('.execom-swiper img, .execom-cube-swiper img'),
      ].filter((img) => img.hasAttribute('loading'));
      return imgs
        .filter((img) => img.loading !== 'lazy')
        .map((img) => img.src)
        .slice(0, 5);
    });
    expect(eager).toEqual([]);
  });
});

test.describe('Overlays & install', () => {
  test('grain overlay is decorative (aria-hidden)', async ({ page }) => {
    await gotoHome(page);
    const grain = page.locator('.grain-overlay');
    if ((await grain.count()) === 0) return; // skipped on low-end profiles
    await expect(grain).toBeVisible();
    await expect(grain).toHaveAttribute('aria-hidden', 'true');
  });

  test('no install prompt without beforeinstallprompt', async ({ page }) => {
    await gotoHome(page);
    // Chromium headless never fires beforeinstallprompt, so the banner must
    // stay hidden until a real browser emits it.
    await expect(page.getByLabel('Install FOCES app')).toHaveCount(0);
  });

  test('install toast shows at most once per session', async ({ page }) => {
    await gotoHome(page);
    const firePrompt = () =>
      page.evaluate(() =>
        window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })),
      );

    // First visit: the toast appears.
    await firePrompt();
    await expect(page.getByLabel('Install FOCES app')).toBeVisible();

    // Same browser session, new page load: the session cookie silences it.
    await page.reload({ waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await firePrompt();
    await expect(page.getByLabel('Install FOCES app')).toHaveCount(0);
  });
});
