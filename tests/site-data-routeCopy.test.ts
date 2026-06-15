import { describe, expect, it } from "vitest";
import {
  ABOUT_PAGE_COPY,
  CAREER_PAGE_COPY,
  CAREER_PAGE_JOBS,
  CATEGORY_ROUTE_COPY,
  COMPARE_ROUTE_COPY,
  CONTACT_FORM_CONTEXT_COPY,
  CONTACT_PAGE_COPY,
  DOWNLOADS_PAGE_COPY,
  DOWNLOADS_RESOURCE_CATEGORIES,
  GALLERY_PAGE_COPY,
  GALLERY_PROJECTS,
  LEGAL_PAGE_COPY,
  NEWS_PAGE_COPY,
  PDP_ROUTE_COPY,
  PLANNING_PAGE_COPY,
  PLANNING_PAGE_DELIVERABLES,
  PLANNING_PAGE_STEPS,
  PORTFOLIO_CLIENTS,
  PORTFOLIO_PAGE_COPY,
  PRODUCTS_PAGE_COPY,
  PROJECTS_PAGE_CLIENTS,
  PROJECTS_PAGE_COPY,
  QUOTE_CART_ROUTE_COPY,
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
  SHOWROOMS_CLIENTS,
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
  SOCIAL_PAGE_COPY,
  SOCIAL_PAGE_POSTS,
  SOLUTIONS_DELIVERY_STEPS,
  SOLUTIONS_PAGE_COPY,
  SUPPORT_IVR_PAGE_COPY,
  SUSTAINABILITY_PAGE_COPY,
  TRACKING_PAGE_COPY,
  TRUSTED_BY_PAGE_COPY,
} from "@/data/site/routeCopy";

describe("route copy — page heroes", () => {
  it("about page has structured sections and CTAs", () => {
    expect(ABOUT_PAGE_COPY.heroTitle).toBe("About One&Only");
    expect(ABOUT_PAGE_COPY.paragraphs).toHaveLength(3);
    expect(ABOUT_PAGE_COPY.modelPillars).toHaveLength(3);
    expect(ABOUT_PAGE_COPY.processSteps).toHaveLength(3);
    expect(ABOUT_PAGE_COPY.supportPrimaryCta).toMatch(/planning/i);
  });

  it("contact page lists two office locations", () => {
    expect(CONTACT_PAGE_COPY.heroTitle).toBe("Contact us");
    expect(CONTACT_PAGE_COPY.offices).toHaveLength(2);
    expect(CONTACT_PAGE_COPY.offices[0].title).toBe("Corporate office");
    expect(CONTACT_PAGE_COPY.offices[1].lines.some((l) => l.includes("Patna"))).toBe(true);
  });

  it("contact form context seeds compare and quote-cart flows", () => {
    expect(CONTACT_FORM_CONTEXT_COPY.quote.compare.requirement).toMatch(/compare/i);
    expect(CONTACT_FORM_CONTEXT_COPY.quote["quote-cart"].seededMessage).toMatch(/quote cart/i);
  });
});

describe("route copy — proof and portfolio", () => {
  it("trusted-by and projects copy reference client scale", () => {
    expect(TRUSTED_BY_PAGE_COPY.heroTitle).toBe("Trusted by");
    expect(PROJECTS_PAGE_COPY.heroSubtitleTemplate).toContain("{clients}");
    expect(PROJECTS_PAGE_COPY.featuredLabel).toBeTruthy();
  });

  it("projects client roster has unique names and valid sectors", () => {
    const names = PROJECTS_PAGE_CLIENTS.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    expect(PROJECTS_PAGE_CLIENTS.length).toBeGreaterThan(50);
    for (const client of PROJECTS_PAGE_CLIENTS) {
      expect(client.sector).toBeTruthy();
    }
  });

  it("portfolio clients and gallery projects align on folder naming", () => {
    expect(PORTFOLIO_PAGE_COPY.totalTemplate).toContain("{photos}");
    expect(PORTFOLIO_CLIENTS).toHaveLength(6);
    expect(GALLERY_PROJECTS.length).toBeGreaterThanOrEqual(6);
    expect(GALLERY_PAGE_COPY.kicker).toMatch(/highlights/i);
  });
});

