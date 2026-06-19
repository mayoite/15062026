"use client";

import dynamic from "next/dynamic";

import { Providers } from "@/features/planner/components/Providers";
import { ProjectSetupGate } from "@/features/planner/onboarding/ProjectSetupGate";
import { PlannerSkeleton } from "@/features/planner/ui/PlannerSkeleton";
import { PlannerCanvasEnhancements } from "./PlannerCanvasEnhancements";

const PlannerWorkspace = dynamic(
  () =>
    import("@/features/planner/editor/PlannerWorkspace").then((mod) => ({
      default: mod.PlannerWorkspace,
    })),
  { loading: () => <PlannerSkeleton />, ssr: false },
);

export function PlannerWorkspaceRoute({
  guestMode = false,
  planId,
}: {
  guestMode?: boolean;
  planId?: string;
}) {
  return (
    <Providers>
      <ProjectSetupGate guestMode={guestMode} planId={planId}>
        <PlannerWorkspace guestMode={guestMode} planId={planId} />
        <PlannerCanvasEnhancements guestMode={guestMode} />
      </ProjectSetupGate>
    </Providers>
  );
}
