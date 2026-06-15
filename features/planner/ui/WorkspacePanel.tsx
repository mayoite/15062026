"use client";

import { motion, useDragControls } from "framer-motion";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useState } from "react";

export const DEFAULT_PLANNER_PANEL_WIDTH_PX = 320;
export const DEFAULT_PLANNER_PANEL_DOCK_GAP_PX = 16;
export const PLANNER_PANEL_WIDTH_CSS_VAR = "--planner-panel-width";
export const PLANNER_PANEL_DOCK_GAP_CSS_VAR = "--planner-panel-dock-gap";

interface WorkspacePanelProps {
  id: string;
  side: "left" | "right";
  children: ReactNode;
  onFocus?: () => void;
  isActive?: boolean;
  docked?: boolean;
  offsetPx?: number;
  topPx?: number;
}

/* ─────────────────────────────────────────────
   WorkspacePanel
   A dedicated abstraction for floating CAD panels.
   Handles drag constraints, z-index elevation,
   and entry/exit motion physics.
   ───────────────────────────────────────────── */

export function WorkspacePanel({
  id,
  side,
  children,
  onFocus,
  isActive = false,
  docked = false,
  offsetPx = 0,
  topPx = 16,
}: WorkspacePanelProps) {
  // Use local state fallback for elevation if external manager isn't strictly hooked
  const [localZ, setLocalZ] = useState(isActive ? 60 : 50);
  const dragControls = useDragControls();

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    setLocalZ(60);
    if (onFocus) onFocus();
    if (docked || event.button !== 0) return;

    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        'button, input, textarea, select, option, label, a, summary, [role="button"], [data-panel-interactive="true"]',
      )
    ) {
      return;
    }
    if (!target?.closest('[data-panel-drag-handle="true"]')) return;

    dragControls.start(event);
  };

  return (
    <motion.div
      id={id}
      drag={!docked}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      initial={false}
      onPointerDown={handlePointerDown}
      onPointerUp={() => {
        if (!docked) setLocalZ(50);
      }}
      style={{
        zIndex: isActive ? 60 : localZ,
        ...(docked
          ? { [side]: offsetPx, top: topPx, bottom: "var(--planner-panel-dock-gap)" }
          : { [side]: `calc(var(--planner-panel-dock-gap) + ${offsetPx}px)`, top: topPx }),
      }}
      className={
        docked
          ? `absolute ${
              side === "left" ? "rounded-r-xl border-r" : "rounded-l-xl border-l"
            } w-min-panel shadow-theme-float bg-panel border-theme-soft overflow-hidden backdrop-blur-xl`
          : `absolute w-min-panel shadow-theme-float rounded-[1.4rem] cursor-grab active:cursor-grabbing bg-panel border border-theme-soft overflow-hidden backdrop-blur-xl`
      }
    >
      <div className={`${docked ? "h-full" : "h-smartdraw-panel"} pointer-events-auto flex flex-col`}>
        {children}
      </div>
    </motion.div>
  );
}
