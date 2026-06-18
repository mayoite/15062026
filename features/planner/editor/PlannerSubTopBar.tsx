"use client";

import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, RotateCcw } from "lucide-react";
import { FabricCanvasSubToolbar } from "@/features/planner/canvas-fabric/FabricCanvasSubToolbar";
import { ZoomControl } from "@/features/planner/canvas-fabric/components/ZoomControl";
import { useFloorplan } from "@/features/planner/canvas-fabric";

interface PlannerSubTopBarProps {
  viewMode: "2d" | "3d" | "split";
  onViewModeChange: (mode: "2d" | "3d" | "split") => void;
  leftOpen: boolean;
  rightOpen: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleLeftCollapsed?: () => void;
  onToggleRightCollapsed?: () => void;
  onResetLayout?: () => void;
  onOpenExport?: () => void;
}

export function PlannerSubTopBar({
  viewMode,
  onViewModeChange,
  leftOpen,
  rightOpen,
  leftCollapsed,
  rightCollapsed,
  onToggleLeft,
  onToggleRight,
  onToggleLeftCollapsed,
  onToggleRightCollapsed,
  onResetLayout,
  onOpenExport,
}: PlannerSubTopBarProps) {
  const { zoom, setZoom } = useFloorplan();

  return (
    <div className="pw-subtopbar-shell">
      <div className="pw-subtopbar pw-subtopbar--access" role="group" aria-label="Workspace panels">
        <button
          type="button"
          className="pw-access-chrome__btn pw-icon-btn"
          aria-label="Reset planner layout"
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
          {leftCollapsed ? (
            <PanelLeftOpen size={16} strokeWidth={2} aria-hidden />
          ) : (
            <PanelLeftClose size={16} strokeWidth={2} aria-hidden />
          )}
        </button>
        <button
          type="button"
          className="pw-access-chrome__btn pw-icon-btn"
          data-active={rightCollapsed || undefined}
          aria-label={rightCollapsed ? "Expand layers panel rail" : "Collapse layers panel rail"}
          aria-pressed={rightCollapsed}
          disabled={!onToggleRightCollapsed}
          onClick={onToggleRightCollapsed}
        >
          {rightCollapsed ? (
            <PanelRightOpen size={16} strokeWidth={2} aria-hidden />
          ) : (
            <PanelRightClose size={16} strokeWidth={2} aria-hidden />
          )}
        </button>
      </div>

      {viewMode !== "3d" ? <FabricCanvasSubToolbar onExport={onOpenExport} /> : null}

      <div className="pw-subtopbar pw-subtopbar--view" data-coach="view-toggle">
        <div className="pw-segment pw-segment--compact">
          {(["2d", "3d"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className="pw-segment-btn"
              data-active={viewMode === mode}
              aria-pressed={viewMode === mode}
            >
              {mode === "2d" ? "2D" : "3D"}
            </button>
          ))}
        </div>
        <ZoomControl zoom={zoom} onZoomChange={setZoom} />
      </div>
    </div>
  );
}
