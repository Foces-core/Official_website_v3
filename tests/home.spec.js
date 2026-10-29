import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

test.describe('Home page structure', () => {
  test('all sections render in order', async ({ page }) => {
    await gotoHome(page);
    for (const id of ['home', 'about', 'featuring', 'events', 'execom']) {
      await expect(page.locator(`#${id}`).first()).toBeVisible();
    }
    await expect(page.locator('footer')).toBeVisible();
  });

  test('hero CTA assets load', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero img').first()).toBeVisible();
  });
});

test.describe('Entry curtain', () => {
  test('shows on load and parts on Enter', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const curtain = page.locator('.site-curtain');
    await expect(curtain).toBeVisible();
    await expect(curtain.locator('.site-curtain-hint')).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(curtain).toHaveClass(/site-curtain-open/);
    await expect(curtain).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('#main-content')).toBeVisible();
  });

  test('opens on a pointer click without swallowing it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.site-curtain')).toBeVisible();

    await page.mouse.click(640, 360);

    await expect(page.locator('.site-curtain')).toHaveCount(0, { timeout: 5000 });
  });

  test('still opens instantly under reduced motion', async ({ page }) => {
    await page.goto('/?motion=off', { waitUntil: 'domcontentloaded' });
    const curtain = page.locator('.site-curtain');
    await expect(curtain).toBeVisible();

    await page.keyboard.press('Enter');

    const duration = await page
      .locator('.site-curtain-panel')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(duration).toBe('0s');
    await expect(curtain).toHaveCount(0, { timeout: 5000 });
  });
});

