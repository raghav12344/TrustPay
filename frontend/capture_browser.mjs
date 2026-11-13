import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = 'C:\\Users\\Raghav\\.gemini\\antigravity\\brain\\224397e1-04e0-47d5-9173-e21933d091f6\\scratch';

async function main() {
  console.log('Launching Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  // Track console logs and errors
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
      errors.push(msg.text());
    } else {
      console.log(`[Browser ${msg.type()}]:`, msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error('PAGE UNCAUGHT ERROR:', err.message);
    errors.push(err.message);
  });

  console.log('Navigating to http://127.0.0.1:5173/...');
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait 2 seconds for WebGL & animations to settle
  await new Promise((r) => setTimeout(r, 2000));

  // Desktop Screenshot
  const desktopPath = path.join(SCRATCH_DIR, 'browser_desktop_hero.png');
  await page.screenshot({ path: desktopPath, fullPage: false });
  console.log('Saved desktop screenshot:', desktopPath);

  // Full page desktop
  const fullDesktopPath = path.join(SCRATCH_DIR, 'browser_desktop_full.png');
  await page.screenshot({ path: fullDesktopPath, fullPage: true });
  console.log('Saved full desktop screenshot:', fullDesktopPath);

  // Tablet Viewport (iPad Air: 820 x 1180)
  await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2 });
  await new Promise((r) => setTimeout(r, 600));
  const tabletPath = path.join(SCRATCH_DIR, 'browser_tablet.png');
  await page.screenshot({ path: tabletPath, fullPage: false });
  console.log('Saved tablet screenshot:', tabletPath);

  // Mobile Viewport (iPhone 14/15 Pro: 393 x 852)
  await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await new Promise((r) => setTimeout(r, 600));
  const mobilePath = path.join(SCRATCH_DIR, 'browser_mobile.png');
  await page.screenshot({ path: mobilePath, fullPage: false });
  console.log('Saved mobile screenshot:', mobilePath);

  await browser.close();
  console.log('\n=== BROWSER TEST COMPLETE ===');
  console.log(`Total errors captured: ${errors.length}`);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
