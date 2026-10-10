// One-off: raw axe-core WCAG scan (same tags/impact policy as
// tests/accessibility.spec.js) using Playwright's locally installed Chromium.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const PW_DIR = fileURLToPath(
  new URL(
    '../../node_modules/.pnpm/@axe-core+playwright@4.13.0_playwright-core@1.64.0/node_modules/',
    import.meta.url,
  ),
);
const require = createRequire(import.meta.url);
const AxeBuilder = require(PW_DIR + '@axe-core/playwright');
const { chromium } = require(PW_DIR + 'playwright-core');

const BASE = 'http://127.0.0.1:5174';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const EXE = process.env.CHROME_PATH;

async function main() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-component-update',
    ],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  let anyBlocking = 0;
  for (const route of ['/', '/events', '/contact']) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const blocking = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    console.log(`\n=== ${route} ===`);
    console.log(
      `violations: ${results.violations.length} total, ${blocking.length} serious/critical`,
    );
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nodes)`);
    }
    anyBlocking += blocking.length;
  }
  console.log(
    anyBlocking === 0
      ? '\nALL ROUTES CLEAN (no serious/critical WCAG violations)'
      : `\n${anyBlocking} serious/critical violations`,
  );
  await browser.close();
  process.exit(anyBlocking === 0 ? 0 : 1);
}

main();
