import { expect, test } from "@playwright/test";

test("planner catalog route redirects unauthenticated visitors to access", async ({ page }) => {
  await page.goto("/admin/planner-catalog");

  await expect(page).toHaveURL(/\/access\/\?next=%2Fadmin%2Fplanner-catalog%2F?/);
  await expect(page.getByRole("heading", { level: 2 })).toContainText(/Welcome to Oando/i);
  await expect(page.getByText(/Continue as Guest/i)).toBeVisible();
});
