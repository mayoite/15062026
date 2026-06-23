"use client";

import dynamic from "next/dynamic";
import { ProjectSetupGate } from "@/features/planner/onboarding/ProjectSetupGate";

const PlannerWorkspace = dynamic(
  () =>
    import("@/features/planner/editor/PlannerWorkspace").then((mod) => ({
      default: mod.PlannerWorkspace,
    })),
  { ssr: false },
);
const PlannerCanvasEnhancements = dynamic(
  () =>
    import("./PlannerCanvasEnhancements").then((mod) => ({
      default: mod.PlannerCanvasEnhancements,
    })),
  { ssr: false, loading: () => null },
);

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
