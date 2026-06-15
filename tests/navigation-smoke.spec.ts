import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test("planner landing opens the planner canvas", async ({ page }) => {
  await page.goto("/planner");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your office layout/i);
  await page.locator("#planner-hero").getByRole("link", { name: /Start planning your office/i }).click();
  await page.waitForURL(/\/planner\/guest\/?$/, { timeout: 15_000 });
  await enterGuestPlannerWorkspace(page, { navigate: false });
  await expect(page.locator("canvas").first()).toBeVisible();
});