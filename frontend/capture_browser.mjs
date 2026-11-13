import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = 'C:\\Users\\Raghav\\.gemini\\antigravity\\brain\\224397e1-04e0-47d5-9173-e21933d091f6\\scratch';

async function main() {
  console.log('Capturing Landing Page across Viewports...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Desktop View
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  console.log('Loading landing page...');
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1200));

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_desktop_hero.png') });
  console.log('Captured browser_desktop_hero.png');

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_desktop_full.png'), fullPage: true });
  console.log('Captured browser_desktop_full.png');

  // Tablet View
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_tablet.png') });
  console.log('Captured browser_tablet.png');

  // Mobile View
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'browser_mobile.png') });
  console.log('Captured browser_mobile.png');

  await browser.close();
  console.log('All landing screenshots captured successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
