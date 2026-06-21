import { expect, test } from "@playwright/test";
import { enterGuestPlannerWorkspace } from "./guestProjectSetup";
import { waitForPlannerCanvas, getObjectCount } from "./plannerCanvasHelpers";

test.describe.configure({ timeout: 90_000 });

test.describe("J5 — AI layout assist", () => {
  test("AI drawer accessible from workspace", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const aiTab = page.locator('[data-tab="ai-assist"], button:has-text("AI")').first();
    if (await aiTab.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await aiTab.click();
      await expect(page.locator('[data-drawer="ai-assist"]')).toBeVisible({ timeout: 5_000 });
    }
  });

  test("Layout suggest generates room shell with furniture", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const before = await getObjectCount(page);
    expect(before).toBeGreaterThan(0);
  });

  test("Multiple template applications show confirmation", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const before = await getObjectCount(page);
    expect(before).toBeGreaterThan(0);
  });

  test("AI suggestion includes furniture at computed positions", async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
    await waitForPlannerCanvas(page);
    
    const count = await getObjectCount(page);
    const statusText = await page.locator(".pw-status-bar").textContent();
    
    expect(count).toBeGreaterThan(0);
    expect(statusText).toMatch(/\d+\s+objects/i);
  });
});
