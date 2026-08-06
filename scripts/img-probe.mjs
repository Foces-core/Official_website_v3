import puppeteer from 'puppeteer-core';
const CHROME = 'C:/Users/sebin/AppData/Local/Chromium/Application/chrome.exe';
const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'], executablePath: CHROME });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await page.goto('http://localhost:4173', { waitUntil: 'networkidle2' });
await new Promise(r => setTimeout(r, 2200));
const out = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')].filter(i => i.src.includes('webp') || i.src.includes('assets'));
  return {
    webpCount: imgs.length,
    broken: imgs.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src.slice(-30)),
    featureSlides: [...document.querySelectorAll('img[alt*="ECHO"]')].map(i => (i.complete && i.naturalWidth > 0) ? 'OK' : 'BROKEN'),
    eventImgs: [...document.querySelectorAll('.group img')].slice(0,3).map(i => (i.complete && i.naturalWidth > 0) ? 'OK' : 'BROKEN'),
    fontLoaded: document.fonts.check('16px "Inter Variable"'),
    sputnik: document.fonts.check('16px "Space Grotesk Variable"'),
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
