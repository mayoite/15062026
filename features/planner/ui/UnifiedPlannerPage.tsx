"use client";

import { PlannerWorkspace } from "@/features/planner/editor/PlannerWorkspace";
import { ProjectSetupGate } from "@/features/planner/onboarding/ProjectSetupGate";

import { PlannerCanvasEnhancements } from "./PlannerCanvasEnhancements";

export function UnifiedPlannerPage({
  guestMode = false,
  planId,
}: {
  guestMode?: boolean;
  planId?: string;
}) {
  return (
    <ProjectSetupGate guestMode={guestMode} planId={planId}>
      <PlannerWorkspace guestMode={guestMode} planId={planId} />
      <PlannerCanvasEnhancements guestMode={guestMode} />
    </ProjectSetupGate>
  );
}