test.describe('Cube easter egg', () => {
  async function scrollToCube(page, route = '/') {
    if (route === '/') {
      await gotoHome(page);
    } else {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
    }
    await page.evaluate(() =>
      document.getElementById('about')?.scrollIntoView({ block: 'center' }),
    );
    // The cube section is scroll-gated: the chunk downloads only after this
    // scroll arms the gate. Wait for the real cube element, not a fixed
    // timeout - under suite load the download can outlive any constant.
    await page.locator('#boxDiv-about').waitFor({ state: 'attached' });
    // The keyboard-arbitration widget only claims arrows while the cube box
    // itself is on screen - minimal #about scroll can leave it below the fold.
    await page.evaluate(() =>
      document.getElementById('boxDiv-about')?.scrollIntoView({ block: 'center' }),
    );
    // Give the hook's effects one frame to register the keyboard widget.
    await page.waitForTimeout(100);
  }

  test('idle cube rests on a face between turns', async ({ page }) => {
    await scrollToCube(page);
    await page.waitForTimeout(1100);
    const rotation = await page.locator('#boxDiv-about').evaluate((cube) => {
      const angle = /rotateY\(([-\d.]+)deg\)/.exec(cube.style.transform)?.[1];
      return angle === undefined ? 0 : Number(angle);
    });

    expect(Number.isFinite(rotation)).toBe(true);
    expect(Math.abs(rotation / 90 - Math.round(rotation / 90))).toBeLessThan(0.001);
  });

  test('reduced motion keeps manual cube rotation animated and face-aligned', async ({ page }) => {
    await scrollToCube(page, '/?motion=off');
    const cube = page.locator('#boxDiv-about');

    const transitionDuration = await cube.evaluate((el) => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      return getComputedStyle(el).transitionDuration;
    });
    expect(transitionDuration).toBe('0.4s');
    await expect
      .poll(() =>
        cube.evaluate((el) => {
          const angle = Number(el.style.transform.match(/rotateY\((-?[\d.]+)deg\)/)?.[1] ?? 0);
          return angle % 90 === 0;
        }),
      )
      .toBe(true);

    await pressArrowRapidly(page, 'ArrowRight', 20);
    await expect(page.locator('.about-toast').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.about-particle')).toHaveCount(0);
  });

  // All presses dispatched SYNCHRONOUSLY inside the single evaluate — same
  // reasoning as dragCube below: each page.keyboard.press round-trip costs
  // ~tens of ms (more under full-suite CPU load), and the easter-egg tracker
  // resets its counter if a gap between spins exceeds its window (800ms
  // desktop / 1500ms touch), so per-press round-trips made the 20-spin burst
  // flaky under load. Same-ms presses are the truest form of "rapid".
  async function pressArrowRapidly(page, key, presses) {
    return page.evaluate(
      ({ keyName, count }) => {
        for (let i = 0; i < count; i += 1) {
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: keyName, bubbles: true, cancelable: true }),
          );
        }
      },
      { keyName: key, count: presses },
    );
  }

  test('rapid arrow spins fire the easter egg toast', async ({ page }) => {
    await scrollToCube(page);
    // The easier touch bar (8 spins) fires more than once in 20 presses
    // (bursts at 8 and 16) — assert on the first toast, not a strict single
    // match. The desktop bar (20 spins) fires exactly at the 20th press.
    await pressArrowRapidly(page, 'ArrowRight', 20);
    await expect(page.locator('.about-toast').first()).toBeVisible({ timeout: 15000 });
  });

  test('no consecutive duplicate toast messages', async ({ page }) => {
    await scrollToCube(page);

    // Toast creation is a background-priority task (scheduleBackgroundTask),
    // so under load the second toast can land AFTER the first expired
    // (TOAST_MS = 1700ms). Capturing every toast ADD as it happens — not the
    // live DOM at one instant — is immune to that scheduling jitter.
    await page.evaluate(() => {
      window.__toastTexts = [];
      const obs = new MutationObserver((muts) => {
        for (const m of muts) {
          for (const n of m.addedNodes) {
            if (n.nodeType === 1 && n.classList.contains('about-toast')) {
              window.__toastTexts.push(n.textContent);
            }
          }
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      window.__toastObs = obs;
    });

    await pressArrowRapidly(page, 'ArrowRight', 20);
    await pressArrowRapidly(page, 'ArrowRight', 20);

    // Both bursts must fire (touch bar fires 2x per burst; desktop once at
    // the 20th press). The collected ADD order IS the fire order.
    await expect
      .poll(async () => page.evaluate(() => window.__toastTexts.length))
      .toBeGreaterThanOrEqual(2);

    // Assert the picker's real invariant directly: consecutive fires never
    // repeat, so no two ADJACENT toasts may be equal. Comparing "last toast
    // of burst 1 vs first new toast of burst 2" instead is flaky: on the
    // touch bar (target 8) a 20-press burst fires twice (at 8 and 16), and
    // wind-down inertia keeps registering spins after the burst ends (within
    // the 1500ms gap), so bursts blur together and the index math lands on a
    // stale toast. Adjacent-pair checking over the whole ADD log is immune.
    const texts = (await page.evaluate(() => window.__toastTexts)).map((t) => t.trim());
    expect(texts.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < texts.length; i += 1) {
      expect(texts[i]).not.toBe(texts[i - 1]);
    }
  });
});

test.describe('Cube touch rotation', () => {
  async function scrollToCube(page) {
    await gotoHome(page);
    await page.evaluate(() =>
      document.getElementById('about')?.scrollIntoView({ block: 'center' }),
    );
    // The cube section is scroll-gated: the chunk downloads only after this
    // scroll arms the gate. Wait for the real cube element, not a fixed
    // timeout - under suite load the download can outlive any constant.
    await page.locator('#boxDiv-about').waitFor({ state: 'attached' });
    // The keyboard-arbitration widget only claims arrows while the cube box
    // itself is on screen - minimal #about scroll can leave it below the fold.
    await page.evaluate(() =>
      document.getElementById('boxDiv-about')?.scrollIntoView({ block: 'center' }),
    );
    // Give the hook's effects one frame to register the keyboard widget.
    await page.waitForTimeout(100);
  }

  // One synthetic touch drag across the cube (~150px at 0.6 sens = one 90°
  // spin). Returns whether the touchmove was defaultPrevented and the
  // computed touch-action, so the test can assert both scroll-prevention
  // mechanisms directly.
  //
  // drags > 1 dispatches several drags SYNCHRONOUSLY inside the single
  // evaluate. That keeps the "rapid" burst deterministic: each page.evaluate
  // round-trip costs ~tens of ms (more under full-suite CPU load), and the
  // easter-egg tracker resets the counter if a gap between spins exceeds its
  // 1.5s window — so per-drag round-trips made the 8-spin test flaky under
  // load. Same-ms drags are the truest form of "rapid".
  async function dragCube(page, deltaX = 150, drags = 1) {
    return page.evaluate(
      ({ deltaX: dx, drags: count }) => {
        const el = document.getElementById('boxDiv-about');
        const rect = el.getBoundingClientRect();
        const x0 = rect.left + rect.width / 2;
        const y0 = rect.top + rect.height / 2;
        const touch = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        let move;
        for (let i = 0; i < count; i += 1) {
          el.dispatchEvent(
            new TouchEvent('touchstart', {
              touches: [touch(x0, y0)],
              targetTouches: [touch(x0, y0)],
              changedTouches: [touch(x0, y0)],
              bubbles: true,
              cancelable: true,
            }),
          );
          move = new TouchEvent('touchmove', {
            touches: [touch(x0 - dx, y0)],
            targetTouches: [touch(x0 - dx, y0)],
            changedTouches: [touch(x0 - dx, y0)],
            bubbles: true,
            cancelable: true,
          });
          el.dispatchEvent(move);
          el.dispatchEvent(
            new TouchEvent('touchend', {
              touches: [],
              targetTouches: [],
              changedTouches: [touch(x0 - dx, y0)],
              bubbles: true,
              cancelable: true,
            }),
          );
        }
        return {
          prevented: move.defaultPrevented,
          touchAction: getComputedStyle(el).touchAction,
        };
      },
      { deltaX, drags },
    );
  }

  test('rotating the cube never scrolls the page (touch-action none + preventDefault)', async ({
    page,
  }) => {
    await scrollToCube(page);
    const result = await dragCube(page);
    expect(result.touchAction).toBe('none');
    expect(result.prevented).toBe(true);
  });

  test('a second finger mid-drag neither re-anchors nor ends the rotation', async ({ page }) => {
    // Regression guard for single-touch ownership in useCubeDrag: the drag
    // belongs to the touch that started it. All events dispatch
    // synchronously in one evaluate (same determinism reasoning as
    // dragCube) — rotation deltas are exact, immune to auto-spin drift.
    await scrollToCube(page);
    const rots = await page.evaluate(() => {
      const el = document.getElementById('boxDiv-about');
      const rect = el.getBoundingClientRect();
      const x0 = rect.left + rect.width / 2;
      const y0 = rect.top + rect.height / 2;
      const t = (id, x, y) => new Touch({ identifier: id, target: el, clientX: x, clientY: y });
      const fire = (type, touches, changed) =>
        el.dispatchEvent(
          new TouchEvent(type, {
            touches,
            targetTouches: touches,
            changedTouches: changed,
            bubbles: true,
            cancelable: true,
          }),
        );
      const rot = () => {
        const m = el.style.transform.match(/rotateY\((-?[\d.]+)deg\)/);
        return m ? parseFloat(m[1]) : null;
      };
      // Finger 1 drags right 60px: +36deg at 0.6 sens.
      fire('touchstart', [t(1, x0, y0)], [t(1, x0, y0)]);
      fire('touchmove', [t(1, x0 + 60, y0)], [t(1, x0 + 60, y0)]);
      const afterFirst = rot();
      // Finger 2 lands and drags left 60px: must be ignored, no jump.
      fire('touchstart', [t(1, x0 + 60, y0), t(2, x0 + 60, y0)], [t(2, x0 + 60, y0)]);
      fire('touchmove', [t(1, x0 + 60, y0), t(2, x0, y0)], [t(2, x0, y0)]);
      const afterSecond = rot();
      // Finger 2 lifts while finger 1 stays down: the drag continues.
      fire('touchend', [t(1, x0 + 60, y0)], [t(2, x0, y0)]);
      fire('touchmove', [t(1, x0 + 100, y0)], [t(1, x0 + 100, y0)]);
      const afterResume = rot();
      fire('touchend', [], [t(1, x0 + 100, y0)]);
      return { afterFirst, afterSecond, afterResume };
    });
    expect(rots.afterSecond).toBeCloseTo(rots.afterFirst, 5);
    expect(rots.afterResume - rots.afterFirst).toBeCloseTo(24, 0);
  });

  test('rapid touch drags fire the easter egg toast on phones (easier 8-spin bar)', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'the touch-eased bar only applies on coarse-pointer phones');
    await scrollToCube(page);
    // All 8 drags in one evaluate — synchronous burst, immune to round-trip
    // jitter under suite load (see dragCube).
    await dragCube(page, 150, 8);
    await expect(page.locator('.about-toast')).toBeVisible({ timeout: 15000 });
  });
});
