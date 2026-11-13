import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = 'C:\\Users\\Raghav\\.gemini\\antigravity\\brain\\224397e1-04e0-47d5-9173-e21933d091f6\\scratch';

async function main() {
  console.log('Testing Authentication & Dashboard Screens...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // 1. Visit Login Page
  console.log('Navigating to http://127.0.0.1:5173/login...');
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));

  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_login.png') });
  console.log('Saved screen_login.png');

  // Click Demo Admin tab
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('textContent')).jsonValue();
    if (text.includes('Demo Admin')) {
      console.log('Clicking Demo Admin button...');
      await b.click();
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_login_admin_autofill.png') });
  console.log('Saved screen_login_admin_autofill.png');

  // 2. Visit Register Page
  console.log('Navigating to http://127.0.0.1:5173/register...');
  await page.goto('http://127.0.0.1:5173/register', { waitUntil: 'domcontentloaded' });
  await new Promise((r) => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_register.png') });
  console.log('Saved screen_register.png');

  await browser.close();
  console.log('Screenshots captured successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
