import { expect, type Page } from "@playwright/test";

/** Complete the guest project setup gate when it appears (fresh session). */
export async function enterGuestPlannerWorkspace(
  page: Page,
  options: { projectName?: string; navigate?: boolean } = {},
): Promise<void> {
  if (options.navigate !== false) {
    await page.goto("/planner/guest/", { waitUntil: "domcontentloaded" });
  }

  const setupHeading = page.getByRole("heading", { name: /Set up your space/i });
  const topbar = page.locator(".pw-topbar");

  await Promise.race([
    setupHeading.waitFor({ state: "visible", timeout: 25_000 }),
    topbar.waitFor({ state: "visible", timeout: 25_000 }),
  ]).catch(() => {});

  if (await setupHeading.isVisible()) {
    await page.getByLabel("Project name").fill(options.projectName ?? "E2E guest workspace");
    await page.getByRole("button", { name: /Start placing furniture/i }).click();
  }

  await expect(topbar).toBeVisible({ timeout: 25_000 });
}