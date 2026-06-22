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
  isOnline?: boolean;
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
  isOnline = true,
}: PlannerWorkspaceLayoutProps) {
  return (
    <div className="pw-shell" data-offline={!isOnline ? "true" : undefined}>
      {!isOnline && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between shadow-md border-b border-orange-600/20 relative z-[9999] animate-pulse">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>
              Offline Mode: Saving changes to transactionally-safe IndexedDB. Changes will sync to cloud when connection is restored.
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => window.location.reload()} 
            className="bg-white/20 hover:bg-white/30 text-white rounded px-2.5 py-0.5 text-[10px] uppercase font-bold transition-all border border-white/20"
          >
            Check Status
          </button>
        </div>
      )}
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
