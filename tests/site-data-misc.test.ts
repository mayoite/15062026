import { describe, expect, it } from "vitest";
import { SITE_BRAND } from "@/data/site/brand";
import {
  BUSINESS_STATS_FETCH_TIMEOUT_MS,
  BUSINESS_STATS_REVALIDATE_SECONDS,
  BUSINESS_STATS_SAFE_DEFAULTS,
  CATALOG_REVALIDATE_SECONDS,
} from "@/data/site/fallbacks";
import { HERO_CAROUSEL_SLIDES } from "@/data/site/heroCarousel";
import {
  NEWS_PAGE_CONTENT,
  PRODUCT_CATEGORY_SECTION,
  SOCIAL_PAGE_CONTENT,
} from "@/data/site/marketing";
import { PRODUCT_SUITE, type ProductSuiteKey } from "@/data/site/productSuite";
import { TRUSTED_BY_CLIENTS, TRUSTED_BY_STATS } from "@/data/site/proof";
import { VISUAL_IVR_TREE } from "@/data/site/support";

describe("SITE_BRAND", () => {
  it("defines company identity and OG image", () => {
    expect(SITE_BRAND.companyName).toBe("One&Only");
    expect(SITE_BRAND.defaultTitle).toContain("One&Only");
    expect(SITE_BRAND.ogImage).toMatch(/^\//);
    expect(SITE_BRAND.description).toMatch(/Patna/i);
  });
});

describe("business stats fallbacks", () => {
  it("exports safe defaults with positive counts", () => {
    expect(BUSINESS_STATS_SAFE_DEFAULTS.clientOrganisations).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.projectsDelivered).toBeGreaterThan(0);
    expect(BUSINESS_STATS_SAFE_DEFAULTS.asOfDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("exports revalidate and timeout constants", () => {
    expect(BUSINESS_STATS_FETCH_TIMEOUT_MS).toBeGreaterThan(0);
    expect(BUSINESS_STATS_REVALIDATE_SECONDS).toBe(300);
    expect(CATALOG_REVALIDATE_SECONDS).toBe(300);
  });
});

describe("HERO_CAROUSEL_SLIDES", () => {
  it("includes Titan and TVS Patna slides with CTAs", () => {
    expect(HERO_CAROUSEL_SLIDES).toHaveLength(2);
    for (const slide of HERO_CAROUSEL_SLIDES) {
      expect(slide.ctas).toHaveLength(2);
      expect(slide.headline).toBeTruthy();
      expect(slide.src).toMatch(/^\//);
    }
    expect(HERO_CAROUSEL_SLIDES[0].location).toContain("Titan");
    expect(HERO_CAROUSEL_SLIDES[1].location).toContain("TVS");
  });
});

describe("marketing content", () => {
  it("product category section has table rows and catalog items", () => {
    expect(PRODUCT_CATEGORY_SECTION.tableRows).toHaveLength(4);
    expect(PRODUCT_CATEGORY_SECTION.items.length).toBeGreaterThanOrEqual(6);
    expect(PRODUCT_CATEGORY_SECTION.cta.href).toBe("/products");
  });

  it("news page content lists dated items", () => {
    expect(NEWS_PAGE_CONTENT.items).toHaveLength(3);
    for (const item of NEWS_PAGE_CONTENT.items) {
      expect(item.date).toBeTruthy();
      expect(item.title.length).toBeGreaterThan(10);
    }
  });

  it("social page content maps posts to product slugs", () => {
    expect(SOCIAL_PAGE_CONTENT.posts).toHaveLength(6);
    expect(SOCIAL_PAGE_CONTENT.handle).toMatch(/^@/);
    for (const post of SOCIAL_PAGE_CONTENT.posts) {
      expect(post.productSlug).toMatch(/^oando-/);
    }
  });
});

describe("PRODUCT_SUITE", () => {
  it("defines planner, configurator, admin, and shared routes", () => {
    const keys: ProductSuiteKey[] = ["planner", "configurator", "admin", "shared"];
    for (const key of keys) {
      expect(PRODUCT_SUITE[key].routes).toBeDefined();
    }
    expect(PRODUCT_SUITE.planner.routes.canvas).toBe("/planner/canvas");
    expect(PRODUCT_SUITE.shared.routes.login).toBe("/login");
  });
});

describe("proof data", () => {
  it("trusted-by stats show experience and client scale", () => {
    expect(TRUSTED_BY_STATS).toHaveLength(4);
    expect(TRUSTED_BY_STATS.some((s) => /years/i.test(s.label))).toBe(true);
  });

  it("trusted-by clients list has unique names", () => {
    const names = TRUSTED_BY_CLIENTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(TRUSTED_BY_CLIENTS.length).toBeGreaterThan(20);
  });
});

describe("VISUAL_IVR_TREE", () => {
  it("root menu exposes sales, support, and general branches", () => {
    expect(VISUAL_IVR_TREE.id).toBe("root");
    expect(VISUAL_IVR_TREE.options).toHaveLength(3);
    const ids = VISUAL_IVR_TREE.options!.map((n) => n.id);
    expect(ids).toEqual(["sales", "support", "general"]);
  });

  it("sales branch includes domestic and international contacts", () => {
    const sales = VISUAL_IVR_TREE.options!.find((n) => n.id === "sales");
    expect(sales?.options).toHaveLength(3);
    const domestic = sales?.options?.find((n) => n.id === "sales_de");
    expect(domestic?.action?.type).toBe("contact");
    expect(domestic?.action?.detail).toContain("@");
  });

  it("support branch includes order status info action", () => {
    const support = VISUAL_IVR_TREE.options!.find((n) => n.id === "support");
    const orderStatus = support?.options?.find((n) => n.id === "order_status");
    expect(orderStatus?.action?.type).toBe("info");
    expect(orderStatus?.action?.value).toMatch(/order confirmation/i);
  });

  it("general branch links careers route", () => {
    const general = VISUAL_IVR_TREE.options!.find((n) => n.id === "general");
    const careers = general?.options?.find((n) => n.id === "careers");
    expect(careers?.action?.type).toBe("link");
    expect(careers?.action?.value).toBe("/career");
  });
});