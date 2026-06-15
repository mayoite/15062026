import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_ROOT = path.resolve(process.cwd(), "results", "screenshots", "playwright-nav");

const VIEWPORTS = {
  iphone: { width: 390, height: 844, label: "iPhone 14" },
  android: { width: 412, height: 915, label: "Pixel 7" },
  "tablet-portrait": { width: 768, height: 1024, label: "iPad portrait" },
  "tablet-landscape": { width: 1024, height: 768, label: "iPad landscape" },
  desktop: { width: 1280, height: 800, label: "Desktop" },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

function shotPath(viewport: ViewportKey, filename: string) {
  const dir = path.join(OUTPUT_ROOT, viewport);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, filename);
}

for (const [viewportKey, viewport] of Object.entries(VIEWPORTS) as [
  ViewportKey,
  (typeof VIEWPORTS)[ViewportKey],
][]) {
  test.describe(`site nav screenshots — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("01 homepage", async ({ page }) => {
      await page.goto("/");
      await page.locator("#home-hero").waitFor({ state: "visible" });
      const outPath = shotPath(viewportKey, "01-homepage.png");
      await page.screenshot({ path: outPath, fullPage: true });
      expect(fs.existsSync(outPath)).toBe(true);
    });

    test("02 products catalog", async ({ page }) => {
      await page.goto("/products");
      await page.getByRole("heading", { level: 1, name: /Workspace products/i }).waitFor();
      await page.screenshot({ path: shotPath(viewportKey, "02-products.png"), fullPage: true });
    });

    test("03 planner landing", async ({ page }) => {
      await page.goto("/planner");
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.screenshot({ path: shotPath(viewportKey, "03-planner.png"), fullPage: true });
    });

    if (viewportKey === "iphone" || viewportKey === "android") {
      test("04 mobile drawer open", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Open menu" }).click();
        await page
          .getByRole("navigation", { name: "Mobile primary navigation" })
          .waitFor({ state: "visible" });
        await page.screenshot({
          path: shotPath(viewportKey, "04-mobile-drawer-open.png"),
          fullPage: true,
        });
      });

      test("05 products via mobile nav", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Open menu" }).click();
        const mobileNav = page.getByRole("navigation", { name: "Mobile primary navigation" });
        await mobileNav.getByRole("button", { name: "Products" }).click();
        await mobileNav.getByRole("link", { name: "All Products", exact: true }).click();
        await page.getByRole("heading", { level: 1, name: /Workspace products/i }).waitFor();
        await page.screenshot({
          path: shotPath(viewportKey, "05-products-via-mobile-nav.png"),
          fullPage: true,
        });
      });
    }

    if (viewportKey === "desktop" || viewportKey === "tablet-landscape") {
      test("04 desktop mega menu open", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Products" }).hover();
        await page.locator("#products-mega-menu").waitFor({ state: "visible" });
        await page.screenshot({
          path: shotPath(viewportKey, "04-mega-menu-open.png"),
          fullPage: true,
        });
      });

      test("05 products via mega menu", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Products" }).hover();
        const megaMenu = page.locator("#products-mega-menu");
        await megaMenu.waitFor({ state: "visible" });
        await megaMenu.getByRole("link", { name: "All Products >" }).click();
        await page.getByRole("heading", { level: 1, name: /Workspace products/i }).waitFor();
        await page.screenshot({
          path: shotPath(viewportKey, "05-products-via-mega-menu.png"),
          fullPage: true,
        });
      });
    }

    if (viewportKey === "tablet-portrait") {
      test("04 tablet header", async ({ page }) => {
        await page.goto("/");
        await page.locator("#home-hero").waitFor({ state: "visible" });
        await page.screenshot({
          path: shotPath(viewportKey, "04-tablet-header.png"),
          fullPage: false,
        });
      });

      test("05 tablet products fold", async ({ page }) => {
        await page.goto("/products");
        await page.getByRole("heading", { level: 2, name: /Browse by workspace need/i }).waitFor();
        const categoryGrid = page.locator('a[href^="/products/"]').first();
        await categoryGrid.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: shotPath(viewportKey, "05-products-category-grid.png"),
          fullPage: false,
        });
      });
    }
  });
}
