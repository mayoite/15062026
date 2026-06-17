import { expect, test } from "@playwright/test";

const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

test.describe("site navigation smoke", () => {
  test("homepage loads with hero and progress dots", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#home-hero")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Spaces that work/i);
    await expect(page.getByText(/Pan-India/i)).toBeVisible();

    const secondDot = page.getByRole("button", { name: "Show project image 2" });
    await secondDot.click();
    await expect(secondDot).toHaveAttribute("aria-current", "true");
  });

  test("homepage hero exposes product and quote CTAs plus trusted-by glass proof", async ({
    page,
  }) => {
    await page.goto("/");

    const exploreProducts = page.getByRole("link", { name: "Explore Products" });
    await expect(exploreProducts).toBeVisible();
    await expect(exploreProducts).toHaveAttribute("href", /\/products\/?$/);

    const requestQuote = page.getByRole("link", { name: "Request a quote" });
    await expect(requestQuote).toBeVisible();
    await expect(requestQuote).toHaveAttribute("href", /\/contact\/?$/);

    const glassProof = page.getByRole("link", { name: /View clients/i });
    await expect(glassProof).toBeVisible();
    await expect(glassProof).toHaveAttribute("href", /\/trusted-by\/?$/);
    await expect(glassProof).toContainText(/Trusted by/i);
    await expect(glassProof).toContainText(/400\+/i);
  });

  test("homepage shows Final0704-inspired sections", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /Browse/i })).toBeVisible();
    await expect(page.getByTestId("kpi-client-organisations")).toBeVisible();
    await expect(page.getByTestId("kpi-locations-served")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Delivered for/i })).toContainText(
      /leading organizations/i,
    );
    await expect(
      page.getByRole("heading", { name: /Official Strategic/i }),
    ).toContainText(/Partner/i);
    await expect(page.getByRole("heading", { name: /Design your workspace/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Oando Planner/i })).toBeVisible();
    await expect(page.locator("a.home-tool-card", { hasText: /Planning service/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /We engineer workspaces/i }),
    ).toBeVisible();

    const briefForm = page.getByRole("form", { name: "Project brief enquiry" });
    await expect(briefForm).toBeVisible();
    await expect(briefForm.getByRole("button", { name: /Send Brief/i })).toBeVisible();
    await expect(briefForm.getByLabel("Name")).toBeVisible();
    await expect(briefForm.getByLabel("City")).toBeVisible();
    await expect(briefForm.getByLabel("Phone or Email")).toBeVisible();
    await expect(briefForm.locator("#contact-teaser-brief")).toBeVisible();
  });

  test("/planning service page loads with workflow section", async ({ page }) => {
    await page.goto("/planning");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Planning Service/i);
    await expect(page.getByRole("heading", { name: /From intent to implementation-ready plans/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Request planning call/i }).first()).toBeVisible();
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