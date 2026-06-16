"use client";

import { useCallback, useEffect, useState } from "react";

import type { PlannerStep } from "@/features/planner/editor/plannerStep";

const COMPACT_QUERY = "(max-width: 1023px)";

export function getStepLeftOpenDefault(step: PlannerStep, isCompact: boolean): boolean {
  if (step === "place") return true;
  if (step === "draw" || step === "review") return false;
  return !isCompact;
}

/** Canvas-first desktop: properties panel only on Review; mobile uses overlay dock. */
export function getStepRightOpenDefault(step: PlannerStep, isCompact: boolean): boolean {
  if (isCompact) return step === "review";
  return step === "review";
}

export function getStepLeftEmphasis(step: PlannerStep): "muted" | "prominent" {
  return step === "place" ? "prominent" : "muted";
}

export function usePlannerPanels() {
  const [isCompact, setIsCompact] = useState(false);
  const [leftOpen, setLeftOpenState] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftManualOverride, setLeftManualOverride] = useState(false);

  const setLeftOpen = useCallback((open: boolean) => {
    setLeftManualOverride(true);
    setLeftOpenState(open);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(COMPACT_QUERY);
    const sync = () => {
      const compact = mq.matches;
      setIsCompact(compact);
      setLeftManualOverride(false);
      if (compact) {
        setLeftOpenState(false);
        setRightOpen(false);
      }
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const closeAll = useCallback(() => {
    setLeftManualOverride(true);
    setLeftOpenState(false);
    setRightOpen(false);
  }, []);

  const toggleLeft = useCallback(() => {
    setLeftManualOverride(true);
    setLeftOpenState((open) => {
      const next = !open;
      if (next) setRightOpen(false);
      return next;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen((open) => {
      const next = !open;
      if (next) {
        setLeftManualOverride(true);
        setLeftOpenState(false);
      }
      return next;
    });
  }, []);

  const applyStepLayout = useCallback((step: PlannerStep) => {
    if (!leftManualOverride) {
      setLeftOpenState(getStepLeftOpenDefault(step, isCompact));
    }

    if (isCompact) {
      if (step === "review") {
        setRightOpen(true);
        if (!leftManualOverride) setLeftOpenState(false);
        return;
      }

      if (step === "place") {
        if (!leftManualOverride) setLeftOpenState(true);
        setRightOpen(false);
        return;
      }

      if (!leftManualOverride) setLeftOpenState(false);
      setRightOpen(false);
      return;
    }

    setRightOpen(getStepRightOpenDefault(step, isCompact));
  }, [isCompact, leftManualOverride]);

  return {
    isCompact,
    leftOpen,
    rightOpen,
    leftOpenRaw: leftOpen,
    rightOpenRaw: rightOpen,
    leftManualOverride,
    toggleLeft,
    toggleRight,
    closeAll,
    applyStepLayout,
    setLeftOpen,
    setRightOpen,
  };
}