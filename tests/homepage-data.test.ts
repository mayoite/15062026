import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_PLANNER_SUITE_CONTENT,
  HOMEPAGE_PROJECTS_CONTENT,
} from "@/data/site/homepage";

describe("homepage data", () => {
  it("hero leads with products not planner", () => {
    expect(HOMEPAGE_HERO_CONTENT.primaryCta.href).toBe("/products");
    expect(HOMEPAGE_HERO_CONTENT.secondaryCta.href).toBe("/contact");
  });

  it("hero glass proof links to trusted-by with badge and narrative copy", () => {
    expect(HOMEPAGE_HERO_CONTENT.glassProof.href).toBe("/trusted-by");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.badge).toBe("Trusted by");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.lead).toContain("400+");
    expect(HOMEPAGE_HERO_CONTENT.glassProof.support).toMatch(/government/i);
    expect(HOMEPAGE_HERO_CONTENT.glassProof.cta).toBe("View clients");
  });

  it("hero uses brand headline and pan-india kicker without subtitle", () => {
    expect(HOMEPAGE_HERO_CONTENT.title.join(" ")).toMatch(/your team/i);
    expect(HOMEPAGE_HERO_CONTENT.kicker).toMatch(/Pan-India/i);
    expect(HOMEPAGE_HERO_CONTENT.secondaryCta.label).toBe("Request a quote");
    expect("description" in HOMEPAGE_HERO_CONTENT).toBe(false);
  });

  it("hero carousel excludes titan-patna-hero slide", () => {
    expect(HOMEPAGE_HERO_IMAGES.some((img) => img.src.includes("titan-patna-hero"))).toBe(
      false,
    );
    expect(HOMEPAGE_HERO_IMAGES.length).toBeGreaterThanOrEqual(5);
  });

  it("planner section links to member login and overview", () => {
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.loginHref).toContain("/login");
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.loginLabel).toBe("Member login");
    expect(HOMEPAGE_PLANNER_SUITE_CONTENT.overviewHref).toBe("/planner");
  });

  it("collections and projects show three featured items", () => {
    expect(HOMEPAGE_COLLECTIONS_CONTENT.items).toHaveLength(3);
    expect(HOMEPAGE_PROJECTS_CONTENT.cards).toHaveLength(3);
  });
});
