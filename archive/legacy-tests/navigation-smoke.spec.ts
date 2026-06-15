import { expect, test } from "@playwright/test";

test("planner landing opens the planner canvas", async ({ page }) => {
  await page.goto("/planner");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Design floors/i);
  await page.getByRole("link", { name: /Open planner/i }).click();
  await expect(page).toHaveURL(/\/planner\/canvas\/?$/);
  await expect(page.locator("canvas")).toBeVisible();
});
