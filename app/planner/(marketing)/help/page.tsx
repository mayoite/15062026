import { PlannerHelpPage } from "@/features/planner/help/PlannerHelpPage";
import { SITE_URL } from "@/lib/siteUrl";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/helpers/seo";

export const metadata = buildPageMetadata(SITE_URL, {
  title: "Planner Help — Workspace Layout Guide",
  description:
    "Learn how to draw walls, place furniture, measure areas, use AI assist, and export branded PDF floor plans.",
  path: "/planner/help",
  keywords: ["planner help", "floor plan guide", "workspace layout tutorial"],
});

const PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/planner/help",
  title: "Planner Help — Workspace Layout Guide",
  description: "Help center for the One&Only workspace planner.",
  pageType: "WebPage",
});

export default function PlannerHelpRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_JSON_LD) }}
      />
      <PlannerHelpPage />
    </>
  );
}
