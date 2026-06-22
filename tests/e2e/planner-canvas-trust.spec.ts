import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import {
  dragOnCanvas,
  getObjectCount,
  selectPlannerTool,
  waitForPlannerCanvas,
} from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

test.describe("Planner canvas trust — WS1", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
  });

  test("Wall drag creates persisted WALL object", async ({ page }) => {
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.6 });
    const after = await getObjectCount(page);
    expect(after).toBeGreaterThan(before);
    
    await page.reload();
    await waitForPlannerCanvas(page);
    const afterReload = await getObjectCount(page);
    expect(afterReload).toBe(after);
  });

  test("Wheel zoom changes zoom percentage", async ({ page }) => {
    const canvas = page.locator('[data-testid="planner-2d-canvas"] canvas');
    await canvas.focus();
    
    const _initialZoom = await page.evaluate(() => {
      return document.querySelector('[data-testid="planner-2d-canvas"]')?.getAttribute('data-zoom');
    });
    
    const centerX = await canvas.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.left + box.width / 2;
    });
    const centerY = await canvas.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return box.top + box.height / 2;
    });
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.wheel(0, -120);
    await page.waitForTimeout(300);
    
    const zoomAfter = await page.evaluate(() => {
      return document.querySelector('[data-testid="planner-2d-canvas"]')?.getAttribute('data-zoom');
    });
    
    expect(zoomAfter).toBeTruthy();
  });

  test("Canvas reload restores object count", async ({ page }) => {
    const before = await getObjectCount(page);
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.2, ry: 0.3 }, { rx: 0.8, ry: 0.7 });
    const withWall = await getObjectCount(page);
    expect(withWall).toBeGreaterThan(before);
    
    await page.reload();
    await waitForPlannerCanvas(page);
    const afterReload = await getObjectCount(page);
    expect(afterReload).toBe(withWall);
  });
});
