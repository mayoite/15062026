import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(2000);

await page.screenshot({ path: 'screenshots/header-check.png', clip: { x: 0, y: 0, width: 1440, height: 80 } });
await page.screenshot({ path: 'screenshots/full-check.png', fullPage: false });

const headerBg = await page.locator('header').evaluate(el => window.getComputedStyle(el).backgroundColor);
const headerH = await page.locator('header').evaluate(el => el.getBoundingClientRect().height);
const logoVisible = await page.locator('header img').first().isVisible();
const navLinks = await page.locator('header nav a').count();
const btnText = await page.locator('header button').filter({ hasText: 'Guided' }).textContent().catch(() => 'NOT FOUND');
const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
const containerW = await page.locator('header > div').first().evaluate(el => el.getBoundingClientRect().width);

console.log('Header bg:', headerBg);
console.log('Header height:', headerH);
console.log('Container width:', containerW);
console.log('Logo visible:', logoVisible);
console.log('Nav links:', navLinks);
console.log('CTA button:', btnText);
console.log('Body bg:', bodyBg);

await browser.close();
