import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { PLANNER_FEATURE_PAGES } from "./plannerFeaturePages";

export { PLANNER_FEATURE_PAGES };

export const PLANNER_HERO_IMAGES = [
  { src: "/images/hero/usha-hero.webp", alt: "Usha Workspace layout by One&Only" },
  { src: "/images/hero/27-06-2025 Image 03.webp", alt: "Office floor plan context by One&Only" },
  { src: "/images/hero/titan-patna-hq.webp", alt: "Corporate workspace by One&Only" },
] as const;

export const PLANNER_HERO = {
  kicker: "Office layout planner",
  lines: [
    "Plan your office layout",
    "before ordering furniture —",
    "no site visits needed.",
  ],
  accentLineIndex: 2,
  description:
    "Draw your floor, place real desks and storage from the One&Only catalog, and share a PDF layout with your team or vendor — built for Indian offices, not home makeovers.",
  primaryCta: {
    label: "Start planning your office (takes 3 minutes)",
    href: "/planner/guest/",
  },
  secondaryCta: {
    label: "Open saved layouts (member login)",
    href: "/planner/canvas/",
  },
  featuresCta: {
    label: "See how each feature helps",
    href: "/planner/features/",
  },
  helpCta: {
    label: "Get step-by-step help",
    href: "/planner/help/",
  },
  bottomCta: {
    title: "Try it free — no account needed to start.",
    body: "Sketch your layout as a guest. Sign in when you want to save, export PDFs, and pick up where you left off.",
    memberLoginLabel: "Sign in to save your work",
  },
} as const;

export const PLANNER_PROOF = [
  { value: String(PLANNER_CATALOG_ITEMS.length), label: "Furniture items ready to place" },
  { value: "2D + 3D", label: "See the layout from every angle" },
  { value: "PDF + quote", label: "Share layouts and request pricing" },
  { value: "Autosave", label: "Your work is never lost" },
] as const;

export const PLANNER_LANDING_FEATURE_SLUGS = [
  "blueprint",
  "catalog",
  "3d-view",
  "export",
] as const;

export const PLANNER_LANDING_FEATURES = PLANNER_LANDING_FEATURE_SLUGS.map((slug) => {
  const page = PLANNER_FEATURE_PAGES.find((entry) => entry.slug === slug);
  if (!page) throw new Error(`Missing planner feature: ${slug}`);
  return {
    slug: page.slug,
    href: `/planner/features/${page.slug}/`,
    title: page.title,
    tagline: page.tagline,
    body: page.summary,
  };
});

export const PLANNER_HOW_IT_WORKS = {
  eyebrow: "How it works",
  titleBefore: "Three steps from blank floor to ",
  titleAccent: "shareable",
  titleAfter: " layout",
} as const;

export const PLANNER_STEPS = [
  {
    step: "01",
    title: "Draw or import your floor outline",
    body: "Upload a PDF or image from your architect, or sketch the walls yourself — takes about 2 minutes.",
  },
  {
    step: "02",
    title: "Pick furniture from the catalog and drop it in",
    body: "Drag desks, benches, and cabinets into place. Everything snaps to real-world sizes.",
  },
  {
    step: "03",
    title: "Export a PDF layout and request a quote",
    body: "Download a branded floor plan and auto-generate a quote request from the items you placed.",
  },
] as const;