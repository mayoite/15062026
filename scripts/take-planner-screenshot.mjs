import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "results", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:3000/planner/guest", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(3000);

const startBtn = page.getByRole("button", { name: /start placing furniture/i }).first();
if ((await startBtn.count()) > 0) {
  await startBtn.click();
  await page.waitForTimeout(4000);
}

await page.waitForSelector(".pw-workspace, .fcw-workspace", { timeout: 60000 }).catch(() => {});

const leftBtn = page.getByRole("button", { name: /open library panel/i }).first();
if ((await leftBtn.count()) > 0) {
  await leftBtn.click();
  await page.waitForTimeout(1500);
}

const outPath = path.join(outDir, "planner-guest-left-panel.png");
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`saved ${outPath}`);
