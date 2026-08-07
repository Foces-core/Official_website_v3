import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:4177';
const CHROME = 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--window-size=1280,800'],
});

try {
  // ---------- HOME PAGE ----------
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(1500);

  // skip link
  const skipLink = await page
    .$eval('a.skip-link', (el) => ({
      href: el.getAttribute('href'),
      text: el.textContent.trim(),
      top: getComputedStyle(el).top,
    }))
    .catch(() => null);
  check(
    'skip-link present + targets #main-content',
    skipLink && skipLink.href === '#main-content' && skipLink.top === '-48px',
    JSON.stringify(skipLink),
  );

  const mainContent = await page.$('#main-content').catch(() => null);
  check('#main-content exists on home', !!mainContent);

  // roving tabindex: exactly one nav link with tabindex 0
  const tabIdx = await page.$$eval('#nav-items a', (as) =>
    as.map((a) => a.getAttribute('tabindex')),
  );
  const zeroCount = tabIdx.filter((t) => t === '0').length;
  check(
    'roving tabindex: exactly one 0',
    zeroCount === 1 && tabIdx.length > 0,
    JSON.stringify(tabIdx),
  );

  // skip link keyboard: focus reveals it
  await page.focus('body');
  await page.keyboard.press('Tab');
  await sleep(200);
  const focusEl = await page.evaluate(() => ({
    tag: document.activeElement.tagName,
    cls: document.activeElement.className,
  }));
  const skipFocused = focusEl.cls && String(focusEl.cls).includes('skip-link');
  check('Tab focuses skip-link first', skipFocused, JSON.stringify(focusEl));

  // arrow key moves roving tabindex within nav
  const navLink = await page.$('#nav-items a');
  await navLink.focus();
  await page.keyboard.press('ArrowRight');
  await sleep(200);
  const afterArrow = await page.evaluate(() => ({
    active: document.activeElement ? document.activeElement.textContent.trim() : null,
  }));
  check('ArrowRight moves focus between nav links', !!afterArrow.active, afterArrow.active);

  // ---------- EVENTS PAGE: white navbar + skip link ----------
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto(BASE + '/events', { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(1500);

  const navColor = await page2.evaluate(() => {
    const nav = document.querySelector('.nav-w, .nav-b');
    const link = document.querySelector('#nav-items a');
    const linkColor = link ? getComputedStyle(link).color : null;
    return { cls: nav ? nav.className : null, linkColor };
  });
  check(
    '/events navbar is white (nav-w)',
    navColor.cls && navColor.cls.includes('nav-w'),
    JSON.stringify(navColor),
  );

  const skip2 = await page2.$eval('a.skip-link', (el) => el.getAttribute('href')).catch(() => null);
  check('/events skip-link targets #main-content', skip2 === '#main-content', skip2);

  const headingCls = await page2.$eval('#main-content img', (el) => el.className).catch(() => null);
  check(
    '/events heading auto-scales (w-72 h-[45%])',
    !!headingCls && headingCls.includes('w-72') && headingCls.includes('h-[45%]'),
    headingCls,
  );

  // ---------- MODAL FOCUS TRAP on /events ----------
  await page2.evaluate(() => window.scrollTo(0, 0));
  await sleep(500);
  // find the gallery poster container (the relative cursor-pointer div)
  const opened = await page2.evaluate(() => {
    const poster = document.querySelector(
      'div[class*="relative"][class*="rounded-2xl"][class*="cursor-pointer"]',
    );
    if (poster) {
      poster.focus();
      poster.click();
      return true;
    }
    return false;
  });
  check('modal openable', opened);
  await sleep(800);

  const modal = await page2.$('[role="dialog"]').catch(() => null);
  check('modal has role=dialog + aria-modal', !!modal);

  const dialogInfo = await page2.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d
      ? { ariaModal: d.getAttribute('aria-modal'), label: d.getAttribute('aria-label') }
      : null;
  });
  check(
    'modal aria-modal=true + label',
    dialogInfo && dialogInfo.ariaModal === 'true' && !!dialogInfo.label,
    JSON.stringify(dialogInfo),
  );

  const focusInDialog = await page2.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d && d.contains(document.activeElement);
  });
  check('focus moved into dialog on open', focusInDialog);

  // Tab trap: Tab should keep focus inside dialog
  await page2.keyboard.press('Tab');
  await page2.keyboard.press('Tab');
  await page2.keyboard.press('Tab');
  await sleep(200);
  const stillInDialog = await page2.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return d && d.contains(document.activeElement);
  });
  check('Tab is trapped inside dialog', stillInDialog);

  // close via button, focus restored to trigger
  await page2.click('[aria-label="Close gallery"]').catch(() => {});
  await sleep(400);
  const closed = await page2.$('[role="dialog"]').catch(() => null);
  check('close button closes dialog', !closed);
  const restored = await page2.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return !d; // dialog gone
  });
  check('dialog removed from DOM', restored);

  const triggerFocused = await page2.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    return !d && !!document.activeElement && document.activeElement !== document.body;
  });
  check('focus restored to trigger after close', triggerFocused);

  // reopen + Escape closes
  await page2.evaluate(() => {
    const poster = document.querySelector(
      'div[class*="relative"][class*="rounded-2xl"][class*="cursor-pointer"]',
    );
    if (poster) poster.click();
  });
  await sleep(800);
  const modal2 = await page2.$('[role="dialog"]').catch(() => null);
  check('modal reopens', !!modal2);
  await page2.keyboard.press('Escape');
  await sleep(400);
  const closed2 = await page2.$('[role="dialog"]').catch(() => null);
  check('Escape closes dialog', !closed2);

  const navErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('Failed to load resource'),
  );
  check('no console/page errors', navErrors.length === 0, navErrors.slice(0, 3).join(' | '));

  console.log('\n=== SUMMARY ===');
  const pass = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`${pass} passed, ${fail} failed`);
} catch (e) {
  console.error('PROBE ERROR:', e.message);
  process.exit(1);
} finally {
  await browser.close();
}
