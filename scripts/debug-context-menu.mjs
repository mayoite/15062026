import { chromium } from "@playwright/test";

const URL = process.env.PLANNER_URL ?? "http://localhost:3000/planner/guest/?plannerDevTools=1";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await context.addInitScript(() => {
  try {
    Object.keys(localStorage)
      .filter((k) => k.includes("planner") || k.includes("guest") || k.includes("project-setup"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
});

const page = await context.newPage();
const resp = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
console.log("status", resp?.status());

const projectNameInput = page.locator("#project-setup-name");
const workspace = page.locator(".pw-workspace");
await Promise.race([
  projectNameInput.waitFor({ state: "visible", timeout: 60000 }),
  workspace.waitFor({ state: "visible", timeout: 60000 }),
]).catch(() => {});

if (await projectNameInput.isVisible().catch(() => false)) {
  await projectNameInput.fill("Context menu test");
  await page.getByRole("button", { name: /Start placing furniture/i }).click();
  await page.waitForTimeout(1000);
}

await page.waitForSelector(".pw-workspace", { timeout: 60000 });
await page.waitForSelector("#main", { timeout: 30000 });

const presetBtn = page.getByRole("button", { name: /rectangular|square|l-shaped|skip/i }).first();
if ((await presetBtn.count()) > 0) {
  await presetBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
}

const btn2d = page.locator(".pw-segment-btn", { hasText: "2D" });
if ((await btn2d.count()) > 0) {
  await btn2d.click().catch(() => {});
  await page.waitForTimeout(500);
}

const canvas = page.locator("#main");
const box = await canvas.boundingBox();
console.log("canvas box", box);

if (!box) {
  console.error("no canvas box");
  process.exit(1);
}

const cx = box.x + box.width / 2;
const cy = box.y + box.height / 2;
await page.mouse.click(cx, cy, { button: "right" });
await page.waitForTimeout(400);

const menu = page.locator(".fcw-context-menu");
const result = {
  menuCount: await menu.count(),
  menuVisible: (await menu.count()) > 0 ? await menu.isVisible() : false,
  menuBox: (await menu.count()) > 0 ? await menu.boundingBox() : null,
  menuItems: (await menu.count()) > 0 ? await menu.locator("button").allTextContents() : [],
  menuParent: await page.evaluate(() => {
    const el = document.querySelector(".fcw-context-menu");
    return el?.parentElement?.tagName ?? null;
  }),
};

console.log(JSON.stringify(result, null, 2));
await page.screenshot({ path: "screenshots/context-menu-debug.png", fullPage: false });
await browser.close();