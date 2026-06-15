"use client";

import { AiAdvisorTrigger } from "@/lib/ai/AiAdvisorPanel";
import { OnboardingCoach, OANDO_ONBOARDING_STEPS } from "@/lib/ui/OnboardingCoach";
import { SmartLayoutPanel } from "@/lib/ui/SmartLayoutEngine";

/**
 * Oando Planner Enhancements — features that surpass SmartDraw/Planner5D/3DPlanner:
 * - AI Layout Advisor (contextual chat)
 * - Smart Layout Generator (one-click templates)
 * - Professional Onboarding Coach (guided tour)
 */
export function OandoPlannerEnhancements() {
  return (
    <>
      <AiAdvisorTrigger context={{ plannerType: "oando" }} />
      <SmartLayoutPanel />
      <OnboardingCoach plannerType="oando" steps={OANDO_ONBOARDING_STEPS} />
    </>
  );
}
