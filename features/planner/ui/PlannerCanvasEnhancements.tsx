"use client";

import { useEffect } from "react";
import { applySuggestedLayout } from "@/features/planner/ai/applySuggestedLayout";
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { OnboardingCoach } from "@/features/planner/onboarding/OnboardingCoach";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { PLANNER_ONBOARDING_STEPS } from "../onboarding/steps";

interface PlannerCanvasEnhancementsProps {
  guestMode?: boolean;
}

export function PlannerCanvasEnhancements({ guestMode = false }: PlannerCanvasEnhancementsProps) {
  const pendingBootstrapLayout = usePlannerWorkspaceStore((s) => s.pendingBootstrapLayout);
  const setPendingBootstrapLayout = usePlannerWorkspaceStore((s) => s.setPendingBootstrapLayout);

  useEffect(() => {
    if (!pendingBootstrapLayout) return;

    let cancelled = false;
    let frameId = 0;

    const tryApplyBootstrap = () => {
      if (cancelled) return;

      const runtime = getPlannerFabricRuntime();
      if (!runtime) {
        frameId = window.requestAnimationFrame(tryApplyBootstrap);
        return;
      }

      const serializedDraft = runtime.exportDraft();
      if (serializedDraft) {
        try {
          const snapshot = JSON.parse(serializedDraft) as { objects?: unknown[] };
          if ((snapshot.objects?.length ?? 0) > 0) {
            setPendingBootstrapLayout(null);
            return;
          }
        } catch {
          // Ignore malformed draft snapshots and fall through to bootstrap.
        }
      }

      applySuggestedLayout(null, pendingBootstrapLayout);
      setPendingBootstrapLayout(null);
      frameId = window.requestAnimationFrame(() => {
        runtime.fitToContent();
      });
    };

    frameId = window.requestAnimationFrame(tryApplyBootstrap);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [pendingBootstrapLayout, setPendingBootstrapLayout]);

  return (
    <>
      <OnboardingCoach
        plannerType={guestMode ? "planner-guest" : "planner"}
        steps={PLANNER_ONBOARDING_STEPS}
      />
    </>
  );
}
