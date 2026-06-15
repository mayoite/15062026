import { expect, test } from "@playwright/test";

test("planner login page renders the member access surface", async ({ page }) => {
  await page.goto("/oando-planner/login");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /Sign in to open Planner member mode/i,
  );
  await expect(page.getByText(/Planner Member Access/i)).toBeVisible();
});