describe("route copy — marketing routes", () => {
  it("showrooms page links clients and highlights", () => {
    expect(SHOWROOMS_PAGE_COPY.clientsCta).toMatch(/client/i);
    expect(SHOWROOMS_CLIENTS).toContain("Titan");
    expect(SHOWROOMS_HIGHLIGHTS).toHaveLength(3);
  });

  it("solutions page includes delivery stats and steps", () => {
    expect(SOLUTIONS_PAGE_COPY.stats).toHaveLength(4);
    expect(SOLUTIONS_DELIVERY_STEPS).toHaveLength(3);
    for (const step of SOLUTIONS_DELIVERY_STEPS) {
      expect(step.image).toMatch(/^\//);
    }
  });

  it("sustainability page documents eco-score without unsupported claims", () => {
    expect(SUSTAINABILITY_PAGE_COPY.introPoints.some((p) => /unsupported/i.test(p))).toBe(true);
    expect(SUSTAINABILITY_PAGE_COPY.pillars).toHaveLength(3);
    expect(SUSTAINABILITY_PAGE_COPY.ecoScoreItems).toHaveLength(3);
  });
});

describe("route copy — careers, social, news, tracking", () => {
  it("career page lists openings and support routing", () => {
    expect(CAREER_PAGE_JOBS).toHaveLength(4);
    expect(CAREER_PAGE_COPY.careersEmail).toContain("@");
    expect(CAREER_PAGE_COPY.processSteps).toHaveLength(3);
  });

  it("social posts map to product slugs", () => {
    expect(SOCIAL_PAGE_POSTS).toHaveLength(6);
    for (const post of SOCIAL_PAGE_POSTS) {
      expect(post.productSlug).toMatch(/^oando-/);
      expect(post.image).toMatch(/^\//);
    }
    expect(SOCIAL_PAGE_COPY.primaryCta).toMatch(/products/i);
  });

  it("news and tracking pages stay truthful about capabilities", () => {
    expect(NEWS_PAGE_COPY.cards).toHaveLength(3);
    expect(TRACKING_PAGE_COPY.introDescription).toMatch(/does not pretend/i);
    expect(TRACKING_PAGE_COPY.referenceItems.length).toBeGreaterThanOrEqual(4);
    expect(TRACKING_PAGE_COPY.lanes).toHaveLength(3);
  });

  it("support IVR page copy routes to service lanes", () => {
    expect(SUPPORT_IVR_PAGE_COPY.heroTitle).toBe("Support Routing");
    expect(SUPPORT_IVR_PAGE_COPY.noteDescription).toMatch(/service/i);
  });
});

describe("route copy — planning, service, downloads", () => {
  it("planning page defines steps and deliverables", () => {
    expect(PLANNING_PAGE_STEPS).toHaveLength(3);
    expect(PLANNING_PAGE_DELIVERABLES.length).toBeGreaterThanOrEqual(4);
    expect(PLANNING_PAGE_COPY.primaryCta).toMatch(/planning/i);
  });

  it("service page channels include WhatsApp href built at module load", () => {
    const whatsapp = SERVICE_PAGE_CHANNELS.find((c) => c.kind === "whatsapp");
    expect(whatsapp).toBeDefined();
    expect(whatsapp?.href).toMatch(/^https:\/\/wa\.me\//);
    expect(SERVICE_PAGE_PILLARS).toHaveLength(3);
    expect(SERVICE_PAGE_COPY.frameworkTitle).toMatch(/support/i);
  });

  it("downloads resource desk lists three resource categories", () => {
    expect(DOWNLOADS_PAGE_COPY.heroTitle).toBe("Resource Desk");
    expect(DOWNLOADS_RESOURCE_CATEGORIES).toHaveLength(3);
    for (const category of DOWNLOADS_RESOURCE_CATEGORIES) {
      expect(category.href).toMatch(/^\//);
    }
  });
});

describe("route copy — legal and catalog routes", () => {
  it("legal pages cover privacy, terms, imprint, and refund", () => {
    expect(LEGAL_PAGE_COPY.privacy.title).toBe("Privacy Policy");
    expect(LEGAL_PAGE_COPY.terms.sections.length).toBeGreaterThanOrEqual(5);
    expect(LEGAL_PAGE_COPY.imprint.sections.some((s) => s.heading === "Contact")).toBe(true);
    expect(LEGAL_PAGE_COPY.refund.sections).toHaveLength(4);
  });

  it("products page copy includes confidence clients with logos", () => {
    expect(PRODUCTS_PAGE_COPY.pillars).toHaveLength(3);
    expect(PRODUCTS_PAGE_COPY.clients.every((c) => c.logo.startsWith("/"))).toBe(true);
    expect(PRODUCTS_PAGE_COPY.consultTertiaryCta).toMatch(/Resource Desk/i);
  });

  it("category, compare, quote cart, and PDP route copy expose UI labels", () => {
    expect(CATEGORY_ROUTE_COPY.compareActiveLabel).toContain("{count}");
    expect(COMPARE_ROUTE_COPY.emptyTitle).toMatch(/No products/i);
    expect(QUOTE_CART_ROUTE_COPY.summaryTitle).toBe("Request summary");
    expect(PDP_ROUTE_COPY.ctas.addToQuote).toBe("Add to Quote Cart");
    expect(PDP_ROUTE_COPY.summary.visualCoverage).toContain("{count}");
  });
});