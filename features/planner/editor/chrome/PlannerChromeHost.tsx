"use client";

import type { RefObject } from "react";

import { PlannerChromeWidget } from "@/features/planner/editor/chrome/PlannerChromeWidget";
import { AccessChrome } from "@/features/planner/editor/chrome/widgets/AccessChrome";
import { StepsChrome } from "@/features/planner/editor/chrome/widgets/StepsChrome";
import { ToolsChrome } from "@/features/planner/editor/chrome/widgets/ToolsChrome";
import type { PlannerToolId } from "@/features/planner/editor/PlannerToolRail";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import type { PlannerToolVisibilityMode } from "@/features/planner/editor/plannerToolVisibility";

type PlannerStoreTool =
  | "select"
  | "pan"
  | "wall"
  | "room"
  | "door"
  | "window"
  | "furniture"
  | "zone"
  | "measure"
  | "eraser";

interface PlannerChromeHostProps {
  layerRef: RefObject<HTMLDivElement | null>;
  isCompact: boolean;
  plannerStep: PlannerStep;
  disabledSteps: Partial<Record<PlannerStep, boolean>>;
  activeTool: PlannerToolId;
  activePlannerTool: PlannerStoreTool;
  toolVisibilityMode: PlannerToolVisibilityMode;
  leftOpen: boolean;
  rightOpen: boolean;
  leftCollapsed?: boolean;
  resetToken?: number;
  onStepChange: (step: PlannerStep) => void;
  onToolSelect: (tool: PlannerToolId, plannerTool: PlannerStoreTool) => void;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleLeftCollapsed?: () => void;
  onResetLayout?: () => void;
}

export function PlannerChromeHost({
  layerRef,
  isCompact,
  plannerStep,
  disabledSteps,
  activeTool,
  activePlannerTool,
  toolVisibilityMode,
  leftOpen,
  rightOpen,
  leftCollapsed = false,
  resetToken = 0,
  onStepChange,
  onToolSelect,
  onToggleLeft,
  onToggleRight,
  onToggleLeftCollapsed,
  onResetLayout,
}: PlannerChromeHostProps) {
  const reservedInsets = {
    left: leftOpen && !leftCollapsed ? 380 : leftCollapsed ? 72 : 0,
    right: rightOpen ? 340 : 0,
  };

  return (
    <>
      {!isCompact ? (
        <PlannerChromeWidget
          key={`steps-${resetToken}`}
          dockId="steps"
          layerRef={layerRef}
          label="Workflow steps"
          className="pw-canvas-chrome--steps"
          reservedInsets={reservedInsets}
          resetToken={resetToken}
        >
          <StepsChrome
            current={plannerStep}
            disabledSteps={disabledSteps}
            onChange={onStepChange}
          />
        </PlannerChromeWidget>
      ) : null}

      <PlannerChromeWidget
        key={`tools-${resetToken}-${isCompact ? "compact" : "full"}`}
        dockId="tools"
        layerRef={layerRef}
        label="Drawing tools"
        className="pw-canvas-chrome--tools"
        dockDisabled={isCompact}
        reservedInsets={reservedInsets}
        resetToken={resetToken}
      >
        {({ tooltipSide }) => (
          <ToolsChrome
            activeTool={activeTool}
            activePlannerTool={activePlannerTool}
            step={plannerStep}
            visibilityMode={toolVisibilityMode}
            tooltipSide={isCompact ? "top" : tooltipSide}
            onSelect={onToolSelect}
          />
        )}
      </PlannerChromeWidget>

      {!isCompact ? (
        <PlannerChromeWidget
          key={`access-${resetToken}`}
          dockId="access"
          layerRef={layerRef}
          label="Panel and layout controls"
          className="pw-canvas-chrome--access"
          variant="compact"
          reservedInsets={reservedInsets}
          resetToken={resetToken}
        >
          <AccessChrome
            leftOpen={leftOpen}
            rightOpen={rightOpen}
            leftCollapsed={leftCollapsed}
            onToggleLeft={onToggleLeft}
            onToggleRight={onToggleRight}
            onToggleLeftCollapsed={onToggleLeftCollapsed}
            onResetLayout={onResetLayout}
          />
        </PlannerChromeWidget>
      ) : null}
    </>
  );
}
