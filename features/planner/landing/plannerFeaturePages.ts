import type { LucideIcon } from "lucide-react";
import {
  Box,
  FileText,
  Layers3,
  Ruler,
  Sparkles,
} from "lucide-react";

export type PlannerFeaturePage = {
  slug: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  summary: string;
  bullets: string[];
  helpSectionId: string;
  tryPath: string;
  memberPath: string;
  /** Slugs of complementary features cross-linked from the detail page */
  relatedSlugs: string[];
};

export const PLANNER_FEATURE_PAGES: PlannerFeaturePage[] = [

  {
    slug: "measure",
    title: "Check room sizes before you commit to furniture orders",
    tagline: "Dimensions and area totals",
    icon: Ruler,
    summary:
      "Measure walls, check room areas, and confirm everything fits — so you can walk into procurement meetings with numbers, not guesses.",
    bullets: [
      "Click any wall or span to see its length in millimetres",
      "Room and zone areas add up automatically as you draw",
      "Measurements match what you will see on exported PDFs",
      "Switch to a 3D view to double-check spacing while you measure",
    ],
    helpSectionId: "measurements",
    tryPath: "/planner/guest/",
    memberPath: "/planner/canvas/",
    relatedSlugs: ["export"],
  },
  {
    slug: "catalog",
    title: "Drag and drop desks and cabinets to see your floor instantly",
    tagline: "Real furniture, real sizes",
    icon: Layers3,
    summary:
      "Pick desks, benches, storage, and meeting tables from the One&Only catalog — every item drops in at its actual dimensions.",
    bullets: [
      "Search and filter by product family — workstations, storage, meeting tables",
      "Drag from the library or click to place items on your floor plan",
      "Every symbol matches a real One&Only product, not generic clip art",
      "Resize, rotate, and adjust seating count from the side panel",
    ],
    helpSectionId: "catalog-and-blocks",
    tryPath: "/planner/guest/",
    memberPath: "/planner/canvas/",
    relatedSlugs: ["ai-assist", "3d-view"],
  },
  {
    slug: "3d-view",
    title: "Walk through your layout in 3D before anything gets delivered",
    tagline: "See height and spacing at a glance",
    icon: Box,
    summary:
      "Flip between a flat floor plan, a 3D walkthrough, or a split view — same layout, so you can spot clearance issues before sign-off.",
    bullets: [
      "Switch between flat plan, 3D view, and side-by-side split anytime",
      "Walls and furniture rise from your layout automatically",
      "Orbit around the room to preview how it will feel on site",
      "No extra export step — preview depth right inside the planner",
    ],
    helpSectionId: "canvas-basics",
    tryPath: "/planner/guest/",
    memberPath: "/planner/canvas/",
    relatedSlugs: ["catalog", "export"],
  },
  {
    slug: "ai-assist",
    title: "Describe your office and get a starting layout in seconds",
    tagline: "Help when you are not sure where to begin",
    icon: Sparkles,
    summary:
      "Tell the planner how many people you need to seat and what kind of space you have — it suggests a starting arrangement you can adjust.",
    bullets: [
      "Chat about your room size, headcount, and layout goals",
      "Pick from common office templates — open plan, cabins, hybrid",
      "Preview suggested furniture placements before you commit",
      "Works in guest mode so you can explore before signing in",
    ],
    helpSectionId: "ai-assistant",
    tryPath: "/planner/guest/",
    memberPath: "/planner/canvas/",
    relatedSlugs: ["catalog", "3d-view"],
  },
  {
    slug: "export",
    title: "Send a PDF layout and quote request to your vendor in one click",
    tagline: "Share with procurement or leadership",
    icon: FileText,
    summary:
      "Download a branded PDF floor plan with an itemised quote table — ready to email to your vendor, facilities head, or finance team.",
    bullets: [
      "Export a polished PDF from the toolbar in one click",
      "Save your layout as a file for backup or handoff to a colleague",
      "Quote table lists every catalog item you placed, with quantities",
      "Signed-in members can save projects and return to them later",
    ],
    helpSectionId: "export-and-share",
    tryPath: "/planner/guest/",
    memberPath: "/planner/canvas/",
    relatedSlugs: ["measure", "catalog"],
  },
];

export type PlannerFeatureSlug = (typeof PLANNER_FEATURE_PAGES)[number]["slug"];

export const PLANNER_FEATURE_BY_SLUG = Object.fromEntries(
  PLANNER_FEATURE_PAGES.map((page) => [page.slug, page]),
) as Record<PlannerFeatureSlug, PlannerFeaturePage>;

export function isPlannerFeatureSlug(slug: string): slug is PlannerFeatureSlug {
  return slug in PLANNER_FEATURE_BY_SLUG;
}