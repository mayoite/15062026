"use client";


import { FabricCanvasSubToolbar } from "@/features/planner/canvas-fabric/FabricCanvasSubToolbar";
import { ZoomControl } from "@/features/planner/canvas-fabric/components/ZoomControl";
import { useFloorplan } from "@/features/planner/canvas-fabric";

interface PlannerSubTopBarProps {
  viewMode: "2d" | "3d" | "split";
  onViewModeChange: (mode: "2d" | "3d" | "split") => void;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  onToggleLeftCollapsed?: () => void;
  onToggleRightCollapsed?: () => void;
  onResetLayout?: () => void;
  onOpenExport?: () => void;
}

export function PlannerSubTopBar({
  viewMode,
  onViewModeChange,
  leftCollapsed,
  rightCollapsed,
  onToggleLeftCollapsed,
  onToggleRightCollapsed,
  onResetLayout,
  onOpenExport,
}: PlannerSubTopBarProps) {
  const { zoom, setZoom } = useFloorplan();

  return (
    <div className="pw-subtopbar-shell">


      {viewMode !== "3d" ? <FabricCanvasSubToolbar onExport={onOpenExport} /> : null}

      <div className="pw-subtopbar pw-subtopbar--view" data-coach="view-toggle">
        <div className="pw-segment pw-segment--compact">
          {(["2d", "3d", "split"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onViewModeChange(mode)}
              className="pw-segment-btn"
              data-active={viewMode === mode}
              aria-pressed={viewMode === mode}
            >
              {mode === "2d" ? "2D" : mode === "3d" ? "3D" : "Split"}
            </button>
          ))}
        </div>
        <ZoomControl zoom={zoom} onZoomChange={setZoom} />
      </div>
    </div>
  );
}
