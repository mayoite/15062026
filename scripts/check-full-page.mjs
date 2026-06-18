/**
 * Full-page audit of /planner/guest/ — layout, views, panels, errors, interactions.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = process.env.PLANNER_URL ?? "http://localhost:3000";
const URL = `${BASE}/planner/guest/?plannerDevTools=1&_fp=${Date.now()}`;
const OUT = "screenshots/full-page-audit";

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync("screenshots", { recursive: true });

const report = {
  url: URL,
  viewport: { width: 1440, height: 900 },
  timestamp: new Date().toISOString(),
  onboarding: {},
  layout: {},
  regions: {},
  views: {},
  interactions: {},
  apis: {},
  issues: [],
  httpErrors: [],
  consoleErrors: [],
};

function issue(severity, code, message, evidence = {}) {
  report.issues.push({ severity, code, message, evidence });
}

function collectPageState() {
  function rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      display: cs.display,
      visibility: cs.visibility,
      pointerEvents: cs.pointerEvents,
      zIndex: cs.zIndex,
    };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const docH = document.documentElement.scrollHeight;
  const docW = document.documentElement.scrollWidth;
  const hasHScroll = docW > vw + 2;
  const hasVScroll = docH > vh + 2;

  const selectors = {
    shell: ".pw-shell",
    topbar: ".pw-topbar, header.pw-topbar, [class*='pw-topbar']",
    subtopbarShell: ".pw-subtopbar-shell",
    subtopbars: ".pw-subtopbar",
    fabricToolbar: ".pw-subtopbar--fabric",
    workspace: ".pw-workspace",
    canvasStage: ".pw-canvas-stage",
    canvasArea: ".pw-canvas-area",
    canvasBody: ".pw-canvas-body",
    canvasSurface: ".pw-canvas-surface",
    viewStack: ".pw-view-stack",
    pane2d: ".pw-view-stack__pane--2d",
    pane3d: ".pw-view-stack__pane--3d",
    fcwWorkspace: ".fcw-workspace",
    fcwGrid: ".fcw-workspace-grid",
    stageCard: ".fcw-stage-card",
    canvasWrap: ".canvas-wrap",
    mainCanvas: "#main",
    layersPanel: ".fcw-layers-panel",
    statusBar2d: ".fcw-status-bar",
    statusBar3d: ".pw-status-bar",
    leftPanels: ".pw-left-panel",
    rightPanel: ".pw-right-panel",
    viewerHost: ".pw-viewer-host",
    r3fCanvas: ".pw-viewer-canvas canvas",
    zoomControl: ".zoom-control",
    segment2d: ".pw-segment-btn",
    roomPresetModal: "[role='dialog']",
    contextMenu: ".fcw-context-menu",
  };

  const els = {};
  for (const [key, sel] of Object.entries(selectors)) {
    if (key === "segment2d") {
      const all = Array.from(document.querySelectorAll(sel));
      els.segmentBtns = all.map((b) => ({
        text: b.textContent?.trim(),
        pressed: b.getAttribute("aria-pressed"),
        rect: rect(b),
      }));
      continue;
    }
    if (key === "leftPanels") {
      els.leftPanels = Array.from(document.querySelectorAll(sel)).map((el, i) => ({
        i,
        dataOpen: el.getAttribute("data-open"),
        dataCollapsed: el.getAttribute("data-collapsed"),
        parentCls: el.parentElement?.className?.slice?.(0, 80),
        rect: rect(el),
      }));
      continue;
    }
    if (key === "subtopbars") {
      els.subtopbars = Array.from(document.querySelectorAll(sel)).map((el, i) => ({
        i,
        cls: el.className,
        visible: el.offsetParent !== null,
        rect: rect(el),
      }));
      continue;
    }
    const el = document.querySelector(sel);
    els[key] = el ? rect(el) : null;
    if (key === "pane2d" || key === "pane3d") {
      els[`${key}Active`] = el?.getAttribute("data-active") ?? null;
    }
    if (key === "canvasBody") {
      els.canvasBodyViewMode = el?.getAttribute("data-view-mode") ?? null;
    }
    if (key === "workspace") {
      els.workspaceOverflow = el
        ? { scrollH: el.scrollHeight, clientH: el.clientHeight, scrollW: el.scrollWidth, clientW: el.clientWidth }
        : null;
    }
  }

  const canvas = document.querySelector("#main");
  const canvasR = canvas?.getBoundingClientRect();
  const centerHit = canvasR
    ? document.elementFromPoint(canvasR.left + canvasR.width / 2, canvasR.top + canvasR.height / 2)
    : null;

  let objectCount = null;
  let exportError = null;
  try {
    const fn = window.__fabricExportDraft;
    if (typeof fn === "function") {
      const raw = fn();
      objectCount = raw ? JSON.parse(raw).objects?.length ?? 0 : 0;
    }
  } catch (e) {
    exportError = String(e?.message ?? e);
  }

  const fcwGrid = document.querySelector(".fcw-workspace-grid");
  const gridCols = fcwGrid ? getComputedStyle(fcwGrid).gridTemplateColumns : null;

  return {
    viewport: { w: vw, h: vh },
    document: { w: docW, h: docH, hasHScroll, hasVScroll },
    ...els,
    gridTemplateColumns: gridCols,
    elementAtCanvasCenter: centerHit
      ? { tag: centerHit.tagName, id: centerHit.id, cls: String(centerHit.className).slice(0, 100) }
      : null,
    fabricApis: {
      exportDraft: typeof window.__fabricExportDraft === "function",
      placeCatalog: typeof window.__fabricPlaceCatalog === "function",
      importDraft: typeof window.__fabricImportDraft === "function",
      editRoom: typeof window.__fabricEditRoom === "function",
      floorplanCtx: typeof window.__floorplanCtx !== "undefined",
    },
    objectCount,
    exportError,
    zoomText: document.querySelector(".zoom-control span")?.textContent?.trim() ?? null,
    title: document.title,
  };
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: report.viewport });
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
page.on("console", (msg) => {
  if (msg.type() === "error") report.consoleErrors.push(msg.text().slice(0, 500));
});
page.on("pageerror", (err) => report.consoleErrors.push(`PAGE: ${err.message.slice(0, 500)}`));
page.on("response", (res) => {
  if (res.status() >= 400) {
    report.httpErrors.push({ status: res.status(), url: res.url().slice(0, 400) });
  }
});

// --- Load ---
const resp = await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
report.httpStatus = resp?.status() ?? null;

const projectName = page.locator("#project-setup-name");
const workspace = page.locator(".pw-workspace");
await Promise.race([
  projectName.waitFor({ state: "visible", timeout: 60000 }),
  workspace.waitFor({ state: "visible", timeout: 60000 }),
]).catch(() => {});

if (await projectName.isVisible().catch(() => false)) {
  await projectName.fill("Full page audit");
  await page.getByRole("button", { name: /Start placing furniture/i }).click();
  report.onboarding.setupSubmitted = true;
  await page.waitForTimeout(1000);
} else {
  report.onboarding.setupSubmitted = false;
}

await page.waitForSelector(".pw-workspace", { timeout: 60000 });

const presetBtn = page.getByRole("button", { name: /rectangular|square|l-shaped|skip/i }).first();
if ((await presetBtn.count()) > 0) {
  await presetBtn.click().catch(() => {});
  await page.waitForTimeout(1500);
  report.onboarding.presetDismissed = true;
}

const coachNext = page.getByRole("button", { name: /^next$/i }).first();
if ((await coachNext.count()) > 0) {
  await coachNext.click().catch(() => {});
  await page.waitForTimeout(400);
}

await page.waitForSelector("#main", { timeout: 30000 });
await page.waitForTimeout(1500);

// --- 2D full page ---
report.views.mode2d = await page.evaluate(collectPageState);
await page.screenshot({ path: `${OUT}/full-2d.png`, fullPage: true });
await page.screenshot({ path: `${OUT}/viewport-2d.png`, fullPage: false });

// Layout checks 2D
const s2d = report.views.mode2d;
report.layout = {
  viewport: s2d.viewport,
  document: s2d.document,
  gridTemplateColumns: s2d.gridTemplateColumns,
};

if (s2d.document?.hasHScroll) {
  issue("warn", "PAGE_H_SCROLL", "Page has horizontal scrollbar", { docW: s2d.document.w, vw: s2d.viewport.w });
}
if (s2d.document?.hasVScroll) {
  issue("info", "PAGE_V_SCROLL", "Page has vertical scrollbar (may be expected on small viewports)", {
    docH: s2d.document.h,
    vh: s2d.viewport.h,
  });
}
if (!s2d.mainCanvas || s2d.mainCanvas.w < 100 || s2d.mainCanvas.h < 100) {
  issue("critical", "CANVAS_TOO_SMALL", "#main canvas dimensions unusable", { mainCanvas: s2d.mainCanvas });
}
if (s2d.stageCard && s2d.mainCanvas && s2d.mainCanvas.w > s2d.stageCard.w * 1.15) {
  issue("warn", "CANVAS_OVERFLOW_STAGE", "Canvas wider than stage card", {
    canvasW: s2d.mainCanvas.w,
    stageW: s2d.stageCard.w,
  });
}
if (s2d.elementAtCanvasCenter?.id !== "main") {
  issue("warn", "CANVAS_CENTER_BLOCKED", "elementFromPoint at canvas center is not #main", {
    hit: s2d.elementAtCanvasCenter,
  });
}
if (s2d.pane2dActive !== "true") {
  issue("warn", "PANE2D_INACTIVE", "2D pane not data-active=true in 2D mode", { active: s2d.pane2dActive });
}
if (s2d.rightPanel?.display !== "none" && s2d.canvasBodyViewMode === "2d") {
  const rp = s2d.rightPanel;
  if (rp && rp.w > 50 && rp.visibility !== "hidden") {
    issue("info", "RIGHT_PANEL_VISIBLE_2D", "Right panel may be visible in 2D (check if intentional)", { rect: rp });
  }
}
const visibleSubtopbars = (s2d.subtopbars ?? []).filter((t) => t.visible);
if (visibleSubtopbars.length > 3) {
  issue("warn", "MULTIPLE_SUBTOPBARS", "More than 3 visible subtopbar bands", { count: visibleSubtopbars.length });
}

report.apis = s2d.fabricApis;
if (!s2d.fabricApis.exportDraft) issue("critical", "API_EXPORT_MISSING", "__fabricExportDraft not available");
if (!s2d.fabricApis.placeCatalog) issue("error", "API_PLACE_MISSING", "__fabricPlaceCatalog not available");
if (!s2d.fabricApis.floorplanCtx) issue("warn", "API_CTX_MISSING", "__floorplanCtx not exposed");

// --- Open left panel (catalog) ---
const openLeft = page.getByRole("button", { name: /open left panel|library/i }).first();
if ((await openLeft.count()) === 0) {
  const leftToggle = page.locator('[aria-label*="left" i]').first();
  if ((await leftToggle.count()) > 0) await leftToggle.click().catch(() => {});
} else {
  await openLeft.click().catch(() => {});
}
await page.waitForTimeout(800);
report.views.mode2dLeftOpen = await page.evaluate(collectPageState);
await page.screenshot({ path: `${OUT}/viewport-2d-left-open.png`, fullPage: false });

// --- 3D view ---
await page.locator(".pw-segment-btn", { hasText: "3D" }).click();
await page.waitForTimeout(2500);
report.views.mode3d = await page.evaluate(collectPageState);
await page.screenshot({ path: `${OUT}/full-3d.png`, fullPage: true });
await page.screenshot({ path: `${OUT}/viewport-3d.png`, fullPage: false });

const s3d = report.views.mode3d;
if (s3d.pane3dActive !== "true") {
  issue("warn", "PANE3D_INACTIVE", "3D pane not active after 3D toggle", { active: s3d.pane3dActive });
}
if (!s3d.r3fCanvas || s3d.r3fCanvas.w < 100) {
  issue("error", "R3F_CANVAS_MISSING", "R3F canvas not visible or too small in 3D mode", { r3f: s3d.r3fCanvas });
}
const fabricToolbarHidden = (s3d.fabricToolbar?.display === "none") || s3d.fabricToolbar?.h === 0;
if (s3d.fabricToolbar && s3d.fabricToolbar.h > 10 && !fabricToolbarHidden) {
  issue("warn", "FABRIC_TOOLBAR_IN_3D", "Fabric toolbar still visible in 3D mode", { rect: s3d.fabricToolbar });
}

// --- Back to 2D + interactions ---
await page.locator(".pw-segment-btn", { hasText: "2D" }).click();
await page.waitForTimeout(1200);

// Right-click context menu
const box = await page.locator("#main").boundingBox();
if (box) {
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { button: "right" });
  await page.waitForTimeout(400);
  const menuVisible = await page.locator(".fcw-context-menu").isVisible().catch(() => false);
  const menuItems = menuVisible ? await page.locator(".fcw-context-menu button").allTextContents() : [];
  report.interactions.contextMenu = { visible: menuVisible, items: menuItems };
  if (!menuVisible) issue("error", "CONTEXT_MENU_MISSING", "Right-click context menu did not appear");
  await page.keyboard.press("Escape");
}

// Line draw
const lineBtn = page.locator('button[title="Line"]');
if ((await lineBtn.count()) > 0 && box) {
  await lineBtn.first().click();
  await page.waitForTimeout(200);
  const before = s2d.objectCount ?? 0;
  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.5);
  await page.mouse.up();
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => {
    try {
      const raw = window.__fabricExportDraft?.();
      return raw ? JSON.parse(raw).objects?.length ?? 0 : 0;
    } catch {
      return null;
    }
  });
  report.interactions.lineDraw = { before, after, delta: (after ?? 0) - before };
  if ((after ?? 0) <= before) issue("error", "LINE_DRAW_FAIL", "Line tool did not add objects");
} else {
  issue("warn", "LINE_TOOL_ABSENT", "Line tool button not found");
}

// Edit room
const editRoom = page.getByRole("button", { name: /Edit room/i });
if ((await editRoom.count()) > 0) {
  await editRoom.first().click();
  await page.waitForTimeout(600);
  const roomEditOn = await page.getByRole("button", { name: /End room edit/i }).isVisible().catch(() => false);
  report.interactions.editRoom = { entered: roomEditOn };
  if (!roomEditOn) issue("warn", "EDIT_ROOM_FAIL", "Edit room did not show End room edit button");
  const endBtn = page.getByRole("button", { name: /End room edit/i });
  if ((await endBtn.count()) > 0) await endBtn.first().click();
} else {
  issue("info", "EDIT_ROOM_BTN_ABSENT", "Edit room button not found");
}

// Catalog tab
const libTab = page.getByRole("tab", { name: "Library" });
if ((await libTab.count()) > 0) {
  await libTab.click();
  await page.waitForTimeout(500);
  const catalogItems = await page.locator(".pw-catalog-item, [data-catalog-item], .catalog-panel button").count();
  report.interactions.catalog = { libraryTab: true, itemCount: catalogItems };
  await page.screenshot({ path: `${OUT}/viewport-catalog.png`, fullPage: false });
}

// HTTP / console summary
if (report.httpErrors.length) {
  const unique = [...new Map(report.httpErrors.map((e) => [e.url, e])).values()];
  issue("warn", "HTTP_ERRORS", `${unique.length} unique HTTP error(s)`, { errors: unique.slice(0, 8) });
}
if (report.consoleErrors.length) {
  const unique = [...new Set(report.consoleErrors)];
  issue("warn", "CONSOLE_ERRORS", `${unique.length} console error(s)`, { samples: unique.slice(0, 6) });
}

report.summary = {
  issueCount: report.issues.length,
  critical: report.issues.filter((i) => i.severity === "critical").length,
  error: report.issues.filter((i) => i.severity === "error").length,
  warn: report.issues.filter((i) => i.severity === "warn").length,
  screenshots: OUT,
};

console.log(JSON.stringify(report, null, 2));
await browser.close();