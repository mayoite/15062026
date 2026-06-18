import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 500)}`);
});
page.on("pageerror", (e) => logs.push(`PAGE: ${e.message}`));

await page.goto("http://localhost:3000/planner/guest/", { timeout: 90000 });
const start = page.getByRole("button", { name: /start placing furniture/i });
if ((await start.count()) > 0) {
  await start.click();
  await page.waitForSelector(".pw-workspace", { timeout: 60000 });
}
await page.waitForTimeout(3000);

const layout = await page.evaluate(() => {
  const canvas = document.querySelector("#main");
  const wrap = document.querySelector(".canvas-wrap");
  const stage = document.querySelector(".fcw-stage-card");
  const pane2d = document.querySelector(".pw-view-stack__pane--2d");
  const chrome = document.querySelector(".pw-canvas-chrome-layer");
  const rect = canvas?.getBoundingClientRect();
  const centerEl = rect
    ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
    : null;
  return {
    canvas: rect
      ? {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        }
      : null,
    elementAtCenter: centerEl
      ? { tag: centerEl.tagName, id: centerEl.id, cls: centerEl.className?.slice?.(0, 80) }
      : null,
    wrap: wrap ? { w: wrap.clientWidth, h: wrap.clientHeight } : null,
    stage: stage ? { w: stage.clientWidth, h: stage.clientWidth } : null,
    pane2d: pane2d
      ? {
          active: pane2d.getAttribute("data-active"),
          pe: getComputedStyle(pane2d).pointerEvents,
          vis: getComputedStyle(pane2d).visibility,
        }
      : null,
    chromePE: chrome ? getComputedStyle(chrome).pointerEvents : null,
    zoom: document.querySelector(".zoom-control span")?.textContent?.trim(),
    hasApi: typeof window.__fabricExportDraft === "function",
    objects: (() => {
      try {
        return JSON.parse(window.__fabricExportDraft?.() || "{}").objects?.length ?? 0;
      } catch {
        return null;
      }
    })(),
  };
});
console.log("LAYOUT", JSON.stringify(layout, null, 2));

const lineBtn = page.locator('button[title="Line"]');
if ((await lineBtn.count()) > 0) {
  await lineBtn.first().click();
}
const box = await page.locator("#main").boundingBox();
let afterObjects = layout.objects;
if (box && box.width > 10 && box.height > 10) {
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.35);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.55);
  await page.mouse.up();
  await page.waitForTimeout(800);
  afterObjects = await page.evaluate(() => {
    try {
      return JSON.parse(window.__fabricExportDraft?.() || "{}").objects?.length;
    } catch {
      return "err";
    }
  });
}
console.log("AFTER_LINE_DRAW objects:", afterObjects);

const selectBtn = page.locator('button[title="Select"]');
if ((await selectBtn.count()) > 0) {
  await selectBtn.first().click();
  await page.waitForTimeout(300);
}
if (box && box.width > 10) {
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.waitForTimeout(500);
  const selection = await page.evaluate(() => {
    const ctx = window.__floorplanCtx;
    return ctx?.selections?.length ?? "no-ctx";
  });
  console.log("SELECTION after click:", selection);
}

if (logs.length) console.log("LOGS\n" + logs.slice(0, 20).join("\n"));
await page.screenshot({ path: "screenshots/debug-canvas-functional.png" });
await browser.close();