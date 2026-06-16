import { expect, test } from "@playwright/test";

import { enterGuestPlannerWorkspace } from "./guestProjectSetup";

test.describe.configure({ mode: "serial" });

test.describe("Planner guest workspace — plan 06 UI bar", () => {
  test.beforeEach(async ({ page }) => {
    await enterGuestPlannerWorkspace(page);
  });

  test("loads canvas chrome with history, view modes, and catalog", async ({ page }) => {
    await expect(page.getByRole("group", { name: "Canvas history" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "2D", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Split" })).toBeVisible();
    await expect(page.getByRole("button", { name: "3D", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Open library and blueprint panel" }).click();
    await expect(page.getByLabel("Search catalog elements")).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
  });

  test("empty canvas shows RoomSketcher-style starter actions", async ({ page }) => {
    await page.getByRole("button", { name: "2D", exact: true }).click();
    await page.getByRole("button", { name: "Select" }).click();
    await expect(page.getByRole("region", { name: "Empty canvas guidance" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Draw walls" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Use template" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Import blueprint" })).toBeVisible();
  });

  test("catalog search filters elements", async ({ page }) => {
    await page.getByRole("button", { name: "Open library and blueprint panel" }).click();
    const search = page.getByLabel("Search catalog elements");
    await search.fill("meeting");
    await expect(page.getByRole("button", { name: /Add .* to canvas/i }).first()).toBeVisible();
    await search.fill("zzzznotfound");
    await expect(page.getByText(/No elements found/i)).toBeVisible();
  });

  test("status bar shows plan metrics", async ({ page }) => {
    const statusBar = page.locator(".pw-status-bar");
    await expect(statusBar).toContainText(/objects/i);
    await expect(statusBar).toContainText(/Floor/i);
  });

  test("view mode toggles without error", async ({ page }) => {
    await page.getByRole("button", { name: "Split" }).click();
    await expect(page.locator(".pw-split-view")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator(".pw-split-pane--3d canvas")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "3D", exact: true }).click();
    await expect(page.locator(".pw-split-view")).toHaveCount(0);
    await expect(page.locator("canvas").first()).toBeVisible();

    await page.getByRole("button", { name: "2D", exact: true }).click();
    await expect(page.locator("canvas").first()).toBeVisible();
  });
});

test("planner landing exceeds generic benchmark proof points", async ({ page }) => {
  await page.goto("/planner/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Plan your office layout/i);
  await expect(page.locator(".planner-landing-hero-proof")).toContainText(/Furniture items ready to place/i);
});
