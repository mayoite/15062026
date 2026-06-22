import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  HOMEPAGE_COLLECTIONS_CONTENT,
  HOMEPAGE_SHOWCASE_CONTENT,
  HOMEPAGE_PARTNERSHIP_CONTENT,
  HOMEPAGE_CONTACT_CONTENT,
  HOMEPAGE_WHY_CHOOSE_US_CONTENT,
} from "@/lib/site-data/homepage";

describe("homepage data", () => {
  it("hero leads with products not planner", () => {
    expect(HOMEPAGE_HERO_CONTENT.primaryCta.href).toBe("/products");
    expect(HOMEPAGE_HERO_CONTENT.secondaryCta.href).toBe("/#contact");
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

  it("why choose us keeps the workspace systems headline", () => {
    expect(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleLead).toBe("We engineer");
    expect(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleAccent).toBe("workspaces");
  });

  it("collections shows six featured categories", () => {
    expect(HOMEPAGE_COLLECTIONS_CONTENT.items).toHaveLength(6);
    expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.href).toBe("/products");
    expect(HOMEPAGE_COLLECTIONS_CONTENT.catalogCta.label).toBe("Browse full catalog");
  });

  it("showcase carousel uses three portfolio clients and portfolio CTA", () => {
    expect(HOMEPAGE_SHOWCASE_CONTENT.items).toHaveLength(3);
    expect(HOMEPAGE_SHOWCASE_CONTENT.items.map((item) => item.id)).toEqual([
      "dmrc",
      "titan",
      "tvs",
    ]);
    expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleLead).toBe("Delivered for");
    expect(HOMEPAGE_SHOWCASE_CONTENT.sectionTitleAccent).toBe("leading organizations");
    expect(HOMEPAGE_SHOWCASE_CONTENT.browseCta).toEqual({
      label: "View portfolio",
      href: "/portfolio",
    });
  });

  it("partnership banner uses AFC strategic partner copy", () => {
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.title).toEqual([
      "Official Strategic",
      "Partner",
    ]);
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.src).toBe("/catalog-logo-sharp.webp");
    expect(HOMEPAGE_PARTNERSHIP_CONTENT.image.alt).toMatch(/AFC/i);
  });

  it("contact teaser leads with requirement headline and direct actions", () => {
    expect(HOMEPAGE_CONTACT_CONTENT.titleLead).toBe("Share your");
    expect(HOMEPAGE_CONTACT_CONTENT.titleAccent).toBe("requirement");
    expect(HOMEPAGE_CONTACT_CONTENT.directActions).toHaveLength(2);
    expect(HOMEPAGE_CONTACT_CONTENT.directActions.map((a) => a.type)).toEqual([
      "whatsapp",
      "phone",
    ]);
    expect(HOMEPAGE_CONTACT_CONTENT.directActions[0].label).toBe("WhatsApp now");
    expect(HOMEPAGE_CONTACT_CONTENT.directActions[1].label).toBe("Call team");
  });
});