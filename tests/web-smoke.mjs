import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const shotsDir = `${here}/shots`;
mkdirSync(shotsDir, { recursive: true });

const URL = process.env.GV_URL || 'http://localhost:8081/';
const consoleMessages = [];
const networkErrors = [];
const pageErrors = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  colorScheme: process.env.GV_THEME === 'light' ? 'light' : 'dark',
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
});
const page = await ctx.newPage();

page.on('console', (msg) => {
  consoleMessages.push({ type: msg.type(), text: msg.text() });
});
page.on('pageerror', (err) => {
  pageErrors.push(err.message);
});
page.on('requestfailed', (req) => {
  networkErrors.push({ url: req.url(), failure: req.failure()?.errorText });
});

try {
  console.log('[step] navigating');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45_000 });
} catch (err) {
  console.log('[warn] goto networkidle timed out:', err.message);
}

// Give RN-web a moment to hydrate.
await page.waitForTimeout(2500);

console.log('[step] shot: landing');
await page.screenshot({ path: `${shotsDir}/01-landing.png`, fullPage: true });

// Try to find and click "Connect GitHub"
let clickedConnect = false;
try {
  const btn = page.getByText('Connect GitHub', { exact: false });
  if (await btn.count()) {
    await btn.first().click({ timeout: 5000 });
    clickedConnect = true;
    await page.waitForTimeout(1500);
    console.log('[step] shot: onboarding-idle');
    await page.screenshot({ path: `${shotsDir}/02-onboarding-idle.png`, fullPage: true });
  }
} catch (err) {
  console.log('[warn] could not click Connect GitHub:', err.message);
}

// Try to click Start (triggers GitHub Device Flow request)
let clickedStart = false;
try {
  const start = page.getByText('Start', { exact: true });
  if (await start.count()) {
    await start.first().click({ timeout: 5000 });
    clickedStart = true;
    await page.waitForTimeout(4000);
    console.log('[step] shot: onboarding-waiting');
    await page.screenshot({ path: `${shotsDir}/03-onboarding-waiting.png`, fullPage: true });
  }
} catch (err) {
  console.log('[warn] could not click Start:', err.message);
}

// Navigate to /settings as a smoke test
try {
  await page.goto(URL + 'settings', { waitUntil: 'networkidle', timeout: 15_000 });
  await page.waitForTimeout(1500);
  console.log('[step] shot: settings');
  await page.screenshot({ path: `${shotsDir}/04-settings.png`, fullPage: true });
} catch (err) {
  console.log('[warn] settings nav failed:', err.message);
}

await browser.close();

const report = {
  url: URL,
  viewport: { width: 390, height: 844 },
  clickedConnect,
  clickedStart,
  pageErrors,
  networkErrors: networkErrors.slice(0, 20),
  consoleErrors: consoleMessages.filter((m) => m.type === 'error').slice(0, 30),
  consoleWarnings: consoleMessages.filter((m) => m.type === 'warning').slice(0, 10),
  consoleTotals: {
    log: consoleMessages.filter((m) => m.type === 'log').length,
    warning: consoleMessages.filter((m) => m.type === 'warning').length,
    error: consoleMessages.filter((m) => m.type === 'error').length,
  },
};
console.log('\n=== REPORT ===');
console.log(JSON.stringify(report, null, 2));
