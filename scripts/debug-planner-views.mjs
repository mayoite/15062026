import { chromium } from "@playwright/test";
import fs from "node:fs";

fs.mkdirSync("screenshots", { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on("console", (m) => {
  if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text().slice(0, 400)}`);
});
page.on("pageerror", (e) => logs.push(`PAGEERROR: ${e.message.slice(0, 400)}`));

await page.goto("http://localhost:3000/planner/guest/", {
  waitUntil: "domcontentloaded",
  timeout: 120000,
});
await page.waitForTimeout(2000);

const start = page.getByRole("button", { name: /start placing furniture/i });
await start.waitFor({ state: "visible", timeout: 60000 });
await start.click();
await page.waitForSelector(".pw-workspace", { timeout: 60000 });

const presetBtn = page.getByRole("button", { name: /rectangular|square|l-shaped|skip/i }).first();
if ((await presetBtn.count()) > 0) {
  await presetBtn.click();
  await page.waitForTimeout(1500);
}

const coachNext = page.getByRole("button", { name: /^next$/i }).first();
if ((await coachNext.count()) > 0) {
  await coachNext.click().catch(() => {});
  await page.waitForTimeout(500);
}

await page.waitForTimeout(3000);

const readState = async (label) => {
  const state = await page.evaluate(() => {
    const r3f = document.querySelector(".pw-viewer-canvas canvas");
    const rect = r3f?.getBoundingClientRect();
    const main = document.querySelector("#main");
    const mainRect = main?.getBoundingClientRect();
    const stage = document.querySelector(".fcw-stage-card")?.getBoundingClientRect();
    return {
      subtopbars: document.querySelectorAll(".pw-subtopbar").length,
      fabricToolbar: document.querySelectorAll(".pw-subtopbar--fabric").length,
      visibleFabric: Array.from(document.querySelectorAll(".pw-subtopbar--fabric")).filter(
        (el) => el.offsetParent !== null,
      ).length,
      stack2d: document.querySelector(".pw-view-stack__pane--2d")?.getAttribute("data-active"),
      stack3d: document.querySelector(".pw-view-stack__pane--3d")?.getAttribute("data-active"),
      zoomLabel: document.querySelector(".zoom-control span")?.textContent?.trim(),
      mainCanvas: mainRect
        ? { x: Math.round(mainRect.x), y: Math.round(mainRect.y), w: Math.round(mainRect.width), h: Math.round(mainRect.height) }
        : null,
      stage: stage
        ? { x: Math.round(stage.x), y: Math.round(stage.y), w: Math.round(stage.width), h: Math.round(stage.height) }
        : null,
      r3f: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
      leftPanels: document.querySelectorAll(".pw-left-panel").length,
      objects: (() => {
        try {
          const fn = window.__fabricExportDraft;
          if (!fn) return null;
          return JSON.parse(fn()).objects?.length;
        } catch {
          return "err";
        }
      })(),
    };
  });
  console.log(label, JSON.stringify(state, null, 2));
  return state;
};

await readState("2D");
await page.screenshot({ path: "screenshots/debug-2d.png" });

await page.locator(".pw-segment-btn", { hasText: "3D" }).click();
await page.waitForTimeout(2500);
await readState("3D");
await page.screenshot({ path: "screenshots/debug-3d.png" });

await page.locator(".pw-segment-btn", { hasText: "2D" }).click();
await page.waitForTimeout(1500);

const lineBtn = page.locator('button[title="Line"]');
if ((await lineBtn.count()) > 0) {
  await lineBtn.first().click();
  const canvas = page.locator("#main");
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6);
    await page.mouse.up();
    await page.waitForTimeout(1000);
    const objs = await page.evaluate(() => {
      const fn = window.__fabricExportDraft;
      if (!fn) return "no export";
      try {
        return JSON.parse(fn()).objects?.length;
      } catch {
        return "err";
      }
    });
    console.log("after line draw objects:", objs);
  }
}

if (logs.length) console.log("LOGS\n" + logs.slice(0, 10).join("\n"));

await browser.close();