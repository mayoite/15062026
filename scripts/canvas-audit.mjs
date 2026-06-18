/**
 * Comprehensive Playwright audit of the planner canvas at /planner/guest/
 * Outputs structured JSON report to stdout and screenshots/canvas-audit.png
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const URL = "http://localhost:3000/planner/guest/?plannerDevTools=1&_audit=" + Date.now();
const SCREENSHOT = "screenshots/canvas-audit.png";

fs.mkdirSync("screenshots", { recursive: true });

const report = {
  timestamp: new Date().toISOString(),
  url: URL,
  viewport: { width: 1440, height: 900 },
  onboarding: {},
  diagnostics: {},
  tests: {},
  toolbars: {},
  consoleErrors: [],
  issues: [],
};

function addIssue(severity, code, message, evidence = {}) {
  report.issues.push({ severity, code, message, evidence });
}

function getObjectCount() {
  try {
    const fn = window.__fabricExportDraft;
    if (typeof fn !== "function") return { count: null, error: "no __fabricExportDraft" };
    const raw = fn();
    if (!raw) return { count: 0, error: null };
    const parsed = JSON.parse(raw);
    return { count: parsed.objects?.length ?? 0, error: null };
  } catch (e) {
    return { count: null, error: String(e?.message ?? e) };
  }
}

function collectDiagnostics() {
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  };

  const readObjectCount = () => {
    try {
      const fn = window.__fabricExportDraft;
      if (typeof fn !== "function") return { count: null, error: "no __fabricExportDraft" };
      const raw = fn();
      if (!raw) return { count: 0, error: null };
      const parsed = JSON.parse(raw);
      return { count: parsed.objects?.length ?? 0, error: null };
    } catch (e) {
      return { count: null, error: String(e?.message ?? e) };
    }
  };

  const canvas = document.querySelector("#main");
  const canvasRect = canvas?.getBoundingClientRect();
  const centerEl = canvasRect
    ? document.elementFromPoint(
        canvasRect.left + canvasRect.width / 2,
        canvasRect.top + canvasRect.height / 2,
      )
    : null;

  const grid = document.querySelector(".fcw-workspace-grid");
  const stage = document.querySelector(".fcw-stage-card");
  const pane2d = document.querySelector(".pw-view-stack__pane--2d");
  const chrome = document.querySelector(".pw-canvas-chrome-layer");
  const zoomEl = document.querySelector(".zoom-control span");

  const objResult = readObjectCount();

  return {
    canvas: rect(canvas),
    elementAtCenter: centerEl
      ? {
          tag: centerEl.tagName,
          id: centerEl.id || null,
          cls: (centerEl.className?.toString?.() ?? "").slice(0, 120),
        }
      : null,
    fcwWorkspaceGrid: rect(grid),
    stage: stage
      ? { clientW: stage.clientWidth, clientH: stage.clientHeight, rect: rect(stage) }
      : null,
    pane2d: pane2d
      ? {
          dataActive: pane2d.getAttribute("data-active"),
          pointerEvents: getComputedStyle(pane2d).pointerEvents,
          visibility: getComputedStyle(pane2d).visibility,
          opacity: getComputedStyle(pane2d).opacity,
        }
      : null,
    chromeLayer: chrome
      ? {
          pointerEvents: getComputedStyle(chrome).pointerEvents,
          rect: rect(chrome),
        }
      : null,
    zoomText: zoomEl?.textContent?.trim() ?? null,
    objectCount: objResult.count,
    objectCountError: objResult.error,
    hasFabricExport: typeof window.__fabricExportDraft === "function",
    hasFloorplanCtx: typeof window.__floorplanCtx !== "undefined",
    workspaceVisible: !!document.querySelector(".pw-workspace"),
    mainCanvasPresent: !!canvas,
  };
}

function collectToolbarStats() {
  const subtopbars = Array.from(document.querySelectorAll(".pw-subtopbar")).map((el, i) => ({
    index: i,
    classes: el.className,
    visible: el.offsetParent !== null,
    ariaHidden: el.getAttribute("aria-hidden"),
    rect: {
      w: Math.round(el.getBoundingClientRect().width),
      h: Math.round(el.getBoundingClientRect().height),
    },
  }));
  const fcwToolbars = Array.from(document.querySelectorAll(".fcw-toolbar")).map((el, i) => ({
    index: i,
    classes: el.className,
    visible: el.offsetParent !== null,
    ariaLabel: el.getAttribute("aria-label"),
  }));
  return {
    pwSubtopbarCount: document.querySelectorAll(".pw-subtopbar").length,
    fcwToolbarCount: document.querySelectorAll(".fcw-toolbar").length,
    visibleSubtopbars: subtopbars.filter((t) => t.visible).length,
    visibleFcwToolbars: fcwToolbars.filter((t) => t.visible).length,
    subtopbars,
    fcwToolbars,
  };
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: report.viewport });
const page = await context.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") {
    report.consoleErrors.push({
      type: "console.error",
      text: msg.text().slice(0, 500),
    });
  }
});
page.on("pageerror", (err) => {
  report.consoleErrors.push({
    type: "pageerror",
    text: err.message.slice(0, 500),
  });
});
page.on("response", (response) => {
  if (response.status() >= 400) {
    report.consoleErrors.push({
      type: "http",
      status: response.status(),
      url: response.url().slice(0, 400),
    });
  }
});

try {
  // Fresh guest session — clear planner localStorage before app scripts run
  await context.addInitScript(() => {
    try {
      const keys = Object.keys(localStorage).filter(
        (k) => k.includes("planner") || k.includes("guest") || k.includes("project-setup"),
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });

  // Step 1: Guest onboarding — wait for setup form OR workspace
  const projectNameInput = page.locator("#project-setup-name");
  const workspace = page.locator(".pw-workspace");

  await Promise.race([
    projectNameInput.waitFor({ state: "visible", timeout: 60000 }),
    workspace.waitFor({ state: "visible", timeout: 60000 }),
  ]).catch(() => {});

  const setupVisible = await projectNameInput.isVisible().catch(() => false);
  report.onboarding.setupGateVisible = setupVisible;

  if (setupVisible) {
    await projectNameInput.fill("Canvas audit");
    await page.getByRole("button", { name: /Start placing furniture/i }).click();
    report.onboarding.projectName = "Canvas audit";
    report.onboarding.submitted = true;
    await page.waitForTimeout(1000);
  } else {
    const wsAlready = await workspace.isVisible().catch(() => false);
    report.onboarding.submitted = false;
    if (!wsAlready) {
      addIssue("warn", "ONBOARDING_SKIPPED", "Neither setup form nor workspace visible after initial wait");
    } else {
      report.onboarding.note = "Workspace already loaded (cached session)";
    }
  }

  // Step 2: Wait for workspace and main canvas
  try {
    await page.waitForSelector(".pw-workspace", { timeout: 60000 });
    await page.waitForSelector("#main", { timeout: 30000 });
    report.onboarding.workspaceReady = true;
  } catch (e) {
    report.onboarding.workspaceReady = false;
    addIssue("critical", "WORKSPACE_NOT_READY", "Failed to load .pw-workspace or #main canvas", {
      error: String(e?.message ?? e),
    });
  }

  // Dismiss coach / preset overlays if present
  const presetBtn = page.getByRole("button", { name: /rectangular|square|l-shaped|skip/i }).first();
  if ((await presetBtn.count()) > 0) {
    await presetBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    report.onboarding.presetDismissed = true;
  }
  const coachNext = page.getByRole("button", { name: /^next$/i }).first();
  if ((await coachNext.count()) > 0) {
    await coachNext.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(2000);

  // Ensure 2D view
  const btn2d = page.locator(".pw-segment-btn", { hasText: "2D" });
  if ((await btn2d.count()) > 0) {
    await btn2d.click().catch(() => {});
    await page.waitForTimeout(1000);
  }

  // Step 3: Collect diagnostics
  report.diagnostics = await page.evaluate(collectDiagnostics);

  if (!report.diagnostics.mainCanvasPresent) {
    addIssue("critical", "CANVAS_MISSING", "#main canvas element not found");
  }
  if (!report.diagnostics.hasFabricExport) {
    addIssue("critical", "FABRIC_API_MISSING", "window.__fabricExportDraft is not available");
  }
  if (report.diagnostics.canvas && (report.diagnostics.canvas.w < 10 || report.diagnostics.canvas.h < 10)) {
    addIssue("critical", "CANVAS_ZERO_SIZE", "Canvas has near-zero dimensions", {
      canvas: report.diagnostics.canvas,
    });
  }
  if (
    report.diagnostics.canvas &&
    report.diagnostics.stage?.rect &&
    report.diagnostics.canvas.w > report.diagnostics.stage.rect.w * 1.2
  ) {
    addIssue("warn", "CANVAS_WIDER_THAN_STAGE", "Fabric canvas width exceeds stage card — possible scaling/overflow issue", {
      canvasW: report.diagnostics.canvas.w,
      stageW: report.diagnostics.stage.rect.w,
    });
  }
  if (
    report.diagnostics.elementAtCenter &&
    report.diagnostics.elementAtCenter.id !== "main" &&
    !report.diagnostics.elementAtCenter.cls?.includes("canvas")
  ) {
    const el = report.diagnostics.elementAtCenter;
    const blocking =
      el.cls?.includes("pw-empty") ||
      el.cls?.includes("pw-canvas-chrome") ||
      el.tag === "DIV";
    if (blocking) {
      addIssue("warn", "CENTER_NOT_CANVAS", "elementFromPoint at canvas center is not the fabric canvas", {
        elementAtCenter: el,
      });
    }
  }
  if (report.diagnostics.pane2d?.dataActive !== "true") {
    addIssue("warn", "PANE2D_INACTIVE", "2D pane is not marked data-active=true", {
      pane2d: report.diagnostics.pane2d,
    });
  }
  if (report.diagnostics.pane2d?.pointerEvents === "none") {
    addIssue("warn", "PANE2D_NO_POINTER", "2D pane has pointer-events:none — clicks may not reach canvas", {
      pane2d: report.diagnostics.pane2d,
    });
  }
  if (report.diagnostics.chromeLayer?.pointerEvents === "auto") {
    addIssue("info", "CHROME_CAPTURES_POINTER", "Chrome layer has pointer-events:auto — may intercept canvas clicks", {
      chromeLayer: report.diagnostics.chromeLayer,
    });
  }

  const baselineObjects = report.diagnostics.objectCount ?? 0;
  report.tests.baselineObjectCount = baselineObjects;

  const canvasBox = await page.locator("#main").boundingBox();
  report.diagnostics.canvasBoundingBoxPlaywright = canvasBox
    ? {
        x: Math.round(canvasBox.x),
        y: Math.round(canvasBox.y),
        w: Math.round(canvasBox.width),
        h: Math.round(canvasBox.height),
      }
    : null;

  if (!canvasBox || canvasBox.width < 10 || canvasBox.height < 10) {
    addIssue("critical", "CANVAS_NO_BOUNDING_BOX", "Playwright could not get usable bounding box for #main", {
      canvasBox,
    });
  }

  // Step 4: Line tool draw test
  const lineBtn = page.locator('button[title="Line"]');
  const lineBtnCount = await lineBtn.count();
  report.tests.lineTool = { buttonFound: lineBtnCount > 0, buttonCount: lineBtnCount };

  if (lineBtnCount > 0 && canvasBox?.width > 10) {
    await lineBtn.first().click();
    await page.waitForTimeout(300);
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.3, canvasBox.y + canvasBox.height * 0.35);
    await page.mouse.down();
    await page.mouse.move(canvasBox.x + canvasBox.width * 0.7, canvasBox.y + canvasBox.height * 0.55);
    await page.mouse.up();
    await page.waitForTimeout(1000);

    const afterLine = await page.evaluate(getObjectCount);
    report.tests.lineTool.objectsBefore = baselineObjects;
    report.tests.lineTool.objectsAfter = afterLine.count;
    report.tests.lineTool.delta = (afterLine.count ?? 0) - baselineObjects;
    report.tests.lineTool.drawAttempted = true;

    if (afterLine.error) {
      addIssue("error", "LINE_DRAW_EXPORT_FAIL", "Could not read object count after line draw", {
        error: afterLine.error,
      });
    } else if (report.tests.lineTool.delta <= 0) {
      addIssue("error", "LINE_DRAW_NO_OBJECT", "Line tool draw did not increase object count", {
        before: baselineObjects,
        after: afterLine.count,
        elementAtCenter: report.diagnostics.elementAtCenter,
        pane2d: report.diagnostics.pane2d,
      });
    }
  } else {
    report.tests.lineTool.drawAttempted = false;
    if (lineBtnCount === 0) {
      addIssue("error", "LINE_TOOL_MISSING", "Line tool button not found in toolbar");
    }
  }

  // Step 5: Select tool click test
  const selectBtn = page.locator('button[title="Select"]');
  const selectBtnCount = await selectBtn.count();
  report.tests.selectTool = { buttonFound: selectBtnCount > 0, buttonCount: selectBtnCount };

  if (selectBtnCount > 0) {
    await selectBtn.first().click();
    await page.waitForTimeout(300);
    if (canvasBox?.width > 10) {
      await page.mouse.click(canvasBox.x + canvasBox.width * 0.5, canvasBox.y + canvasBox.height * 0.5);
      await page.waitForTimeout(500);
      const selectionState = await page.evaluate(() => {
        const ctx = window.__floorplanCtx;
        return {
          hasCtx: !!ctx,
          selectionsLength: ctx?.selections?.length ?? null,
          drawTool: ctx?.drawTool ?? null,
          roomEdit: ctx?.roomEdit ?? null,
        };
      });
      report.tests.selectTool.clickAttempted = true;
      report.tests.selectTool.selectionState = selectionState;
      if (!selectionState.hasCtx) {
        addIssue("warn", "FLOORPLAN_CTX_MISSING", "window.__floorplanCtx not exposed for selection inspection");
      }
    }
  } else {
    addIssue("error", "SELECT_TOOL_MISSING", "Select tool button not found");
  }

  // Step 6: Edit room button + wall click
  const editRoomBtn = page.getByRole("button", { name: /Edit room/i });
  const editRoomCount = await editRoomBtn.count();
  report.tests.editRoom = { buttonFound: editRoomCount > 0, buttonCount: editRoomCount };

  if (editRoomCount > 0) {
    await editRoomBtn.first().click();
    await page.waitForTimeout(800);

    const roomEditState = await page.evaluate(() => {
      const endRoomEdit = Array.from(document.querySelectorAll("button")).find((b) =>
        /end room edit/i.test(b.textContent ?? ""),
      );
      const roomToolbar = document.querySelector('[aria-label="Room edit tools"]');
      const ctx = window.__floorplanCtx;
      return {
        endRoomEditVisible: !!endRoomEdit,
        roomToolbarVisible: !!roomToolbar && roomToolbar.offsetParent !== null,
        ctxRoomEdit: ctx?.roomEdit ?? null,
      };
    });
    report.tests.editRoom.entered = roomEditState.endRoomEditVisible || roomEditState.roomToolbarVisible;
    report.tests.editRoom.state = roomEditState;

    if (!report.tests.editRoom.entered) {
      addIssue("warn", "EDIT_ROOM_NOT_ENTERED", "Edit room click did not show room edit toolbar", {
        state: roomEditState,
      });
    }

    if (canvasBox?.width > 10) {
      await page.mouse.click(canvasBox.x + canvasBox.width * 0.4, canvasBox.y + canvasBox.height * 0.2);
      await page.waitForTimeout(500);
      const afterWallClick = await page.evaluate(getObjectCount);
      report.tests.editRoom.wallClickAttempted = true;
      report.tests.editRoom.objectsAfterWallClick = afterWallClick.count;
    }

    // Exit room edit if possible
    const endEditBtn = page.getByRole("button", { name: /End room edit/i });
    if ((await endEditBtn.count()) > 0) {
      await endEditBtn.first().click();
      await page.waitForTimeout(500);
    }
  } else {
    addIssue("info", "EDIT_ROOM_ABSENT", "Edit room button not present (toolbar may not be initialized)");
  }

  // Step 7: Catalog test
  const leftPanel = page.locator(".pw-left-panel");
  const libraryTab = page.getByRole("tab", { name: "Library" });
  report.tests.catalog = {};

  const leftPanelState = await page.evaluate(() => {
    const panel = document.querySelector(".pw-left-panel");
    const activeTab = panel?.querySelector(".pw-panel-body")?.getAttribute("data-active-tab");
    return {
      leftPanelOpen: panel?.getAttribute("data-open") === "true",
      leftPanelVisible: !!panel && panel.getBoundingClientRect().width > 40,
      activeTab,
      cardCount: document.querySelectorAll(".pw-catalog-card").length,
      visibleCards: Array.from(document.querySelectorAll(".pw-catalog-card")).filter(
        (el) => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0,
      ).length,
      hasFabricPlace: typeof window.__fabricPlaceCatalog === "function",
      plannerStep: panel?.getAttribute("data-step") ?? null,
    };
  });
  report.tests.catalog.leftPanel = leftPanelState;

  if ((await libraryTab.count()) > 0) {
    await libraryTab.click();
    await page.waitForTimeout(800);
  }

  const libraryBtn = page.getByRole("button", { name: /Open library/i });
  if (!(await leftPanel.isVisible().catch(() => false)) && (await libraryBtn.count()) > 0) {
    await libraryBtn.first().click();
    await page.waitForTimeout(1000);
  }

  const addBtn = page.getByRole("button", { name: /Add .* to canvas/i }).first();
  const cardCount = await page.locator(".pw-catalog-card").count();
  report.tests.catalog.cardCount = cardCount;
  report.tests.catalog.addButtonVisible = await addBtn.isVisible().catch(() => false);

  const objectsBeforeCatalog = await page.evaluate(getObjectCount);
  report.tests.catalog.objectsBefore = objectsBeforeCatalog.count;

  if (report.tests.catalog.addButtonVisible) {
    const cardLabel = await addBtn.getAttribute("aria-label");
    await addBtn.click();
    await page.waitForTimeout(1200);
    const objectsAfterCatalog = await page.evaluate(getObjectCount);
    report.tests.catalog.objectsAfter = objectsAfterCatalog.count;
    report.tests.catalog.delta = (objectsAfterCatalog.count ?? 0) - (objectsBeforeCatalog.count ?? 0);
    report.tests.catalog.cardClicked = true;
    report.tests.catalog.clickedCard = cardLabel;

    if (objectsAfterCatalog.error) {
      addIssue("error", "CATALOG_EXPORT_FAIL", "Could not read object count after catalog click", {
        error: objectsAfterCatalog.error,
      });
    } else if (report.tests.catalog.delta <= 0) {
      addIssue("error", "CATALOG_NO_PLACEMENT", "Clicking catalog add button did not increase object count", {
        before: objectsBeforeCatalog.count,
        after: objectsAfterCatalog.count,
        clickedCard: cardLabel,
        hasFabricPlace: leftPanelState.hasFabricPlace,
        plannerStep: leftPanelState.plannerStep,
      });
    }
  } else if (cardCount > 0) {
    report.tests.catalog.cardClicked = false;
    addIssue("warn", "CATALOG_CARD_NOT_VISIBLE", "Catalog cards exist in DOM but no visible add button found", {
      cardCount,
      leftPanel: leftPanelState,
    });
  } else {
    report.tests.catalog.cardClicked = false;
    addIssue("warn", "CATALOG_EMPTY", "No .pw-catalog-card elements found in library panel");
  }

  if (!leftPanelState.hasFabricPlace) {
    addIssue("warn", "FABRIC_PLACE_API_MISSING", "window.__fabricPlaceCatalog not available for catalog placement");
  }

  // Step 8: Duplicate toolbar check
  report.toolbars = await page.evaluate(collectToolbarStats);

  if (report.toolbars.pwSubtopbarCount > 3) {
    addIssue("warn", "DUPLICATE_SUBTOPBARS", "More than expected .pw-subtopbar elements", {
      count: report.toolbars.pwSubtopbarCount,
      subtopbars: report.toolbars.subtopbars,
    });
  }
  if (report.toolbars.visibleFcwToolbars > 1) {
    addIssue("error", "DUPLICATE_FCW_TOOLBARS", "Multiple visible .fcw-toolbar instances", {
      count: report.toolbars.fcwToolbarCount,
      visible: report.toolbars.visibleFcwToolbars,
      fcwToolbars: report.toolbars.fcwToolbars,
    });
  }
  const visibleFabricSubtopbars = report.toolbars.subtopbars.filter(
    (t) => t.visible && t.classes.includes("pw-subtopbar--fabric"),
  );
  if (visibleFabricSubtopbars.length > 1) {
    addIssue("error", "DUPLICATE_FABRIC_SUBTOPBAR", "Multiple visible fabric subtopbars", {
      visibleFabricSubtopbars,
    });
  }

  // Console / network errors
  const httpErrors = report.consoleErrors.filter((e) => e.type === "http");
  const runtimeErrors = report.consoleErrors.filter((e) => e.type !== "http");
  report.httpErrors = httpErrors;
  report.runtimeErrors = runtimeErrors;

  if (runtimeErrors.length > 0) {
    addIssue("error", "CONSOLE_ERRORS", `${runtimeErrors.length} console/page error(s) during session`, {
      errors: runtimeErrors.slice(0, 15),
    });
  }
  if (httpErrors.length > 0) {
    addIssue("warn", "HTTP_ERRORS", `${httpErrors.length} HTTP 4xx/5xx response(s) during session`, {
      errors: httpErrors.slice(0, 15),
    });
  }

  // Step 9: Screenshot
  await page.screenshot({ path: SCREENSHOT, fullPage: false });
  report.screenshot = path.resolve(SCREENSHOT);

  report.summary = {
    issueCount: report.issues.length,
    critical: report.issues.filter((i) => i.severity === "critical").length,
    error: report.issues.filter((i) => i.severity === "error").length,
    warn: report.issues.filter((i) => i.severity === "warn").length,
    info: report.issues.filter((i) => i.severity === "info").length,
    passedChecks:
      report.onboarding.workspaceReady &&
      report.diagnostics.hasFabricExport &&
      (report.tests.lineTool.delta > 0 || report.tests.lineTool.drawAttempted === false),
  };
} catch (err) {
  addIssue("critical", "AUDIT_CRASH", "Audit script threw an unhandled error", {
    error: String(err?.message ?? err),
    stack: err?.stack?.slice(0, 500),
  });
  try {
    await page.screenshot({ path: SCREENSHOT });
    report.screenshot = path.resolve(SCREENSHOT);
  } catch {
    /* ignore */
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(report, null, 2));