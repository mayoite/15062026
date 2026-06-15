"use client";
import { useState, useEffect, useRef } from "react";
import { useFocusTrap } from "@/features/oando-planner/hooks/useFocusTrap";
import { useEscapeDismiss } from "@/features/oando-planner/hooks/useEscapeDismiss";

const STORAGE_KEY = "oofpl_onboarding_complete";

const steps = [
  {
    target: "toolbar",
    title: "Drawing Tools",
    description: "Choose a tool to start drawing walls, rooms, or placing furniture. On mobile, use the toolbar at the bottom.",
    position: "right" as const,
  },
  {
    target: "canvas",
    title: "Your Canvas",
    description: "Tap to draw. Use two fingers to pan and zoom. Long-press for more options.",
    position: "center" as const,
  },
  {
    target: "right-panel-area",
    title: "Catalog & Properties",
    description: "Browse the furniture catalog or edit selected item properties. On mobile, tap the button that appears when you select an item.",
    position: "left" as const,
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const tourCardRef = useRef<HTMLDivElement>(null);

  // Trap focus within the tour card when visible
  useFocusTrap(tourCardRef, show);

  // Allow Escape key to skip/close the tour
  const complete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  useEscapeDismiss(complete, show);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setShow(true), 800);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!show) return null;

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      complete();
    }
  };

  const current = steps[step];

  const getPositionClasses = () => {
    if (isMobile) {
      return "left-4 right-4 top-1/2 -translate-y-1/2";
    }
    if (current.position === "right") return "left-[260px] top-[120px]";
    if (current.position === "center") return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
    return "right-[300px] top-[120px]";
  };

  return (
    <div className="fixed inset-0 z-90 pointer-events-none">
      {/* Overlay backdrop using brand token */}
      <div className="absolute inset-0 bg-(--overlay-inverse-18) pointer-events-none" />
      <div className={`absolute ${getPositionClasses()} pointer-events-auto z-91`}>
        {/* Tour card using brand surface and border tokens */}
        <div
          ref={tourCardRef}
          className="bg-(--surface-inverse) border border-(--border-soft) rounded-xl shadow-2xl p-5 w-72 max-w-[calc(100vw-2rem)]"
          role="dialog"
          aria-modal="true"
          aria-label="Onboarding tour"
        >
          <div className="flex items-center gap-2 mb-1">
            {/* Step indicator using accent color */}
            <span className="text-xs text-(--color-accent) font-medium">
              Step {step + 1} of {steps.length}
            </span>
          </div>
          {/* Title using inverse text token */}
          <h3 className="text-(--text-inverse) font-semibold text-sm mb-1">{current.title}</h3>
          {/* Description using muted inverse text */}
          <p className="text-(--text-inverse) opacity-50 text-xs leading-relaxed mb-4">{current.description}</p>
          <div className="flex items-center justify-between">
            <button
              onClick={complete}
              className="text-xs text-(--text-inverse) opacity-30 hover:opacity-60 transition-opacity min-h-[44px] px-2"
            >
              Skip
            </button>
            {/* Primary action button using accent/primary tokens */}
            <button
              onClick={next}
              className="px-4 py-2 rounded-lg bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--text-inverse) text-xs font-medium transition-colors min-h-[44px]"
            >
              {step < steps.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
          {/* Step dots using accent and inverse tokens */}
          <div className="flex gap-1.5 justify-center mt-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === step ? "bg-(--color-accent)" : "bg-(--text-inverse) opacity-15"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
