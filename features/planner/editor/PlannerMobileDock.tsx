"use client";

import { LayoutGrid, PanelRightOpen, PenLine } from "lucide-react";

interface PlannerMobileDockProps {
  leftActive: boolean;
  rightActive: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onFocusCanvas: () => void;
}

export function PlannerMobileDock({
  leftActive,
  rightActive,
  onToggleLeft,
  onToggleRight,
  onFocusCanvas,
}: PlannerMobileDockProps) {
  return (
    <nav className="pw-mobile-dock" aria-label="Workspace panels">
      <button
        type="button"
        className="pw-mobile-dock-btn pwx-dock-btn"
        data-active={leftActive}
        onClick={onToggleLeft}
        aria-pressed={leftActive}
        aria-label="Element library"
      >
        <LayoutGrid size={20} strokeWidth={1.75} aria-hidden />
        <span>Library</span>
      </button>
      <button
        type="button"
        className="pw-mobile-dock-btn pwx-dock-btn"
        data-active={!leftActive && !rightActive}
        onClick={onFocusCanvas}
        aria-pressed={!leftActive && !rightActive}
        aria-label="Canvas"
      >
        <PenLine size={20} strokeWidth={1.75} aria-hidden />
        <span>Canvas</span>
      </button>
      <button
        type="button"
        className="pw-mobile-dock-btn pwx-dock-btn"
        data-active={rightActive}
        onClick={onToggleRight}
        aria-pressed={rightActive}
        aria-label="Properties and layers"
      >
        <PanelRightOpen size={20} strokeWidth={1.75} aria-hidden />
        <span>Properties</span>
      </button>
    </nav>
  );
}
