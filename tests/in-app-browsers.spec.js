import { test, expect } from '@playwright/test';
import { gotoHome } from './helpers';

// In-app browsers (WhatsApp/Instagram WebViews) are how most members will
// first open a shared link, and they are NOT plain mobile browsers:
// - Android in-app browsers are Chromium WebViews (UA carries the `wv` token)
//   with no beforeinstallprompt — the PWA install toast must never appear.
// - Instagram iOS renders the page in a WKWebView with the FBAN-style UA.
// These smoke tests emulate those UA/device profiles and assert the page
// renders, stays error-free, and never offers a PWA install inside an
// embedded browser.
const WHATSAPP_ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/116.0.0.0 Mobile Safari/537.36; wv WhatsApp/2.23.24.78';
const INSTAGRAM_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Mobile/15E148 Instagram 302.0.0.25.104 ' +
  '(iPhone14,3; iOS 17_0; en_US; en-US; scale=3.00; 1170x2532; 472015358)';

function collectPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectSmokeTest(page) {
  await gotoHome(page);
  await expect(page.locator('.hero img').first()).toBeVisible();
  // Navbar root is a fixed div (no <nav> element). It renders two FOCES
  // logos (desktop + mobile variants, one always `hidden`) — grab the visible
  // one as the stable handle.
  await expect(page.locator('img[alt="FOCES"]:visible').first()).toBeVisible();
  await page.locator('#about').scrollIntoViewIfNeeded();
  await expect(page.locator('#about').first()).toBeVisible();
  await expect(page.locator('footer')).toBeVisible();
}

test.describe('WhatsApp in-app browser (Android WebView)', () => {
  test.use({
    userAgent: WHATSAPP_ANDROID_UA,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });

  test('renders the site without JS errors or install prompt', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'in-app browser emulation runs once');
    const errors = collectPageErrors(page);
    await expectSmokeTest(page);
    // WebViews never fire beforeinstallprompt — the toast must stay absent.
    await expect(page.locator('.install-toast')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test.describe('Instagram in-app browser (iOS WKWebView)', () => {
  test.use({
    userAgent: INSTAGRAM_IOS_UA,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  });

  test('renders the site without JS errors or install prompt', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'in-app browser emulation runs once');
    const errors = collectPageErrors(page);
    await expectSmokeTest(page);
    await expect(page.locator('.install-toast')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});
