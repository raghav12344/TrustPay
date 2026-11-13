import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCRATCH_DIR = 'C:\\Users\\Raghav\\.gemini\\antigravity\\brain\\224397e1-04e0-47d5-9173-e21933d091f6\\scratch';

async function main() {
  console.log('Testing Authenticated Views with Full CORS Preflight Support...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 2 });
  await page.setRequestInterception(true);

  page.on('console', (msg) => console.log('PAGE:', msg.text()));

  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();

    // Universal CORS Preflight Handling
    if (method === 'OPTIONS') {
      req.respond({
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, *',
        },
      });
      return;
    }

    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    };

    if (url.includes('/transactions/admin/fraud-alerts')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({
          success: true,
          alerts: [
            {
              transaction_id: 89420,
              customer_name: 'Vikram Mehta',
              phone: '+91 98765 43210',
              amount: 125000.0,
              risk_score: 94,
              severity: 'CRITICAL',
              prediction: 'HIGH_RISK',
              alert_status: 'OPEN',
              transaction_type: 'TRANSFER',
              reason: 'Velocity spike (380 km/h) & unusual offshore routing anomaly',
            },
            {
              transaction_id: 89390,
              customer_name: 'Ananya Roy',
              phone: '+91 98123 45678',
              amount: 45000.0,
              risk_score: 72,
              severity: 'HIGH',
              prediction: 'HIGH_RISK',
              alert_status: 'OPEN',
              transaction_type: 'PAYMENT',
              reason: 'Sudden midnight POS swipe exceeding 3-sigma historical mean',
            },
            {
              transaction_id: 89312,
              customer_name: 'Rahul Verma',
              phone: '+91 97234 56789',
              amount: 8900.0,
              risk_score: 88,
              severity: 'CRITICAL',
              prediction: 'HIGH_RISK',
              alert_status: 'RESOLVED',
              transaction_type: 'WITHDRAWAL',
              reason: 'ATM geofence breach resolved following manual phone verification',
            },
          ],
        }),
      });
    } else if (url.includes('/accounts/me')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({
          success: true,
          account: {
            accountId: 101,
            accountNumber: '429188472910',
            accountType: 'Savings',
            balance: 148520.5,
            status: 'ACTIVE',
          },
        }),
      });
    } else if (url.endsWith('/transactions') && method === 'GET') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({
          success: true,
          transactions: [
            {
              transaction_id: 89421,
              amount: 4500.0,
              merchant: 'Apple Store BKC',
              transaction_type: 'PAYMENT',
              status: 'APPROVED',
              transaction_time: new Date().toISOString(),
              risk_level: 'LOW_RISK',
            },
            {
              transaction_id: 89420,
              amount: 125000.0,
              merchant: 'Offshore Crypto Gateway',
              transaction_type: 'TRANSFER',
              status: 'PENDING',
              transaction_time: new Date(Date.now() - 3600000).toISOString(),
              risk_level: 'HIGH_RISK',
            },
          ],
        }),
      });
    } else if (url.includes('/health')) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers,
        body: JSON.stringify({ status: 'OK', service: 'trustpay-gateway' }),
      });
    } else {
      req.continue();
    }
  });

  // 1. Customer Session
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('trustpay_token', 'valid_test_customer_jwt');
    localStorage.setItem(
      'trustpay_user',
      JSON.stringify({
        id: 1,
        name: 'Rohan Sharma',
        email: 'rohan@example.com',
        role: 'CUSTOMER',
      })
    );
  });

  console.log('Navigating to Customer Dashboard...');
  await page.goto('http://127.0.0.1:5173/dashboard', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_customer_dashboard.png') });
  console.log('Saved screen_customer_dashboard.png');

  // Customer Transfer
  console.log('Navigating to Customer Transfer...');
  await page.goto('http://127.0.0.1:5173/make-transaction', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_customer_transfer.png') });
  console.log('Saved screen_customer_transfer.png');

  // 2. Admin Session
  await page.evaluate(() => {
    localStorage.setItem('trustpay_token', 'valid_test_admin_jwt');
    localStorage.setItem(
      'trustpay_user',
      JSON.stringify({
        id: 4,
        name: 'TrustPay Admin',
        email: 'admin@trustpay.com',
        role: 'ADMIN',
      })
    );
  });

  console.log('Navigating to Admin Dashboard...');
  await page.goto('http://127.0.0.1:5173/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_admin_dashboard.png') });
  console.log('Saved screen_admin_dashboard.png');

  // Admin Fraud Alerts Queue
  console.log('Navigating to Admin Fraud Alerts...');
  await page.goto('http://127.0.0.1:5173/admin/fraud-alerts', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(SCRATCH_DIR, 'screen_admin_fraud_alerts.png') });
  console.log('Saved screen_admin_fraud_alerts.png');

  await browser.close();
  console.log('SUCCESS: All 4 authenticated pages rendered and screenshotted perfectly!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
