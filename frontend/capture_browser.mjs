import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = 'C:\\Users\\Raghav\\.gemini\\antigravity\\brain\\224397e1-04e0-47d5-9173-e21933d091f6\\scratch';

async function main() {
  console.log('Capturing Landing Page across Viewports (1440px, 768px, 375px)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  // 1. Desktop View (1440px)
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  console.log('Loading landing page at 1440px...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const desktopOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Desktop 1440px Horizontal Overflow: ${desktopOverflow ? 'FAIL (Overflow)' : 'PASS (Zero Overflow)'}`);

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_desktop_hero.png') });
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_desktop_full.png'), fullPage: true });
  console.log('Captured browser_desktop_hero.png and browser_desktop_full.png');

  // Element capture: Threat Sandbox
  const simulatorEl = await page.$('#simulator');
  if (simulatorEl) {
    await simulatorEl.screenshot({ path: path.join(SCRATCH_DIR, 'browser_simulator.png') });
    console.log('Captured browser_simulator.png');
  }

  // 2. Tablet View (768px)
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));

  const tabletOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Tablet 768px Horizontal Overflow: ${tabletOverflow ? 'FAIL (Overflow)' : 'PASS (Zero Overflow)'}`);

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_tablet.png') });
  console.log('Captured browser_tablet.png');

  // 3. Mobile View (375px)
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 3 });
  await new Promise((r) => setTimeout(r, 600));

  const mobileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log(`Mobile 375px Horizontal Overflow: ${mobileOverflow ? 'FAIL (Overflow)' : 'PASS (Zero Overflow)'}`);

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_mobile_375.png') });
  console.log('Captured browser_mobile_375.png');

  await browser.close();

  console.log(`Console Errors Caught: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  console.log('All multi-viewport verifications completed successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
