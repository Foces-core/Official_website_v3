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

test.describe('Cube easter egg', () => {
  async function scrollToCube(page) {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
  }

  test('rapid arrow spins fire the easter egg toast', async ({ page }) => {
    await scrollToCube(page);
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    // The easier touch bar fires more than once in 20 presses (bursts at 10
    // and 20) — assert on the first toast, not a strict single match.
    await expect(page.locator('.about-toast').first()).toBeVisible();
  });

  test('no consecutive duplicate toast messages', async ({ page }) => {
    await scrollToCube(page);
    const readToast = async () => {
      const last = page.locator('.about-toast').last();
      await expect(last).toBeVisible();
      return (await last.textContent()).trim();
    };
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    const first = await readToast();
    for (let i = 0; i < 20; i += 1) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(40);
    }
    const second = await readToast();
    expect(second).not.toBe(first);
  });
});

test.describe('Cube touch rotation', () => {
  async function scrollToCube(page) {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
  }

  // One synthetic touch drag across the cube (~150px at 0.6 sens = one 90°
  // spin). Returns whether the touchmove was defaultPrevented and the
  // computed touch-action, so the test can assert both scroll-prevention
  // mechanisms directly.
  async function dragCube(page, deltaX = 150) {
    return page.evaluate(
      ({ deltaX: dx }) => {
        const el = document.getElementById('boxDiv-about');
        const rect = el.getBoundingClientRect();
        const x0 = rect.left + rect.width / 2;
        const y0 = rect.top + rect.height / 2;
        const touch = (x, y) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        el.dispatchEvent(
          new TouchEvent('touchstart', {
            touches: [touch(x0, y0)],
            targetTouches: [touch(x0, y0)],
            changedTouches: [touch(x0, y0)],
            bubbles: true,
            cancelable: true,
          }),
        );
        const move = new TouchEvent('touchmove', {
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
        return {
          prevented: move.defaultPrevented,
          touchAction: getComputedStyle(el).touchAction,
        };
      },
      { deltaX },
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

  test('rapid touch drags fire the easter egg toast on phones (easier 8-spin bar)', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'the touch-eased bar only applies on coarse-pointer phones');
    await scrollToCube(page);
    for (let i = 0; i < 8; i += 1) {
      await dragCube(page);
    }
    await expect(page.locator('.about-toast')).toBeVisible();
  });
});
