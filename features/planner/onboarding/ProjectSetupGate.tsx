"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ProjectSetupStep } from "./ProjectSetupStep";
import { StartingPointStep } from "./StartingPointStep";
import {
  isProjectSetupCompleteInStorage,
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
    
    // Defer state update to avoid synchronous setState inside useEffect warning
    const timer = setTimeout(() => {
      setIsHydrated(true);
      if (isProjectSetupCompleteInStorage(guestMode, planId)) {
        setIsFullyComplete(true);
      }
    }, 0);
    return () => clearTimeout(timer);
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