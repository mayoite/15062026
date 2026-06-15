"use client";

import type { ReactNode } from "react";
import { CheckCircle2, DoorOpen, PencilRuler } from "lucide-react";

import {
  PLANNER_STEP_DETAILS,
  PLANNER_STEPS,
  PLANNER_STEP_LABELS,
  type PlannerStep,
} from "@/features/planner/editor/plannerStep";

const STEP_ICONS: Record<PlannerStep, ReactNode> = {
  draw: <PencilRuler size={13} aria-hidden />,
  place: <DoorOpen size={13} aria-hidden />,
  review: <CheckCircle2 size={13} aria-hidden />,
};

interface PlannerStepBarProps {
  current: PlannerStep;
  disabledSteps?: Partial<Record<PlannerStep, boolean>>;
  onChange: (step: PlannerStep) => void;
  compact?: boolean;
  showIntro?: boolean;
}

export function PlannerStepBar({
  current,
  disabledSteps = {},
  onChange,
  compact = false,
  showIntro = false,
}: PlannerStepBarProps) {
  const currentIndex = PLANNER_STEPS.indexOf(current);
  const introHintId = "pw-step-bar-intro-hint";

  return (
    <nav
      className="pw-step-bar"
      data-compact={compact || undefined}
      data-intro={showIntro || undefined}
      data-current={current}
      aria-label="Planner workflow"
      aria-describedby={showIntro ? introHintId : undefined}
    >
      {showIntro ? (
        <div className="pw-step-bar__intro-card">
          <p className="pw-step-bar__eyebrow">Welcome to your planner</p>
          {!compact ? (
            <p className="pw-step-bar__summary">
              Start with Draw to map walls and rooms, then place products and review your layout.
            </p>
          ) : null}
          <p id={introHintId} className="pw-step-bar__hint">
            {compact
              ? "Tap any step to jump ahead or go back."
              : "Click any step below to jump ahead or revisit an earlier stage."}
          </p>
        </div>
      ) : (
        <div className="pw-step-bar__intro">
          <p className="pw-step-bar__eyebrow">Guided workflow</p>
          {!compact ? (
            <p className="pw-step-bar__summary">
              Work through Draw, Place, and Review — or jump back anytime.
            </p>
          ) : null}
        </div>
      )}
      <p className="pw-step-bar__steps-label">Steps</p>
      <div
        className="pw-step-bar__steps"
        style={{ ["--pw-step-count" as string]: String(PLANNER_STEPS.length) }}
      >
        {PLANNER_STEPS.map((step, index) => {
          const isActive = step === current;
          const isDone = index < currentIndex;
          const isDisabled = Boolean(disabledSteps[step]);
          const stepLabel = `${PLANNER_STEP_LABELS[step]}: ${PLANNER_STEP_DETAILS[step]}`;

          return (
            <button
              key={step}
              type="button"
              className="pw-step-bar__btn"
              data-step={step}
              data-active={isActive}
              data-done={isDone}
              data-disabled={isDisabled || undefined}
              data-jumpable={showIntro && !isActive && !isDisabled ? true : undefined}
              aria-current={isActive ? "step" : undefined}
              aria-disabled={isDisabled}
              aria-label={
                isDisabled
                  ? `${stepLabel} (unavailable)`
                  : showIntro && !isActive
                    ? `Jump to ${stepLabel}`
                    : stepLabel
              }
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onChange(step);
              }}
            >
              <span className="pw-step-bar__icon" aria-hidden>
                {isDone ? <CheckCircle2 size={14} /> : STEP_ICONS[step]}
              </span>
              {!compact ? (
                <span className="pw-step-bar__copy">
                  <span className="pw-step-bar__label">
                    <span className="pw-step-bar__index">{index + 1}</span>
                    {PLANNER_STEP_LABELS[step]}
                  </span>
                  <span className="pw-step-bar__detail">{PLANNER_STEP_DETAILS[step]}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
