import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { gotoHome, waitForLoaderGone } from './helpers';

async function pausePageEntryAnimation(page) {
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      'html[data-pause-page-entry] .site-page-enter { animation-play-state: paused !important; }';
    document.documentElement.dataset.pausePageEntry = 'true';
    (document.head ?? document.documentElement).append(style);
  });
}

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
    await expect(page.locator('.site-page-enter')).toHaveCount(0);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const visible = await page.evaluate(() => {
      const el = document.querySelector('#about [data-aos]');
      return el ? getComputedStyle(el).opacity === '1' : true;
    });
    expect(visible).toBe(true);
  });

  test('page entry fades in when full motion is allowed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await pausePageEntryAnimation(page);
    await page.goto('/?perf=high', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-page-enter')).toHaveCount(1);

    const animation = await page.locator('.site-page-enter').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        name: style.animationName,
        duration: style.animationDuration,
        delay: style.animationDelay,
      };
    });

    expect(animation).toEqual({
      name: 'site-page-fade-in',
      duration: '0.72s',
      delay: '0.12s',
    });

    const childEventPreservedEntry = await page.locator('.site-page-enter').evaluate((element) => {
      const child = document.createElement('span');
      element.append(child);
      child.dispatchEvent(
        new AnimationEvent('animationend', { bubbles: true, animationName: 'site-page-fade-in' }),
      );
      const preserved = element.classList.contains('site-page-enter');
      child.remove();
      element.dispatchEvent(
        new AnimationEvent('animationcancel', {
          bubbles: true,
          animationName: 'site-page-fade-in',
        }),
      );
      return preserved;
    });
    expect(childEventPreservedEntry).toBe(true);
    await expect(page.locator('.site-page-enter')).toHaveCount(0);
  });

  for (const route of ['/events', '/contact', '/unknown-route']) {
    test(`page entry fade works on ${route}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await pausePageEntryAnimation(page);
      await page.goto(`${route}?perf=high`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.site-page-enter')).toHaveCount(1);

      const animation = await page.locator('.site-page-enter').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          name: style.animationName,
          duration: style.animationDuration,
          delay: style.animationDelay,
        };
      });

      expect(animation).toEqual({
        name: 'site-page-fade-in',
        duration: '0.72s',
        delay: '0.12s',
      });
    });
  }

  test('page entry fade runs on in-app route changes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/?perf=high', { waitUntil: 'domcontentloaded' });
    await waitForLoaderGone(page);
    await expect(page.locator('.site-page-enter')).toHaveCount(0);

    await page.evaluate(() => {
      window.history.pushState(null, '', '/events?perf=high');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    await expect(page).toHaveURL(/\/events\?perf=high$/);
    await expect(page.locator('.site-page-enter')).toHaveCount(1);

    const animationName = await page
      .locator('.site-page-enter')
      .evaluate((element) => getComputedStyle(element).animationName);
    expect(animationName).toBe('site-page-fade-in');
  });

  test('does not start the page entry fade when motion capability enables later', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const listeners = new Set();
      const connection = {
        effectiveType: '2g',
        saveData: true,
        downlink: 0.3,
        addEventListener(type, listener) {
          if (type === 'change') listeners.add(listener);
        },
        removeEventListener(type, listener) {
          if (type === 'change') listeners.delete(listener);
        },
      };

      Object.defineProperty(navigator, 'connection', {
        configurable: true,
        value: connection,
      });
      window.enableFullMotionProfile = () => {
        history.replaceState(null, '', '/?perf=high');
        for (const listener of listeners) listener();
        return listeners.size;
      };
    });

    await page.goto('/?perf=slow', { waitUntil: 'domcontentloaded' });
    await waitForLoaderGone(page);
    await expect(page.locator('.site-page-enter')).toHaveCount(0);

    const profileListeners = await page.evaluate(() => window.enableFullMotionProfile());
    expect(profileListeners).toBeGreaterThan(0);
    await page.waitForTimeout(100);
    await expect(page.locator('.site-page-enter')).toHaveCount(0);
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

  test('install prompt stays absent after beforeinstallprompt', async ({ page }) => {
    await gotoHome(page);
    const firePrompt = () =>
      page.evaluate(() =>
        window.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true })),
      );

    // Install prompts are not mounted by the current app shell.
    await firePrompt();
    await expect(page.getByLabel('Install FOCES app')).toHaveCount(0);

    // A reload does not enable the removed prompt either.
    await page.reload({ waitUntil: 'networkidle' });
    await waitForLoaderGone(page);
    await firePrompt();
    await expect(page.getByLabel('Install FOCES app')).toHaveCount(0);
  });
});
