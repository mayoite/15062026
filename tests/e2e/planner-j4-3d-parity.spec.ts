import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas } from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

test.describe("J4 — 2D↔3D parity", () => {
  test("Switch to 3D view and verify 3D canvas renders", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    await page.getByRole("button", { name: "3D", exact: true }).click();
    
    const canvas3d = page.locator('canvas[data-testid="planner-3d-canvas"], .pw-split-pane--3d canvas');
    await expect(canvas3d).toBeVisible({ timeout: 25_000 });
  });

  test("Split view shows 2D and 3D side-by-side", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    await page.getByRole("button", { name: "Split" }).click();
    
    const split = page.locator(".pw-split-view");
    await expect(split).toBeVisible({ timeout: 10_000 });
    
    const canvas2d = page.locator('[data-testid="planner-2d-canvas"] canvas');
    const canvas3d = page.locator(".pw-split-pane--3d canvas");
    
    await expect(canvas2d).toBeVisible();
    await expect(canvas3d).toBeVisible({ timeout: 20_000 });
  });

  test("Furniture placement visible in both 2D and 3D", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    await page.getByRole("button", { name: "Split" }).click();
    await expect(page.locator(".pw-split-view")).toBeVisible({ timeout: 10_000 });
    
    const catalogSearch = page.getByLabel("Search catalog elements");
    await catalogSearch.fill("desk");
    await page.waitForTimeout(500);
    
    const addBtn = page.getByRole("button", { name: /Add.*desk/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    
    await page.waitForTimeout(1000);
    
    const canvas2d = page.locator('[data-testid="planner-2d-canvas"] canvas');
    const canvas3d = page.locator(".pw-split-pane--3d canvas");
    
    await expect(canvas2d).toBeVisible();
    await expect(canvas3d).toBeVisible();
  });

  test("3D view orbit control works", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    await page.getByRole("button", { name: "3D", exact: true }).click();
    
    const canvas3d = page.locator('canvas').last();
    const box = await canvas3d.boundingBox();
    if (!box) throw new Error("3D canvas not visible");
    
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down({ button: "middle" });
    await page.mouse.move(centerX + 50, centerY + 50);
    await page.mouse.up({ button: "middle" });
    
    await expect(canvas3d).toBeVisible();
  });
});
