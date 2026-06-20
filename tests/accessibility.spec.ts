import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility baseline", () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to ensure a fresh guest state
    await page.addInitScript(() => {
      const plannerPrefixes = [
        "cad-suite:planner:",
        "oando-project-setup-complete-",
        "planner-",
      ];
      for (const key of Object.keys(localStorage)) {
        if (plannerPrefixes.some((prefix) => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }
      void indexedDB.deleteDatabase("planner-workspace-db");
      void indexedDB.deleteDatabase("buddy-planner-db");
    });
  });

  test("should not have any automatically detectable accessibility issues in guest planner", async ({ page }) => {
    // Navigate and enter workspace
    await page.goto("/planner/guest/?plannerDevTools=1", { waitUntil: "domcontentloaded" });
    const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
    if (await setupHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
      await page.getByLabel("Project name").fill("A11y Test");
      await page.getByRole("button", { name: /Start placing furniture/i }).click();
    }
    await expect(page.locator(".pw-topbar")).toBeVisible({ timeout: 25000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any accessibility issues in export modal", async ({ page }) => {
    // Navigate and enter workspace
    await page.goto("/planner/guest/?plannerDevTools=1", { waitUntil: "domcontentloaded" });
    const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
    if (await setupHeading.isVisible({ timeout: 10000 }).catch(() => false)) {
      await page.getByLabel("Project name").fill("A11y Test");
      await page.getByRole("button", { name: /Start placing furniture/i }).click();
    }
    await expect(page.locator(".pw-topbar")).toBeVisible({ timeout: 25000 });

    // Open export modal
    await page.getByRole("button", { name: "Open Export" }).click();
    await expect(page.getByRole("dialog", { name: /Export Plan/i })).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
