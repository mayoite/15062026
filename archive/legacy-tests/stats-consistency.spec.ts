import { expect, test } from "@playwright/test";

test("planner hero proof cards stay consistent", async ({ page }) => {
  await page.goto("/planner");

  await expect(page.getByText(/14 catalog lines/i)).toBeVisible();
  await expect(page.getByText(/2D/i)).toBeVisible();
  await expect(page.getByText(/Millimetre canvas/i)).toBeVisible();
});
