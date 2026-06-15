"use client";

import { OnboardingCoach } from "@/features/planner/onboarding/OnboardingCoach";
import { PLANNER_ONBOARDING_STEPS } from "../onboarding/steps";

interface PlannerCanvasEnhancementsProps {
  guestMode?: boolean;
}

export function PlannerCanvasEnhancements({ guestMode = false }: PlannerCanvasEnhancementsProps) {
  return (
    <>
      <OnboardingCoach
        plannerType={guestMode ? "planner-guest" : "planner"}
        steps={PLANNER_ONBOARDING_STEPS}
      />
    </>
  );
}
