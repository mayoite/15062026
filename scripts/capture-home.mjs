import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
await page.screenshot({ path: "results/home-hero.png" });
await page.locator("#home-contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await page.screenshot({ path: "results/home-contact.png" });
await page.click('button[aria-label="Open quick contact"]');
await page.waitForTimeout(400);
await page.screenshot({ path: "results/home-quick-contact.png" });
await browser.close();
