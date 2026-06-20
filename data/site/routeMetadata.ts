import type { Metadata } from "next";
import { SITE_BRAND } from "@/data/site/brand";
import {
  LEGAL_PAGE_COPY,
  PRODUCTS_PAGE_COPY,
  SOLUTIONS_PAGE_COPY,
  DOWNLOADS_PAGE_COPY,
  COMPARE_ROUTE_COPY,
  QUOTE_CART_ROUTE_COPY,
  SHOWROOMS_PAGE_COPY,
  PROJECTS_PAGE_COPY,
  PORTFOLIO_PAGE_COPY,
  GALLERY_PAGE_COPY,
  TRUSTED_BY_PAGE_COPY,
  SOCIAL_PAGE_COPY,
  NEWS_PAGE_COPY,
  TRACKING_PAGE_COPY,
  SUPPORT_IVR_PAGE_COPY,
  PLANNING_PAGE_COPY,
  SERVICE_PAGE_COPY,
  SUSTAINABILITY_PAGE_COPY,
  CAREER_PAGE_COPY,
  ABOUT_PAGE_COPY,
  CONTACT_PAGE_COPY,
} from "@/data/site/routeCopy";
import { buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Centralized metadata registry for all static site routes.
 * Each entry yields unique title, description, canonical URL, OG tags,
 * Twitter cards, and i18n hreflang alternates via `buildPageMetadata`.
 *
 * Pages with dynamic params (products/[category], products/[category]/[product],
 * solutions/[category], planner features/[slug]) use `generateMetadata` and
 * are not listed here.
 */

export const ABOUT_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${ABOUT_PAGE_COPY.heroTitle} | Planning-led workspace partner`,
  description: ABOUT_PAGE_COPY.heroSubtitle,
  path: "/about",
  keywords: [
    "about One&Only",
    "office furniture company Patna",
    "workspace planning partner India",
    "furniture dealer Bihar",
  ],
});

export const SOLUTIONS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: SOLUTIONS_PAGE_COPY.metadataTitle,
  description: SOLUTIONS_PAGE_COPY.metadataDescription,
  path: "/solutions",
  keywords: [
    "workspace planning approach",
    "office furniture delivery model",
    "project execution Bihar",
    "workspace fit-out India",
  ],
});

export const CONTACT_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${CONTACT_PAGE_COPY.heroTitle} | One&Only`,
  description: CONTACT_PAGE_COPY.heroSubtitle,
  path: "/contact",
  keywords: [
    "contact office furniture Patna",
    "workspace enquiry Bihar",
    "quote request office furniture",
    "sales contact One&Only",
  ],
});

export const SUSTAINABILITY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SUSTAINABILITY_PAGE_COPY.heroTitle} | One&Only`,
  description: SUSTAINABILITY_PAGE_COPY.heroSubtitle,
  path: "/sustainability",
  keywords: [
    "sustainable office furniture",
    "long-life workspace systems",
    "eco-friendly furniture India",
    "durable office furniture",
  ],
});

export const SERVICE_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SERVICE_PAGE_COPY.heroTitle} | One&Only`,
  description: SERVICE_PAGE_COPY.heroSubtitle,
  path: "/service",
  keywords: [
    "office furniture service support",
    "after-sales support furniture",
    "warranty support Bihar",
    "installation support office furniture",
  ],
});

export const PLANNING_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PLANNING_PAGE_COPY.heroTitle} | One&Only`,
  description: PLANNING_PAGE_COPY.heroSubtitle,
  path: "/planning",
  keywords: [
    "workspace planning service",
    "office layout planning Patna",
    "space planning Bihar",
    "furniture layout design India",
  ],
});

export const DOWNLOADS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${DOWNLOADS_PAGE_COPY.metadataTitle} | One&Only`,
  description: DOWNLOADS_PAGE_COPY.metadataDescription,
  path: "/downloads",
  keywords: [
    "product catalogs office furniture",
    "technical sheets furniture",
    "planning references workspace",
    "resource desk One&Only",
  ],
});

export const PRIVACY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${LEGAL_PAGE_COPY.privacy.title} | One&Only`,
  description: LEGAL_PAGE_COPY.privacy.heroSubtitle,
  path: "/privacy",
  alternates: false,
});

export const TERMS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${LEGAL_PAGE_COPY.terms.title} | One&Only`,
  description: LEGAL_PAGE_COPY.terms.heroSubtitle,
  path: "/terms",
  alternates: false,
});

export const REFUND_POLICY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${LEGAL_PAGE_COPY.refund.metadataTitle} | One&Only`,
  description: LEGAL_PAGE_COPY.refund.metadataDescription,
  path: "/refund-and-return-policy",
  alternates: false,
});

export const IMPRINT_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${LEGAL_PAGE_COPY.imprint.title} | One&Only`,
  description: LEGAL_PAGE_COPY.imprint.heroSubtitle,
  path: "/imprint",
  alternates: false,
});

export const COMPARE_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${COMPARE_ROUTE_COPY.title} | One&Only`,
  description: COMPARE_ROUTE_COPY.description,
  path: "/compare",
  keywords: [
    "compare office furniture",
    "product comparison workspace",
    "compare chairs tables storage",
    "furniture comparison India",
  ],
});

export const QUOTE_CART_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${QUOTE_CART_ROUTE_COPY.title} | One&Only`,
  description: QUOTE_CART_ROUTE_COPY.description,
  path: "/quote-cart",
  alternates: false,
});

