import { expect, test } from "@playwright/test";

test("planner canvas renders in guest mode", async ({ page }) => {
  await page.goto("/planner/canvas");

  await expect(page.locator("canvas")).toBeVisible();
});
