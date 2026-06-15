"use client";

import { useEffect, type ReactNode } from "react";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

import { ProjectSetupStep } from "./ProjectSetupStep";
import {
  isProjectSetupCompleteInStorage,
  projectSetupStorageKey,
  type PlannerProjectMetadata,
} from "./projectSetup";

type ProjectSetupGateProps = {
  guestMode?: boolean;
  planId?: string;
  children: ReactNode;
};

/**
 * Blocks the canvas until project setup is complete.
 * Requires persisted metadata — a stale localStorage flag alone is not enough.
 */
export function ProjectSetupGate({ guestMode = false, planId, children }: ProjectSetupGateProps) {
  const projectMetadata = usePlannerWorkspaceStore((state) => state.projectMetadata);
  const ready = Boolean(projectMetadata?.completedAt);

  useEffect(() => {
    if (ready) return;
    if (typeof window === "undefined") return;
    if (!isProjectSetupCompleteInStorage(guestMode, planId)) return;
    localStorage.removeItem(projectSetupStorageKey(guestMode, planId));
  }, [guestMode, planId, ready]);

  const handleComplete = (_metadata: PlannerProjectMetadata) => {
    /* ProjectSetupStep persists metadata and storage flag via applyProjectSetup. */
  };

  if (!ready) {
    return <ProjectSetupStep guestMode={guestMode} planId={planId} onComplete={handleComplete} />;
  }

  return <>{children}</>;
}