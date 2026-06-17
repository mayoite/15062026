import { expect, test, type Page } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  clickOnCanvas,
  dragOnCanvas,
  expectObjectCountAtLeast,
  getObjectCount,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ mode: "serial", timeout: 60_000 });

async function openWorkspace(page: Page) {
  await enterGuestPlannerWorkspace(page);
  await waitForPlannerCanvas(page);
}

async function dragChromeHandle(page: Page, dockId: "tools" | "steps" | "access", deltaX: number, deltaY: number) {
  const handle = page.locator(`[data-dock-id="${dockId}"] .pw-dockable-chrome__handle`);
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`${dockId} chrome handle bounding box not found`);
  }

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 12 });
  await page.mouse.up();
}

test.describe("Planner chrome v1", () => {
  test("closed left panel opens from AccessChrome", async ({ page }) => {
    await openWorkspace(page);
    const leftPanel = page.locator(".pw-left-panel");
    const accessButton = page.getByRole("button", { name: "Open library and blueprint panel" });

    await expect(leftPanel).not.toHaveAttribute("data-open", "true");
    await accessButton.click();
    await expect(leftPanel).toHaveAttribute("data-open", "true");
  });

  test("closed right panel opens from AccessChrome", async ({ page }) => {
    await openWorkspace(page);
    const rightPanel = page.locator(".pw-right-panel");
    const accessButton = page.getByRole("button", { name: "Open properties panel" });

    await expect(rightPanel).not.toHaveAttribute("data-open", "true");
    await accessButton.click();
    await expect(rightPanel).toHaveAttribute("data-open", "true");
  });

  test("legacy v1 storage does not break v2 access defaults", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "planner-chrome-dock-v1",
        JSON.stringify({
          tools: { edge: "left", offset: 0.33 },
          steps: { edge: "top", offset: 0.66 },
          "panel-left": { edge: "left", offset: 0.12 },
        }),
      );
    });

    await openWorkspace(page);

    const accessWidget = page.locator('[data-dock-id="access"]');
    await expect(accessWidget).toBeVisible();
    await expect(page.getByRole("button", { name: "Open library and blueprint panel" })).toBeVisible();
  });

  test("access strip drag persists into v2 storage", async ({ page }) => {
    await openWorkspace(page);
    await dragChromeHandle(page, "access", 140, 60);

    await expect
      .poll(async () => page.evaluate(() => window.localStorage.getItem("planner-chrome-layout-v2")))
      .not.toBeNull();

    const layout = await page.evaluate(() => JSON.parse(window.localStorage.getItem("planner-chrome-layout-v2") ?? "{}"));
    expect(layout.version).toBe(2);
    expect(layout.placements?.access).toBeTruthy();
  });

  test("reset layout restores defaults after a moved widget", async ({ page }) => {
    await openWorkspace(page);
    await dragChromeHandle(page, "access", 180, 90);

    await page.getByRole("button", { name: "Reset planner chrome layout" }).click();

    await expect.poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem("planner-chrome-layout-v2"));
      return raw ? JSON.parse(raw).placements?.access : null;
    }).toEqual({ edge: "top", offset: 0.1 });
  });

  test("keyboard nudge updates access placement", async ({ page }) => {
    await openWorkspace(page);

    const handle = page.locator('[data-dock-id="access"] .pw-dockable-chrome__handle');
    await handle.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");

    await expect.poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem("planner-chrome-layout-v2"));
      return raw ? JSON.parse(raw).placements?.access?.offset : null;
    }).toBeGreaterThan(0.1);
  });

  test("left rail collapse preserves icon shortcuts and expand action", async ({ page }) => {
    await openWorkspace(page);

    await page.getByRole("button", { name: "Collapse left panel rail" }).click();
    const leftPanel = page.locator(".pw-left-panel");
    await expect(leftPanel).toHaveAttribute("data-collapsed", "true");

    await leftPanel.getByRole("tab", { name: "Library" }).dispatchEvent("click");
    await page.getByRole("button", { name: "Expand left panel rail" }).click();
    await expect(leftPanel).not.toHaveAttribute("data-collapsed", "true");
    await expect(leftPanel).toHaveAttribute("data-open", "true");
  });

  test("furniture tool opens the library and placed item appears in recents", async ({ page }) => {
    await openWorkspace(page);

    await selectPlannerTool(page, "Furniture");
    await expect(page.locator(".pw-left-panel")).toHaveAttribute("data-open", "true");
    await clickOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, 1);

    await page.reload({ waitUntil: "domcontentloaded" });
    await openWorkspace(page);
    await page.getByRole("button", { name: "Open library and blueprint panel" }).click();
    await page.locator(".pw-left-panel").getByRole("tab", { name: "Library" }).click();
    await expect(page.locator(".pw-catalog-recent")).toBeVisible();
  });

  test("selecting a planner shape opens the inspector outside Review", async ({ page }) => {
    await openWorkspace(page);

    await selectPlannerTool(page, "Furniture");
    await clickOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, 1);

    await selectPlannerTool(page, "Select");
    await clickOnCanvas(page, 0.45, 0.42);

    await expect(page.locator(".pw-right-panel")).toHaveAttribute("data-open", "true");
    await expect(page.locator(".pwx-inspector")).not.toContainText("Nothing selected");
  });

  test("view switching keeps chrome and renders a nonblank 3D scene", async ({ page }) => {
    await openWorkspace(page);

    await selectPlannerTool(page, "Furniture");
    await clickOnCanvas(page, 0.45, 0.42);
    await expectObjectCountAtLeast(page, 1);

    await dragChromeHandle(page, "tools", 0, 180);
    const beforeLayout = await page.evaluate(() => window.localStorage.getItem("planner-chrome-layout-v2"));

    await page.getByRole("button", { name: "Split" }).click();
    await expect(page.locator(".pw-split-view")).toBeVisible({ timeout: 10_000 });
    const viewer = page.locator('[data-testid="planner-3d-viewer"]');
    await expect(viewer).toHaveAttribute("data-webgl-status", "ready");
    await expect(viewer).toHaveAttribute("data-render-evidence", "ready", { timeout: 15_000 });
    await expect(viewer).toHaveAttribute("data-render-luma", /[1-9]\d*/);

    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator('[data-testid="planner-3d-renderer"]')).not.toContainText("Fallback mode");
    await page.getByRole("button", { name: "2D", exact: true }).click();
    await waitForPlannerCanvas(page);

    const afterLayout = await page.evaluate(() => window.localStorage.getItem("planner-chrome-layout-v2"));
    expect(afterLayout).toBe(beforeLayout);
  });
});

test.describe("Planner chrome WebGL fallback", () => {
  test("3D fallback keeps 2D planner usable when WebGL is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(type: string, ...args: unknown[]) {
        if (type === "webgl" || type === "webgl2") {
          return null;
        }
        return original.call(this, type, ...(args as []));
      };
    });

    await openWorkspace(page);
    const before = await getObjectCount(page);

    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator('[data-testid="planner-3d-fallback"]')).toBeVisible();

    await page.getByRole("button", { name: "2D", exact: true }).click();
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.5 }, { rx: 0.62, ry: 0.5 });
    await expectObjectCountAtLeast(page, before + 1);
  });
});
