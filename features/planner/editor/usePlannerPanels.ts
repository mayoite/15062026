"use client";

import { useCallback, useEffect, useState } from "react";

const COMPACT_QUERY = "(max-width: 1023px)";

export function usePlannerPanels() {
  const [isCompact, setIsCompact] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(COMPACT_QUERY);
    const sync = () => {
      const compact = mq.matches;
      setIsCompact(compact);
      if (compact) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const closeAll = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  const toggleLeft = useCallback(() => {
    setLeftOpen((open) => {
      const next = !open;
      if (next) setRightOpen(false);
      return next;
    });
  }, []);

  const toggleRight = useCallback(() => {
    setRightOpen((open) => {
      const next = !open;
      if (next) setLeftOpen(false);
      return next;
    });
  }, []);

  const showLeft = !isCompact || leftOpen;
  const showRight = !isCompact || rightOpen;

  return {
    isCompact,
    leftOpen: showLeft,
    rightOpen: showRight,
    leftOpenRaw: leftOpen,
    rightOpenRaw: rightOpen,
    toggleLeft,
    toggleRight,
    closeAll,
    setLeftOpen,
    setRightOpen,
  };
}
