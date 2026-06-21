"use client";

import { useState, useEffect, useCallback, useLayoutEffect } from "react";
import { X, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from "lucide-react";

export type CoachStep = {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right";
};

const STORAGE_KEY = "oando-onboarding-complete";

interface OnboardingCoachProps {
  plannerType: "oando" | "buddy" | "planner" | "planner-guest";
  steps: CoachStep[];
  respectDismissal?: boolean;
}

export function OnboardingCoach({
  plannerType,
  steps,
  respectDismissal = true,
}: OnboardingCoachProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [spotlight, setSpotlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (respectDismissal) {
      const key = `${STORAGE_KEY}-${plannerType}`;
      const dismissed = localStorage.getItem(key) === "true";
      const t = setTimeout(() => {
        setIsDismissed(dismissed);
        setIsVisible(!dismissed);
      }, 0);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => setIsVisible(true), 0);
    return () => clearTimeout(t);
  }, [plannerType, respectDismissal]);

  const handleComplete = useCallback(() => {
    const key = `${STORAGE_KEY}-${plannerType}`;
    localStorage.setItem(key, "true");
    setIsVisible(false);
    setIsDismissed(true);
  }, [plannerType]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length, handleComplete]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const step = steps[currentStep];
  const spotlightTarget = isVisible && !isDismissed && step?.target ? step.target : null;

  useLayoutEffect(() => {
    if (!spotlightTarget) return;

    let cancelled = false;
    const updateSpotlight = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-coach="${spotlightTarget}"]`);
      setSpotlight(el ? el.getBoundingClientRect() : null);
    };

    const raf = requestAnimationFrame(updateSpotlight);
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, [spotlightTarget]);

  const displaySpotlight = spotlightTarget ? spotlight : null;

  if (!isVisible || isDismissed || steps.length === 0) return null;

  const isLast = currentStep === steps.length - 1;
  const isFirst = currentStep === 0;
  const progress = ((currentStep + 1) / steps.length) * 100;
  const pad = 8;
  const spotlightStyle = displaySpotlight
    ? {
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.28)`,
        left: displaySpotlight.left - pad,
        top: displaySpotlight.top - pad,
        width: displaySpotlight.width + pad * 2,
        height: displaySpotlight.height + pad * 2,
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none" aria-hidden={false}>
      {displaySpotlight ? (
        <div
          className="absolute rounded-xl pointer-events-none ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={spotlightStyle}
          aria-hidden
        />
      ) : null}

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto w-[420px] max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl overflow-hidden bg-page border border-soft"
        role="dialog"
        aria-label="Onboarding Guide"
      >
        <div className="h-1 bg-muted">
          <div
            className="h-full transition-all duration-300 bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary text-inverse">
              <Lightbulb size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-strong">{step.title}</h4>
                <button
                  onClick={handleSkip}
                  className="p-1 rounded text-muted bg-hover-soft"
                  aria-label="Skip onboarding"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-body">
                {step.description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between border-t border-soft">
          <span className="text-xs text-subtle">
            {currentStep + 1} of {steps.length}
          </span>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-soft text-body bg-hover-soft transition-colors"
              >
                <ChevronLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-inverse hover:bg-primary-hover transition-colors"
            >
              {isLast ? (
                <>
                  <Sparkles size={12} /> Get Started
                </>
              ) : (
                <>
                  Next <ChevronRight size={12} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const OANDO_ONBOARDING_STEPS: CoachStep[] = [
  {
    id: "welcome",
    title: "Welcome to One&Only Space Planner",
    description:
      "Design professional office layouts with architectural-grade precision. Draw walls, place furniture from our catalog, and export branded PDFs — all in your browser.",
  },
  {
    id: "tools",
    title: "Drawing Tools",
    description:
      "Use the toolbar on the left to draw walls, add doors/windows, place furniture, and create zones. Each tool has keyboard shortcuts shown in tooltips.",
    target: "toolbar",
  },
  {
    id: "catalog",
    title: "Furniture Catalog",
    description:
      "Browse 300+ furniture items organized by category. Drag items onto your canvas — dimensions are accurate to manufacturer specs.",
    target: "catalog",
  },
  {
    id: "3d-view",
    title: "3D Visualization",
    description:
      "Switch to 3D view anytime to see your layout in perspective. Changes sync bidirectionally between 2D and 3D.",
    target: "3d-toggle",
  },
  {
    id: "ai-advisor",
    title: "AI Layout Advisor",
    description:
      "Click the AI Advisor button (bottom-right) for intelligent suggestions on furniture placement, zone optimization, and ergonomic compliance.",
    target: "ai-advisor",
  },
  {
    id: "export",
    title: "Professional Export",
    description:
      "Export branded PDFs with Bill of Quantities, or download your plan as JSON for cross-planner import. Better than any competitor's output.",
    target: "export",
  },
];

export const BUDDY_ONBOARDING_STEPS: CoachStep[] = [
  {
    id: "welcome",
    title: "Welcome to Buddy Workspace Planner",
    description:
      "Plan collaborative workspaces with intelligent seat allocation. Drop elements, assign teams, and optimize your floorplate — faster than any other tool.",
  },
  {
    id: "element-library",
    title: "Element Library",
    description:
      "Open the left sidebar to browse desks, tables, rooms, and equipment. Each element type has accurate dimensions and configurable seat counts.",
    target: "element-library",
  },
  {
    id: "smart-wizard",
    title: "Smart Space Wizard",
    description:
      "Use Ctrl+K or the command palette to access the Smart Wizard — it generates optimized layouts based on team size and space constraints automatically.",
    target: "smart-wizard",
  },
  {
    id: "zones",
    title: "Zone Planning",
    description:
      "Create named zones (Open Plan, Executive, Meeting, etc.) to organize your space logically. Zones track utilization and show capacity metrics.",
    target: "zones",
  },
  {
    id: "ai-advisor",
    title: "AI Layout Advisor",
    description:
      "Get AI-powered suggestions for furniture placement, team adjacency, and space optimization. Click the sparkle button in the bottom-right corner.",
    target: "ai-advisor",
  },
  {
    id: "export-boq",
    title: "BOQ & Export",
    description:
      "Export a professional Bill of Quantities as branded PDF, CSV, or JSON. Your output will look better than SmartDraw's — guaranteed.",
    target: "export",
  },
];
