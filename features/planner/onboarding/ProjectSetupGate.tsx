"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

import { ProjectSetupStep } from "./ProjectSetupStep";
import { StartingPointStep } from "./StartingPointStep";
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
  const [isFullyComplete, setIsFullyComplete] = useState(false);
  const [wizardStep, setWizardStep] = useState<"metadata" | "startingPoint">("metadata");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsHydrated(true);
    
    // If it's already complete in storage, bypass the wizard entirely
    if (isProjectSetupCompleteInStorage(guestMode, planId)) {
      setIsFullyComplete(true);
    }
  }, [guestMode, planId]);

  if (!isHydrated) return null;

  if (isFullyComplete) {
    return <>{children}</>;
  }

  // Step 1: Collect Project Metadata
  if (wizardStep === "metadata") {
    return (
      <ProjectSetupStep 
        guestMode={guestMode} 
        planId={planId} 
        onComplete={() => setWizardStep("startingPoint")} 
      />
    );
  }

  // Step 2: Choose Starting Point
  if (wizardStep === "startingPoint") {
    return (
      <StartingPointStep 
        guestMode={guestMode} 
        planId={planId} 
        onComplete={() => setIsFullyComplete(true)} 
      />
    );
  }

  return null;
}