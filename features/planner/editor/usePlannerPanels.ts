"use client";

import { useCallback, useEffect, useState } from "react";

import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import {
  readPlannerWorkspacePreferences,
  writePlannerWorkspacePreferences,
} from "@/features/planner/editor/plannerWorkspacePreferences";

const COMPACT_QUERY = "(max-width: 1023px)";

export function getStepLeftOpenDefault(step: PlannerStep, isCompact: boolean): boolean {
  if (step === "place" || step === "draw") return true;
  if (step === "review") return false;
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

export function usePlannerPanels({ enabled = true }: { enabled?: boolean } = {}) {
  const [isCompact, setIsCompact] = useState(false);
  const [leftOpen, setLeftOpenState] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftManualOverride, setLeftManualOverride] = useState(false);
  const [rightManualOverride, setRightManualOverride] = useState(false);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const saved = readPlannerWorkspacePreferences();
      setLeftOpenState(saved.leftOpen);
      setRightOpen(saved.rightOpen);
      setLeftCollapsed(saved.leftCollapsed);
      setRightCollapsed(saved.rightCollapsed);
      setPreferencesHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !preferencesHydrated) return;
    writePlannerWorkspacePreferences({ leftOpen, rightOpen, leftCollapsed, rightCollapsed });
  }, [enabled, leftCollapsed, leftOpen, preferencesHydrated, rightCollapsed, rightOpen]);

  const setLeftOpen = useCallback((open: boolean) => {
    setLeftManualOverride(true);
    if (open) {
      setLeftCollapsed(false);
    }
    setLeftOpenState(open);
  }, []);

  const setRightOpenManual = useCallback((open: boolean) => {
    setRightManualOverride(true);
    setRightOpen(open);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(COMPACT_QUERY);
    const sync = () => {
      const compact = mq.matches;
      setIsCompact(compact);
      setLeftManualOverride(false);
      setRightManualOverride(false);
      if (compact) {
        setLeftCollapsed(false);
        setRightCollapsed(false);
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
    setRightManualOverride(true);
    setLeftOpenState(false);
    setRightOpen(false);
  }, []);

  const toggleLeft = useCallback(() => {
    setLeftManualOverride(true);
    setLeftOpenState((open) => {
      const next = !open;
      if (next) setLeftCollapsed(false);
      if (next) setRightOpen(false);
      return next;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightManualOverride(true);
    setRightOpen((open) => {
      const next = !open;
      if (next) {
        setRightCollapsed(false);
        setLeftManualOverride(true);
        setLeftOpenState(false);
      }
      return next;
    });
  }, []);

  const toggleRightCollapsed = useCallback(() => {
    if (isCompact) return;
    setRightCollapsed((collapsed) => {
      const next = !collapsed;
      setRightManualOverride(true);
      setRightOpen(true);
      return next;
    });
  }, [isCompact]);

  const toggleLeftCollapsed = useCallback(() => {
    if (isCompact) return;
    setLeftCollapsed((collapsed) => {
      const next = !collapsed;
      setLeftManualOverride(true);
      setLeftOpenState(true);
      return next;
    });
  }, [isCompact]);

  const applyStepLayout = useCallback((step: PlannerStep) => {
    if (!leftManualOverride) {
      setLeftOpenState(getStepLeftOpenDefault(step, isCompact));
      if (step === "place" && !isCompact) {
        setLeftCollapsed(false);
      }
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

    if (!rightManualOverride) {
      setRightOpen(getStepRightOpenDefault(step, isCompact));
    }
  }, [isCompact, leftManualOverride, rightManualOverride]);

  return {
    isCompact,
    leftOpen,
    rightOpen,
    leftCollapsed,
    rightCollapsed,
    leftOpenRaw: leftOpen,
    rightOpenRaw: rightOpen,
    leftManualOverride,
    rightManualOverride,
    toggleLeft,
    toggleRight,
    closeAll,
    applyStepLayout,
    setLeftOpen,
    setRightOpen: setRightOpenManual,
    toggleLeftCollapsed,
    toggleRightCollapsed,
  };
}
