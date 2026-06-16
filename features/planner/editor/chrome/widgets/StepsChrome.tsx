"use client";

import { PlannerStepBar } from "@/features/planner/editor/PlannerStepBar";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

interface StepsChromeProps {
  current: PlannerStep;
  disabledSteps: Partial<Record<PlannerStep, boolean>>;
  onChange: (step: PlannerStep) => void;
}

export function StepsChrome({ current, disabledSteps, onChange }: StepsChromeProps) {
  return (
    <PlannerStepBar
      current={current}
      disabledSteps={disabledSteps}
      onChange={onChange}
      compact
      showIntro={false}
    />
  );
}
