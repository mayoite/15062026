"use client";

import { AiAdvisorTrigger } from "@/lib/ai/AiAdvisorPanel";
import { OnboardingCoach, BUDDY_ONBOARDING_STEPS } from "@/lib/ui/OnboardingCoach";
import { SmartLayoutPanel } from "@/lib/ui/SmartLayoutEngine";

/**
 * Buddy Planner Enhancements — features that surpass SmartDraw/Planner5D/3DPlanner:
 * - AI Layout Advisor (contextual chat)
 * - Smart Layout Generator (one-click templates)
 * - Professional Onboarding Coach (guided tour)
 */
export function BuddyPlannerEnhancements() {
  return (
    <>
      <AiAdvisorTrigger context={{ plannerType: "buddy" }} />
      <SmartLayoutPanel />
      <OnboardingCoach plannerType="buddy" steps={BUDDY_ONBOARDING_STEPS} />
    </>
  );
}