export const SHOWROOMS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SHOWROOMS_PAGE_COPY.heroTitle} | One&Only`,
  description: SHOWROOMS_PAGE_COPY.heroSubtitle,
  path: "/showrooms",
  keywords: [
    "office furniture showroom Patna",
    "furniture display Bihar",
    "workspace showroom India",
    "One&Only showroom",
  ],
});

export const PROJECTS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PROJECTS_PAGE_COPY.heroTitle} | One&Only`,
  description:
    "Client roster and delivery proof across government, finance, energy, manufacturing, and institutional sectors.",
  path: "/projects",
  keywords: [
    "office furniture projects India",
    "client roster workspace furniture",
    "government furniture projects",
    "enterprise furniture delivery",
  ],
});

export const PORTFOLIO_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PORTFOLIO_PAGE_COPY.heroTitle} | One&Only`,
  description: PORTFOLIO_PAGE_COPY.heroSubtitle,
  path: "/portfolio",
  keywords: [
    "office furniture portfolio",
    "project gallery workspace",
    "delivery photos office furniture",
    "installation gallery India",
  ],
});

export const GALLERY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${GALLERY_PAGE_COPY.heroTitle} | One&Only`,
  description: GALLERY_PAGE_COPY.heroSubtitle,
  path: "/gallery",
  keywords: [
    "project gallery office furniture",
    "workspace installation photos",
    "office furniture images India",
    "delivery gallery Bihar",
  ],
});

export const TRUSTED_BY_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${TRUSTED_BY_PAGE_COPY.heroTitle} | One&Only`,
  description: TRUSTED_BY_PAGE_COPY.heroSubtitle,
  path: "/trusted-by",
  keywords: [
    "trusted office furniture clients",
    "enterprise furniture clients India",
    "government furniture supplier",
    "corporate furniture partner",
  ],
});

export const SOCIAL_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SOCIAL_PAGE_COPY.heroTitle} | One&Only`,
  description: SOCIAL_PAGE_COPY.heroSubtitle,
  path: "/social",
  keywords: [
    "office furniture social",
    "workspace inspiration",
    "furniture ideas India",
    "One&Only social highlights",
  ],
});

export const NEWS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${NEWS_PAGE_COPY.heroTitle} | One&Only`,
  description: NEWS_PAGE_COPY.heroSubtitle,
  path: "/news",
  keywords: [
    "office furniture news India",
    "workspace updates",
    "furniture industry news Bihar",
    "One&Only updates",
  ],
});

export const TRACKING_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${TRACKING_PAGE_COPY.heroTitle} | One&Only`,
  description: TRACKING_PAGE_COPY.heroSubtitle,
  path: "/tracking",
  alternates: false,
});

export const SUPPORT_IVR_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${SUPPORT_IVR_PAGE_COPY.heroTitle} | One&Only`,
  description: SUPPORT_IVR_PAGE_COPY.heroSubtitle,
  path: "/support-ivr",
  alternates: false,
});

export const CAREER_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${CAREER_PAGE_COPY.heroTitle} | One&Only`,
  description: CAREER_PAGE_COPY.heroSubtitle,
  path: "/career",
  keywords: [
    "office furniture jobs Patna",
    "workspace planning careers",
    "furniture sales jobs Bihar",
    "One&Only careers India",
  ],
});

export const TEMPLATES_PAGE_FALLBACK_TITLE = "Workspace Templates | One&Only";

export const BACKEND_ARCHITECTURE_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Backend Architecture | One&Only",
  description:
    "Technical architecture overview for the One&Only workspace planner and marketing platform.",
  path: "/backend-architecture",
  alternates: false,
});

export const PRODUCTS_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: `${PRODUCTS_PAGE_COPY.headlineLead} ${PRODUCTS_PAGE_COPY.headlineAccent}`,
  description: PRODUCTS_PAGE_COPY.heroSubtitle,
  path: "/products",
  image: "/images/catalog/oando-workstations--deskpro/image-1.jpg",
  keywords: [
    "office furniture products India",
    "workstations chairs tables storage",
    "office furniture catalog Bihar",
    "ergonomic furniture products",
  ],
});

export const PLANNER_LANDING_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Workspace Planner | Plan Your Office in 2D & 3D | One&Only",
  description:
    "Free online workspace planner. Design office layouts in 2D, preview in 3D, import blueprints, and export BOQ-ready plans. No signup required to try.",
  path: "/planner",
  keywords: [
    "office space planner",
    "2D 3D workspace planner",
    "free office layout tool",
    "floor plan planner India",
    "workspace design tool",
  ],
});

export const PLANNER_HELP_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Planner Help & Guide | One&Only Workspace Planner",
  description:
    "Learn how to use the One&Only workspace planner: draw rooms, place furniture, switch to 3D, import blueprints, and export plans.",
  path: "/planner/help",
});

export const PLANNER_FEATURES_PAGE_METADATA: Metadata = buildPageMetadata(SITE_URL, {
  title: "Planner Features | Blueprint, 3D, AI Assist & Export | One&Only",
  description:
    "Explore workspace planner features: blueprint import, measurement tools, product catalog, 3D view, AI assist, and BOQ export.",
  path: "/planner/features",
});

export { SITE_BRAND };
