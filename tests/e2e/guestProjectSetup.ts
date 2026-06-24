import { expect, type Page } from "@playwright/test";

/**
 * Clears all planner-owned browser storage (localStorage + IndexedDB).
 * Scoped to planner keys only — does NOT clear auth tokens or unrelated keys.
 *
 * localStorage prefixes cleared:
 *   - "cad-suite:planner:"          (draft envelopes)
 *   - "oando-project-setup-complete-" (setup gate completion flag)
 *   - "planner-"                    (chrome layout, preferences, claimed flag, migration flag)
 *
 * IndexedDB databases deleted:
 *   - "planner-workspace-db"        (autosave projects + history)
 *   - "buddy-planner-db"            (legacy — migrated on first open)
 *
 * Call inside page.addInitScript so it runs before any app code.
 */
export async function clearPlannerStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const plannerPrefixes = [
      "cad-suite:planner:",
      "oando-project-setup-complete-",
      "planner-",
    ];
    for (const key of Object.keys(localStorage)) {
      if (plannerPrefixes.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    }
    void indexedDB.deleteDatabase("planner-workspace-db");
    void indexedDB.deleteDatabase("buddy-planner-db");
  });
}

/** Complete the guest project setup gate when it appears (fresh session). */
export async function enterGuestPlannerWorkspace(
  page: Page,
  options: { projectName?: string; navigate?: boolean; preservePlannerState?: boolean } = {},
): Promise<void> {
  if (!options.preservePlannerState) {
    await clearPlannerStorage(page);
  }
  if (options.navigate !== false) {
    await page.goto("/planner/guest/?plannerDevTools=1", { waitUntil: "domcontentloaded" });
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

  const startFromScratchButton = page.getByRole("button", { name: /Start from Scratch/i });
  if (await startFromScratchButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await startFromScratchButton.click();
  }

  await expect(topbar).toBeVisible({ timeout: 25_000 });
}
