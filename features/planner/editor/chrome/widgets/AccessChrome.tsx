"use client";

import { PanelLeftClose, PanelLeftOpen, PanelRightOpen, RotateCcw } from "lucide-react";

interface AccessChromeProps {
  leftOpen: boolean;
  rightOpen: boolean;
  leftCollapsed?: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleLeftCollapsed?: () => void;
  onResetLayout?: () => void;
}

export function AccessChrome({
  leftOpen,
  rightOpen,
  leftCollapsed = false,
  onToggleLeft,
  onToggleRight,
  onToggleLeftCollapsed,
  onResetLayout,
}: AccessChromeProps) {
  return (
    <div className="pw-access-chrome" role="group" aria-label="Workspace panels and layout">
      <button
        type="button"
        className="pw-access-chrome__btn pw-icon-btn"
        data-active={leftOpen || undefined}
        aria-label={leftOpen ? "Close library panel" : "Open library panel"}
        aria-pressed={leftOpen}
        onClick={onToggleLeft}
      >
        <PanelLeftOpen size={16} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="pw-access-chrome__btn pw-icon-btn"
        data-active={rightOpen || undefined}
        aria-label={rightOpen ? "Close properties panel" : "Open properties panel"}
        aria-pressed={rightOpen}
        onClick={onToggleRight}
      >
        <PanelRightOpen size={16} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="pw-access-chrome__btn pw-icon-btn"
        aria-label="Reset planner chrome layout"
        disabled={!onResetLayout}
        onClick={onResetLayout}
      >
        <RotateCcw size={16} strokeWidth={2} aria-hidden />
      </button>
      <button
        type="button"
        className="pw-access-chrome__btn pw-icon-btn"
        data-active={leftCollapsed || undefined}
        aria-label={leftCollapsed ? "Expand left panel rail" : "Collapse left panel rail"}
        aria-pressed={leftCollapsed}
        disabled={!onToggleLeftCollapsed}
        onClick={onToggleLeftCollapsed}
      >
        <PanelLeftClose size={16} strokeWidth={2} aria-hidden />
      </button>
    </div>
  );
}
