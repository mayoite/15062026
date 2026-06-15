import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("planner landing has no critical accessibility violations", async ({ page }) => {
  await page.goto("/planner");

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
});
