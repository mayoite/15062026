import { chromium } from "playwright";
import { mkdirSync } from "fs";

const base = "http://localhost:3000";
const outDir = "results/responsive";
mkdirSync(outDir, { recursive: true });
const views = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 834, height: 1112 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "desktop", width: 1536, height: 960 },
];
const pages = [
  { path: "/", slug: "home" },
  { path: "/planner", slug: "planner" },
];

const browser = await chromium.launch();
for (const { path, slug } of pages) {
  for (const view of views) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height } });
    await page.goto(base + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/${slug}-${view.name}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
console.log("screenshots done");
