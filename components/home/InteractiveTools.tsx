"use client";

import { PlannerToolsShowcase } from "@/features/planner/landing/PlannerToolsShowcase";
import { HOMEPAGE_PLANNER_SUITE_CONTENT } from "@/lib/site-data/homepage";

export function InteractiveTools() {
  return (
    <PlannerToolsShowcase
      testId="home-tools"
      headingLevel="h2"
      kicker="Workspace planning"
      title={{ lead: "Design your ", accent: "workspace" }}
      description="True-scale floor plans with catalog furniture, zones, and dimensions — export layouts before you quote."
      primaryCta={{
        label: "Launch planner",
        href: HOMEPAGE_PLANNER_SUITE_CONTENT.overviewHref,
      }}
      demoHref="/planner/"
      demoTestId="home-tools-floorplan"
      variant="homepage"
      reveal="inView"
    />
  );
}
