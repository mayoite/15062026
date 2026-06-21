import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { getObjectCount, waitForPlannerCanvas, dragOnCanvas, selectPlannerTool } from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 60_000 });

test.describe("J6 — Member document restore", () => {
  test("Guest workspace can be revisited with same object count", async ({ page, context }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const before = await getObjectCount(page);
    
    await selectPlannerTool(page, "Wall");
    await dragOnCanvas(page, { rx: 0.25, ry: 0.4 }, { rx: 0.75, ry: 0.6 });
    
    const after = await getObjectCount(page);
    expect(after).toBeGreaterThan(before);
    
    const url = page.url();
    
    const newPage = await context.newPage();
    await newPage.goto(url);
    await waitForPlannerCanvas(newPage);
    
    const restored = await getObjectCount(newPage);
    expect(restored).toBe(after);
    
    await newPage.close();
  });

  test("Canvas not blank after tab navigation and return", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const before = await getObjectCount(page);
    expect(before).toBeGreaterThan(0);
    
    await page.getByRole("button", { name: "2D", exact: true }).click();
    await page.waitForTimeout(500);
    
    const after = await getObjectCount(page);
    expect(after).toBe(before);
  });

  test("Object count persists across view mode changes", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const initial = await getObjectCount(page);
    
    await page.getByRole("button", { name: "Split" }).click();
    await page.waitForTimeout(1000);
    
    const split = await getObjectCount(page);
    expect(split).toBe(initial);
    
    await page.getByRole("button", { name: "3D", exact: true }).click();
    await page.waitForTimeout(1000);
    
    await page.getByRole("button", { name: "2D", exact: true }).click();
    await page.waitForTimeout(1000);
    
    const final = await getObjectCount(page);
    expect(final).toBe(initial);
  });
});
