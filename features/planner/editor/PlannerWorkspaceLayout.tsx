import type { ReactNode } from "react";
import { PlannerMobileDock } from "@/features/planner/editor/PlannerMobileDock";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

export interface PlannerWorkspaceLayoutProps {
  topBar: ReactNode;
  subTopBar?: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  canvasArea: ReactNode;
  sessionDialog: ReactNode;
  templateModal: ReactNode;
  exportModal: ReactNode;
  dragOverlay: ReactNode;
  isCompact: boolean;
  plannerStep: PlannerStep;
  leftOpenRaw: boolean;
  rightOpenRaw: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  isCanvasDragging: boolean;
  closeAll: () => void;
  toggleLeft: () => void;
  toggleRight: () => void;
}

export function PlannerWorkspaceLayout({
  topBar,
  subTopBar,
  leftPanel,
  rightPanel,
  canvasArea,
  sessionDialog,
  templateModal,
  exportModal,
  dragOverlay,
  isCompact,
  plannerStep,
  leftOpenRaw,
  rightOpenRaw,
  leftCollapsed,
  rightCollapsed,
  isCanvasDragging,
  closeAll,
  toggleLeft,
  toggleRight,
}: PlannerWorkspaceLayoutProps) {
  return (
    <div className="pw-shell">
      {topBar}
      {subTopBar}

      <div
        className={`pw-workspace${isCompact ? " pw-workspace--compact" : ""}`}
        data-step={plannerStep}
        data-left-collapsed={!isCompact && leftCollapsed ? true : undefined}
        data-right-collapsed={!isCompact && rightCollapsed ? true : undefined}
        data-canvas-dragging={isCanvasDragging || undefined}
      >
        {isCompact && (leftOpenRaw || rightOpenRaw) ? (
          <button
            type="button"
            className="pw-panel-backdrop"
            aria-label="Close panel"
            onClick={closeAll}
          />
        ) : null}

        {leftPanel}
        
        {canvasArea}

        {rightPanel}

        {isCompact && (
          <PlannerMobileDock
            leftActive={leftOpenRaw}
            rightActive={rightOpenRaw}
            onToggleLeft={toggleLeft}
            onToggleRight={toggleRight}
            onFocusCanvas={closeAll}
          />
        )}
      </div>

      {templateModal}
      {sessionDialog}
      {dragOverlay}
      {exportModal}
    </div>
  );
}
