import { describe, expect, it } from "vitest";
import {
  SITE_NAV_LINKS,
  SITE_CTA_LINKS,
  SITE_FOOTER_NAV,
  SITE_NAV_FEATURED_CARDS,
  SITE_NAV_SEARCH_FALLBACK_LINKS,
} from "@/lib/site-data/navigation";

describe("SITE_NAV_LINKS", () => {
  it("has at least 5 items", () => {
    expect(SITE_NAV_LINKS.length).toBeGreaterThanOrEqual(5);
  });

  it("every link has a non-empty label", () => {
    for (const link of SITE_NAV_LINKS) {
      expect(link.label).toBeTruthy();
      expect(link.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('every link has an href starting with "/"', () => {
    for (const link of SITE_NAV_LINKS) {
      expect(link.href).toMatch(/^\//);
    }
  });

  it("contains Products page", () => {
    const match = SITE_NAV_LINKS.find((l) => l.label === "Products");
    expect(match).toBeDefined();
    expect(match?.href).toBe("/products");
  });

  it("contains About page", () => {
    const match = SITE_NAV_LINKS.find((l) => l.label === "About");
    expect(match).toBeDefined();
    expect(match?.href).toBe("/about");
  });

  it("contains Planner page", () => {
    const match = SITE_NAV_LINKS.find((l) => l.label === "Planner");
    expect(match).toBeDefined();
    expect(match?.href).toMatch(/^\//);
  });

  it("contains Solutions page", () => {
    const match = SITE_NAV_LINKS.find((l) => l.label === "Solutions");
    expect(match).toBeDefined();
    expect(match?.href).toBe("/solutions");
  });

  it("Products link has hasMega set to true", () => {
    const products = SITE_NAV_LINKS.find((l) => l.label === "Products");
    expect(products?.hasMega).toBe(true);
  });

  it("no duplicate labels", () => {
    const labels = SITE_NAV_LINKS.map((l) => l.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("SITE_CTA_LINKS", () => {
  it("every CTA has a non-empty label", () => {
    for (const cta of SITE_CTA_LINKS) {
      expect(cta.label.trim().length).toBeGreaterThan(0);
    }
  });

  it('every CTA has an href starting with "/"', () => {
    for (const cta of SITE_CTA_LINKS) {
      expect(cta.href).toMatch(/^\//);
    }
  });

  it("every CTA has a valid variant (primary or outline)", () => {
    for (const cta of SITE_CTA_LINKS) {
      expect(["primary", "outline"]).toContain(cta.variant);
    }
  });

  it("has at least one primary variant", () => {
    const primary = SITE_CTA_LINKS.find((c) => c.variant === "primary");
    expect(primary).toBeDefined();
  });
});

describe("SITE_NAV_FEATURED_CARDS", () => {
  it("has exactly 3 cards", () => {
    expect(SITE_NAV_FEATURED_CARDS).toHaveLength(3);
  });

  it("every card has all required fields (title, description, href, image)", () => {
    for (const card of SITE_NAV_FEATURED_CARDS) {
      expect(card.title).toBeTruthy();
      expect(card.description).toBeTruthy();
      expect(card.href).toMatch(/^\//);
      expect(card.image).toBeTruthy();
    }
  });

  it("contains Ergonomic Seating card", () => {
    const card = SITE_NAV_FEATURED_CARDS.find((c) => c.title === "Ergonomic Seating");
    expect(card).toBeDefined();
  });

  it("contains Modular Workstations card", () => {
    const card = SITE_NAV_FEATURED_CARDS.find((c) => c.title === "Modular Workstations");
    expect(card).toBeDefined();
  });

  it("contains Need Help Choosing? card", () => {
    const card = SITE_NAV_FEATURED_CARDS.find((c) => c.title === "Need Help Choosing?");
    expect(card).toBeDefined();
  });
});

describe("SITE_NAV_SEARCH_FALLBACK_LINKS", () => {
  it('every fallback link has a non-empty label and href starting with "/"', () => {
    for (const link of SITE_NAV_SEARCH_FALLBACK_LINKS) {
      expect(link.label.trim().length).toBeGreaterThan(0);
      expect(link.href).toMatch(/^\//);
    }
  });

  it("has at least 3 fallback links", () => {
    expect(SITE_NAV_SEARCH_FALLBACK_LINKS.length).toBeGreaterThanOrEqual(3);
  });
});

describe("SITE_FOOTER_NAV", () => {
  it("has Products, Company, Services, and Workspace sections", () => {
    expect(SITE_FOOTER_NAV).toHaveLength(4);
    expect(SITE_FOOTER_NAV.map((section) => section.heading)).toEqual([
      "Products",
      "Company",
      "Services",
      "Workspace",
    ]);
  });

  it("every section has a heading and links array", () => {
    for (const section of SITE_FOOTER_NAV) {
      expect(section.heading).toBeTruthy();
      expect(Array.isArray(section.links)).toBe(true);
      expect(section.links.length).toBeGreaterThan(0);
    }
  });

  it("no section has empty link labels or hrefs", () => {
    for (const section of SITE_FOOTER_NAV) {
      for (const link of section.links) {
        expect(link.label.trim().length).toBeGreaterThan(0);
        expect(link.href).toBeTruthy();
      }
    }
  });

  it("has no duplicate hrefs across footer sections", () => {
    const hrefs = SITE_FOOTER_NAV.flatMap((section) =>
      section.links.map((link) => link.href.replace(/\/$/, "") || "/"),
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("includes trimmed Products links (categories live in header mega menu)", () => {
    const products = SITE_FOOTER_NAV.find((section) => section.heading === "Products");
    expect(products?.links.map((link) => link.label)).toEqual(["All Products", "Solutions"]);
    expect(SITE_FOOTER_NAV.flatMap((section) => section.links).some((link) => link.href === "/news")).toBe(
      false,
    );
    expect(SITE_FOOTER_NAV.flatMap((section) => section.links).some((link) => link.href === "/showrooms")).toBe(
      true,
    );
  });
});
