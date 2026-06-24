import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { enterGuestPlannerWorkspace } from "./e2e/guestProjectSetup";

test.describe("Accessibility baseline", () => {
  test("should not have any automatically detectable accessibility issues in guest planner", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "A11y Test" });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should not have any accessibility issues in export modal", async ({ page }) => {
    await enterGuestPlannerWorkspace(page, { projectName: "A11y Test" });

    // Open export modal
    await page.getByRole("button", { name: /^Export$/ }).click();
    await expect(page.getByRole("dialog", { name: /Export Plan/i })).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
