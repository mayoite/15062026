"use client";

import type { ReactNode } from "react";
import { Boxes, CheckCircle2, LayoutDashboard, Ruler } from "lucide-react";

import {
  PLANNER_STEPS,
  PLANNER_STEP_LABELS,
  type PlannerStep,
} from "@/features/planner/editor/plannerStep";

const STEP_ICONS: Record<PlannerStep, ReactNode> = {
  room: <LayoutDashboard size={13} aria-hidden />,
  catalog: <Boxes size={13} aria-hidden />,
  measure: <Ruler size={13} aria-hidden />,
  review: <CheckCircle2 size={13} aria-hidden />,
};

interface PlannerStepBarProps {
  current: PlannerStep;
  disabledSteps?: Partial<Record<PlannerStep, boolean>>;
  onChange: (step: PlannerStep) => void;
  compact?: boolean;
}

export function PlannerStepBar({
  current,
  disabledSteps = {},
  onChange,
  compact = false,
}: PlannerStepBarProps) {
  const currentIndex = PLANNER_STEPS.indexOf(current);

  return (
    <nav className="pw-step-bar" aria-label="Planner workflow">
      {PLANNER_STEPS.map((step, index) => {
        const isActive = step === current;
        const isDone = index < currentIndex;
        const isDisabled = Boolean(disabledSteps[step]);

        return (
          <button
            key={step}
            type="button"
            className="pw-step-bar__btn"
            data-active={isActive}
            data-done={isDone}
            aria-current={isActive ? "step" : undefined}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            title={PLANNER_STEP_LABELS[step]}
            onClick={() => {
              if (!isDisabled) onChange(step);
            }}
          >
            <span className="pw-step-bar__icon" aria-hidden>
              {isDone ? <CheckCircle2 size={13} /> : STEP_ICONS[step]}
            </span>
            {!compact && <span className="pw-step-bar__label">{PLANNER_STEP_LABELS[step]}</span>}
          </button>
        );
      })}
    </nav>
  );
}
