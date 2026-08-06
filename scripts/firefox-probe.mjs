import puppeteer from 'puppeteer-core';

const FF = 'C:/Program Files/Waterfox/waterfox.exe';
let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    executablePath: FF,
    product: 'firefox',
    userDataDir: 'C:/Users/sebin/AppData/Local/Temp/opencode/ffprobe-profile',
    args: ['--no-sandbox'],
  });
} catch (e) {
  console.log('Firefox launch failed:', e.message.split('\n')[0]);
  process.exit(1);
}

const page = await browser.newPage();
page.setDefaultNavigationTimeout(90000);
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message.slice(0, 120)));

// Enable CPU throttling 6x via CDP (Firefox supports it in newer versions)
const cdp = await page.createCDPSession();
try { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 }); console.log('CPU throttle 6x: on'); } catch { console.log('CPU throttle: n/a in this FF build'); }

console.log('UA:', (await browser.version()).slice(0, 40));
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });

// Splash visible (Gecko + reduced-motion handling)
const splash = await page.evaluate(() => ({
  mug: !!document.querySelector('.coffee'),
  rm: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
}));
console.log('splash:', JSON.stringify(splash));

await new Promise(r => setTimeout(r, 3000));
const out = await page.evaluate(() => ({
  title: document.title.slice(0, 40),
  joinBtn: !!document.querySelector('button.contact'),
  nav: !!document.getElementById('nav-items'),
  featured: [...document.querySelectorAll('img[alt*="ECHO"]')].map(i => i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN'),
  eventImgs: [...document.querySelectorAll('.group img')].slice(0, 3).map(i => i.complete && i.naturalWidth > 0 ? 'OK' : 'BROKEN'),
  fonts: document.fonts.check('16px "Inter Variable"'),
  splashGone: !document.querySelector('.coffee'),
}));
console.log('gecko home:', JSON.stringify(out));
console.log('console errors:', errors.length ? errors.slice(0, 5) : 'none');

// /events route
await page.goto('http://localhost:4173/events', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 1500));
const ev = await page.evaluate(() => ({
  h2s: [...document.querySelectorAll('h2')].map(h => h.textContent),
  posters: [...document.querySelectorAll('img')].filter(i => i.naturalWidth > 0 && i.closest('a,div')).length,
}));
console.log('gecko /events:', JSON.stringify(ev));

await browser.close();
