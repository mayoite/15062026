"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "planner_onboarded";

interface TooltipStep {
  text: string;
  position: { top?: string; left?: string; bottom?: string; right?: string };
}

const STEPS: TooltipStep[] = [
  {
    text: "Drag furniture from the catalog",
    position: { top: "50%", left: "260px" },
  },
  {
    text: "Use tools to draw walls",
    position: { top: "50%", left: "60px" },
  },
  {
    text: "Ask AI for help",
    position: { top: "12px", right: "60px" },
  },
];

/**
 * OnboardingTooltips — a 3-step floating tooltip sequence shown once per browser.
 * Checks localStorage(planner_onboarded). If set, renders nothing.
 */
interface OnboardingTooltipsProps {
  disabled?: boolean;
}

export function OnboardingTooltips({ disabled = false }: OnboardingTooltipsProps) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return typeof window === "undefined" || localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (isDismissed || disabled) return;
    const timer = setTimeout(() => {
      setStep((current) => current ?? 0);
    }, 800);
    return () => clearTimeout(timer);
  }, [disabled, isDismissed]);

  const complete = useCallback(() => {
    setStep(null);
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const handleNext = useCallback(() => {
    setStep((prev) => {
      if (prev === null) return null;
      if (prev >= STEPS.length - 1) {
        // Last step — complete
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // ignore
        }
        return null;
      }
      return prev + 1;
    });
  }, []);

  if (disabled || step === null) return null;

  const current = STEPS[step];
  if (!current) return null;

  return (
    <div className="onboarding-tooltips pointer-events-none absolute inset-0 z-50">
      <div
        className="onboarding-tooltip pointer-events-auto absolute"
        style={{
          ...current.position,
          transform: current.position.top === "50%" ? "translateY(-50%)" : undefined,
        }}
      >
        <div className="flex flex-col gap-2 rounded-xl border border-soft bg-panel px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-default">
            {current.text}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary rounded-md px-3 py-1 text-xs"
            >
              {step < STEPS.length - 1 ? "Next" : "Done"}
            </button>
            <button
              type="button"
              onClick={complete}
              className="text-xs text-muted underline hover:text-soft"
            >
              Skip
            </button>
          </div>
          <div className="mt-1 flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-4 rounded-full ${
                  i === step ? "bg-[var(--color-primary)]" : "bg-soft/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
