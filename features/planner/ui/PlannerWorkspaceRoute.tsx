"use client";

import dynamic from "next/dynamic";

import { Providers } from "@/features/planner/components/Providers";
import { PlannerSkeleton } from "@/features/planner/ui/PlannerSkeleton";

const UnifiedPlannerPage = dynamic(
  () =>
    import("@/features/planner/ui/UnifiedPlannerPage").then((mod) => ({
      default: mod.UnifiedPlannerPage,
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
      <UnifiedPlannerPage guestMode={guestMode} planId={planId} />
    </Providers>
  );
}
