"use client";

import { useEffect, useState } from "react";

import {
  subscribePlannerFabricRuntimeState,
} from "@/features/planner/canvas-fabric";
import { getEditorSelectionStatus } from "@/features/planner/editor/editorSelectionStatus";
import { getPageMetrics, type PlanMetrics } from "@/features/planner/editor/planMetrics";

export function useFabricPlanMetrics(): PlanMetrics {
  const [metrics, setMetrics] = useState<PlanMetrics>(() => getPageMetrics(null));

  useEffect(() => {
    const unsubscribe = subscribePlannerFabricRuntimeState(() => {
      setMetrics(getPageMetrics(null));
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return metrics;
}

export function useFabricSelectionStatus(): string | null {
  const [status, setStatus] = useState<string | null>(() => getEditorSelectionStatus());

  useEffect(() => {
    const unsubscribe = subscribePlannerFabricRuntimeState(() => {
      setStatus(getEditorSelectionStatus());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
