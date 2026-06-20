import { PlannerLandingPage } from "@/features/planner/landing/PlannerLandingPage";
import { SITE_URL } from "@/lib/siteUrl";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/helpers/seo";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = buildPageMetadata(SITE_URL, {
  title: "Workspace Planner — Design Your Office Layout",
  description:
    "Plan desks, zones, and equipment on mm-accurate floor plans. 2D and 3D views, AI layout assist, and branded PDF export for client-ready proposals.",
  path: "/planner",
  keywords: [
    "workspace planner",
    "office layout tool",
    "floor plan furniture",
    "office space planning",
    "2D floor plan",
    "3D office planner",
    "One&Only planner",
  ],
});

const PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/planner",
  title: "Workspace Planner — Design Your Office Layout",
  description:
    "Plan desks, zones, and equipment on mm-accurate floor plans with 2D, 3D, and branded PDF export.",
  pageType: "WebPage",
});

export default function PlannerLandingRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(PAGE_JSON_LD) }}
      />
      <PlannerLandingPage />
    </>
  );
}
