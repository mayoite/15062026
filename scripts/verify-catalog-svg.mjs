import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:3000/planner/guest/", { timeout: 60000 });
await page.getByRole("button", { name: /start placing furniture/i }).click();
await page.waitForSelector(".pw-catalog", { timeout: 60000 });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const svg = document.querySelector(".pw-catalog-block-preview svg");
  if (!svg) return { error: "no svg" };
  const html = svg.outerHTML;
  return {
    hasPath: html.includes("<path"),
    hasPolyline: html.includes("<polyline"),
    hasVar: html.includes("var(--block"),
    hasHex: /fill="#[0-9a-f]{3,8}"/i.test(html),
    childTags: [...new Set([...svg.querySelectorAll("*")].map((el) => el.tagName.toLowerCase()))],
    previews: document.querySelectorAll(".pw-catalog-block-preview svg").length,
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();