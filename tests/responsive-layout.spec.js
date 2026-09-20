import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'small phone', width: 320, height: 568 },
  { name: 'large phone', width: 500, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'desktop', width: 1440, height: 900 },
];

const routes = ['/', '/events', '/contact'];

test('routes fit the supported viewport range without horizontal overflow', async ({ browser }) => {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', viewport.width);
    }

    await context.close();
  }
});
