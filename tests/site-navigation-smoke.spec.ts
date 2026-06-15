import { expect, test } from "@playwright/test";

const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

test.describe("site navigation smoke", () => {
  test("homepage loads with hero and progress dots", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Spaces that work/i);

    const secondDot = page.getByRole("button", { name: "Show project image 2" });
    await secondDot.click();
    await expect(secondDot).toHaveAttribute("aria-current", "true");
  });

  test("/products catalog loads with first category card visible", async ({ page }) => {
    test.skip(!hasSupabaseEnv, "Requires NEXT_PUBLIC_SUPABASE_URL");
    await page.goto("/products");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Workspace products/i);
    await expect(page.getByRole("heading", { level: 2, name: /Browse by workspace need/i })).toBeVisible();

    const firstCategoryCard = page.locator('a[href^="/products/"]').first();
    await expect(firstCategoryCard).toBeVisible();
    await expect(firstCategoryCard).toContainText(/\d+ products/i);
  });

  test("desktop header All Products link reaches /products", async ({ page }) => {
    test.skip(!hasSupabaseEnv, "Requires NEXT_PUBLIC_SUPABASE_URL");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await page.getByRole("button", { name: "Products" }).hover();
    const megaMenu = page.locator("#products-mega-menu");
    await expect(megaMenu).toBeVisible();
    await megaMenu.getByRole("link", { name: "All Products >" }).click();

    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Workspace products/i);
  });

  test("mobile drawer opens and All Products closes drawer on /products", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.getByRole("button", { name: "Open menu" }).click();
    const mobileNav = page.getByRole("navigation", { name: "Mobile primary navigation" });
    await expect(mobileNav).toBeVisible();

    await mobileNav.getByRole("button", { name: "Products" }).click();
    await mobileNav.getByRole("link", { name: "All Products", exact: true }).click();

    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(mobileNav).toBeHidden();
  });
});
