import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1440, height: 900 });

await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
await new Promise(r => setTimeout(r, 2000));

// Hover Products button
const btn = page.locator('header button[aria-controls="products-mega-menu"]');
await btn.hover({ timeout: 5000 });
await new Promise(r => setTimeout(r, 500));

// Check mega menu
const mega = page.locator('#products-mega-menu');
const megaVisible = await mega.isVisible().catch(() => false);
const megaCount = await mega.count();
console.log('Mega menu count:', megaCount);
console.log('Mega menu visible:', megaVisible);

// Check hamburger hidden on desktop
const hamburger = page.locator('.site-header__hamburger');
const hamburgerDisplay = await hamburger.evaluate(el => window.getComputedStyle(el).display).catch(() => 'NOT FOUND');
console.log('Hamburger display at 1440px:', hamburgerDisplay);

await page.screenshot({ path: 'screenshots/mega-open.png' });
console.log('Screenshot saved to screenshots/mega-open.png');

await browser.close();
process.exit(0);
