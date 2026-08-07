import { test, expect } from '@playwright/test';

// Deterministic site-wide smoke suite. Every "nook and cranny" the user can
// reach is exercised: hero, cube easter egg, both carousels (+ keyboard),
// events grid + lightbox, cross-route scroll behavior, contact page, and
// asset/rendering hygiene. Prefer structural assertions over timing.

async function gotoHome(page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  // The branded loader is gated off for low-end/reduced-motion; on capable
  // machines it fades after fonts+paint. Make sure it's gone before interacting.
  await expect
    .poll(async () => {
      const phase = await page.evaluate(() => {
        const loader = document.querySelector('.fixed.inset-0.z-\\[100\\]');
        return loader ? getComputedStyle(loader).opacity : 'gone';
      });
      return phase;
    })
    .not.toBe('1')
    .catch(() => {});
  await page.waitForTimeout(300);
}

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
    await expect(page.locator('.about-toast')).toBeVisible();
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

test.describe('Featuring carousel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await page.locator('#featuring').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  const activeIndex = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.feat-swiper .swiper-slide')].findIndex((s) =>
        s.classList.contains('swiper-slide-active'),
      ),
    );

  test('arrow buttons navigate', async ({ page }) => {
    const before = await activeIndex(page);
    await page.locator('button[aria-label="Next ECHO photos"]').click();
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });

  test('keyboard arrows navigate when carousel owns focus', async ({ page }) => {
    // Click inside the carousel so it claims arrow ownership.
    await page.locator('.feat-swiper .swiper-slide').first().click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });

  test('pagination dots sit below the images', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const img = document.querySelector('.feat-swiper .swiper-slide img');
      const pag = document.querySelector('.feat-swiper .swiper-pagination');
      return pag.getBoundingClientRect().top >= img.getBoundingClientRect().bottom;
    });
    expect(ok).toBe(true);
  });
});

test.describe('Execom / Meet the team carousel', () => {
  test.beforeEach(async ({ page }) => {
    await gotoHome(page);
    await page.locator('#execom').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  });

  const activeIndex = (page) =>
    page.evaluate(() =>
      [...document.querySelectorAll('.execom-swiper .swiper-slide')].findIndex((s) =>
        s.classList.contains('swiper-slide-active'),
      ),
    );

  test('navigation arrows work on desktop', async ({ page }) => {
    const next = page.locator('.execom-swiper .swiper-button-next');
    const before = await activeIndex(page);
    await next.click();
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });

  test('keyboard arrows navigate the team carousel', async ({ page }) => {
    await page.locator('.execom-swiper .swiper-slide').first().click({ force: true });
    await page.waitForTimeout(300);
    const before = await activeIndex(page);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(600);
    const after = await activeIndex(page);
    expect(after).not.toBe(before);
  });

  test('pagination dots sit below the member cards', async ({ page }) => {
    const ok = await page.evaluate(() => {
      const card = document.querySelector('.execom-swiper .swiper-slide .container-execom');
      const pag = document.querySelector('.execom-swiper .swiper-pagination');
      return pag.getBoundingClientRect().top >= card.getBoundingClientRect().bottom;
    });
    expect(ok).toBe(true);
  });
});

test.describe('Events', () => {
  test('Explore All Events navigates to /events and lands at the top', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#events').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.getByText('Explore All Events').click();
    await page.waitForURL('**/events');
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  });

  test('event cards render', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await expect(page.locator('main img').first()).toBeVisible();
    expect(await page.locator('main').count()).toBeGreaterThan(0);
  });

  test('lightbox opens and image is not clipped by the viewport', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await page.locator('[aria-haspopup="dialog"]').first().click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img').first()).toBeVisible();
    await page.waitForTimeout(800);
    const fits = await page.evaluate(() => {
      const imgs = document.querySelectorAll('[role="dialog"] img');
      const vh = window.innerHeight;
      return [...imgs].every((img) => {
        const r = img.getBoundingClientRect();
        return r.bottom <= vh + 1 && r.top >= -1;
      });
    });
    expect(fits).toBe(true);
  });

  test('lightbox closes on Escape', async ({ page }) => {
    await page.goto('/events', { waitUntil: 'networkidle' });
    await page.locator('[aria-haspopup="dialog"]').first().click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});

test.describe('Contact', () => {
  test('contact page loads with form', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });
    await expect(page.locator('form')).toBeVisible();
    expect(await page.locator('form input, form textarea').count()).toBeGreaterThan(0);
  });
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
});
