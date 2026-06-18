import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => {
  Object.keys(localStorage)
    .filter((k) => k.includes("planner") || k.includes("guest"))
    .forEach((k) => localStorage.removeItem(k));
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/planner/guest/?plannerDevTools=1", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
const start = page.getByRole("button", { name: /start placing furniture/i });
if (await start.isVisible().catch(() => false)) {
  await page.locator("#project-setup-name").fill("zoom test");
  await start.click();
  await page.waitForTimeout(800);
}
await page.waitForSelector("#main", { timeout: 30000 });
const preset = page.getByRole("button", { name: /skip|rectangular/i }).first();
if ((await preset.count()) > 0) {
  await preset.click();
  await page.waitForTimeout(1000);
}

const read = () =>
  page.evaluate(() => {
    const c = document.querySelector("#main");
    const r = c?.getBoundingClientRect();
    const label = document.querySelector(".zoom-control span")?.textContent?.trim();
    return { w: Math.round(r?.width ?? 0), h: Math.round(r?.height ?? 0), label };
  });

const before = await read();
await page.locator('.zoom-control button[aria-label="Zoom in"]').click();
await page.waitForTimeout(400);
const afterOne = await read();
await page.locator('.zoom-control button[aria-label="Zoom in"]').click();
await page.waitForTimeout(400);
const afterTwo = await read();

console.log(
  JSON.stringify(
    {
      before,
      afterOne,
      afterTwo,
      labelIncreased: afterTwo.label !== before.label,
      widthIncreased: afterTwo.w > before.w,
    },
    null,
    2,
  ),
);
await browser.close();