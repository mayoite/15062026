"use client";

import Link from "next/link";
import { HelpCircle } from "lucide-react";

import { OnboardingCoach } from "@/features/planner/onboarding/OnboardingCoach";
import { PLANNER_ONBOARDING_STEPS } from "../onboarding/steps";

interface PlannerCanvasEnhancementsProps {
  guestMode?: boolean;
}

export function PlannerCanvasEnhancements({ guestMode = false }: PlannerCanvasEnhancementsProps) {
  return (
    <>
      <Link
        href="/planner/help/"
        data-coach="help-link"
        className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-black/70"
        aria-label="Open planner help"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        Help
      </Link>

      <OnboardingCoach
        plannerType={guestMode ? "planner-guest" : "planner"}
        steps={PLANNER_ONBOARDING_STEPS}
      />
    </>
  );
}
