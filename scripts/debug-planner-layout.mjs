import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000/planner/guest/", { waitUntil: "domcontentloaded", timeout: 120000 });
const start = page.getByRole("button", { name: /start placing furniture/i });
if ((await start.count()) > 0) {
  await start.waitFor({ state: "visible", timeout: 60000 });
  await start.click();
}
const presetBtn = page.getByRole("button", { name: /rectangular|square|l-shaped|skip/i }).first();
if ((await presetBtn.count()) > 0) {
  await presetBtn.click();
  await page.waitForTimeout(2000);
}
await page.waitForSelector(".pw-workspace", { timeout: 60000 });
await page.waitForTimeout(2000);

const layout = await page.evaluate(() => {
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), z: getComputedStyle(el).zIndex };
  };
  const grid = document.querySelector(".fcw-workspace-grid");
  const kids = grid ? Array.from(grid.children).map((el) => ({
    cls: el.className,
    open: el.getAttribute("data-open"),
    rect: rect(el),
  })) : [];
  return {
    grid: rect(grid),
    kids,
    canvas: rect(document.querySelector("#main")),
    canvasWrap: rect(document.querySelector(".canvas-wrap")),
    stage: rect(document.querySelector(".fcw-stage-card")),
    layers: rect(document.querySelector(".fcw-layers-panel")),
    leftPanels: Array.from(document.querySelectorAll(".pw-left-panel")).map((el, i) => ({
      i,
      open: el.getAttribute("data-open"),
      fabric: el.getAttribute("data-fabric-library"),
      parent: el.parentElement?.className,
      rect: rect(el),
    })),
    stack2d: rect(document.querySelector(".pw-view-stack__pane--2d")),
  };
});

console.log(JSON.stringify(layout, null, 2));
await browser.close();