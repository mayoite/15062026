import { expect, test } from "@playwright/test";

test("planner feature hub exposes the feature navigation surface", async ({ page }) => {
  await page.goto("/planner/features");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Everything in one workspace/i);
  await expect(page.getByRole("link", { name: /Trace your blueprint/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Furnish from catalog/i })).toBeVisible();
});
