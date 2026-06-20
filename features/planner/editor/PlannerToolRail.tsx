"use client";

import type { LucideIcon } from "lucide-react";
import {
  Armchair,
  BrickWall,
  DoorOpen,
  Eraser,
  Hand,
  Layers2,
  MousePointer2,
  PanelTop,
  RectangleHorizontal,
  Ruler,
} from "lucide-react";

import type { PlannerStep } from "@/features/planner/editor/plannerStep";
import {
  isPlannerToolVisible,
  type PlannerToolVisibilityMode,
} from "@/features/planner/editor/plannerToolVisibility";
import type { PlannerTooltipSide } from "@/features/planner/ui/PlannerTooltip";
import { PlannerTooltip } from "@/features/planner/ui/PlannerTooltip";

export type PlannerToolId =
  | "select"
  | "hand"
  | "eraser"
  | "planner-wall"
  | "planner-room"
  | "planner-door-window"
  | "planner-furniture"
  | "planner-zone"
  | "planner-measurement";

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

export type ToolDef = {
  id: string;
  toolId: PlannerToolId;
  plannerTool: PlannerStoreTool;
  label: string;
  hint: string;
  shortcut?: string;
  icon: LucideIcon;
};

export type ToolGroup = {
  id: string;
  /** Short label — must fit the 3rem-wide rail. */
  label: string;
  tools: ToolDef[];
};

export const TOOL_GROUPS: ToolGroup[] = [
  {
    id: "navigate",
    label: "Move",
    tools: [
      {
        id: "select",
        toolId: "select",
        plannerTool: "select",
        label: "Select",
        hint: "Pick, move, and resize objects",
        shortcut: "V",
        icon: MousePointer2,
      },
      {
        id: "hand",
        toolId: "hand",
        plannerTool: "pan",
        label: "Pan",
        hint: "Drag the canvas to navigate",
        shortcut: "H",
        icon: Hand,
      },
    ],
  },
  {
    id: "build",
    label: "Draw",
    tools: [
      {
        id: "wall",
        toolId: "planner-wall",
        plannerTool: "wall",
        label: "Wall",
        hint: "Click two points to draw a wall",
        shortcut: "W",
        icon: BrickWall,
      },
      {
        id: "room",
        toolId: "planner-room",
        plannerTool: "room",
        label: "Room",
        hint: "Draw a rectangular room outline",
        shortcut: "R",
        icon: RectangleHorizontal,
      },
      {
        id: "door",
        toolId: "planner-door-window",
        plannerTool: "door",
        label: "Door",
        hint: "Place a door on a wall segment",
        shortcut: "D",
        icon: DoorOpen,
      },
      {
        id: "window",
        toolId: "planner-door-window",
        plannerTool: "window",
        label: "Window",
        hint: "Place a window on a wall segment",
        icon: PanelTop,
      },
      {
        id: "furniture",
        toolId: "planner-furniture",
        plannerTool: "furniture",
        label: "Furniture",
        hint: "Place catalog furniture on the canvas",
        shortcut: "F",
        icon: Armchair,
      },
    ],
  },
  {
    id: "annotate",
    label: "Mark",
    tools: [
      {
        id: "zone",
        toolId: "planner-zone",
        plannerTool: "zone",
        label: "Zone",
        hint: "Mark collaboration or focus areas",
        shortcut: "Z",
        icon: Layers2,
      },
      {
        id: "measure",
        toolId: "planner-measurement",
        plannerTool: "measure",
        label: "Measure",
        hint: "Measure distances on the plan",
        shortcut: "M",
        icon: Ruler,
      },
      {
        id: "eraser",
        toolId: "eraser",
        plannerTool: "eraser",
        label: "Erase",
        hint: "Remove shapes from the plan",
        shortcut: "X",
        icon: Eraser,
      },
    ],
  },
];

interface PlannerToolRailProps {
  activeTool: PlannerToolId;
  activePlannerTool?: PlannerStoreTool;
  step: PlannerStep;
  visibilityMode?: PlannerToolVisibilityMode;
  tooltipSide?: PlannerTooltipSide;
  onSelect: (toolId: PlannerToolId, plannerTool: PlannerStoreTool) => void;
}

function isToolActive(
  tool: ToolDef,
  activeTool: PlannerToolId,
  activePlannerTool?: PlannerStoreTool,
): boolean {
  if (tool.plannerTool === "door" || tool.plannerTool === "window" || tool.plannerTool === "furniture") {
    return activePlannerTool === tool.plannerTool;
  }
  return activeTool === tool.toolId;
}

export function PlannerToolRail({
  activeTool,
  activePlannerTool,
  step = "draw",
  visibilityMode = "balanced",
  tooltipSide = "right",
  onSelect,
}: PlannerToolRailProps) {
  return (
    <nav
      className="pw-tool-rail"
      data-coach="toolbar"
      data-step={step}
      data-tool-visibility={visibilityMode}
      aria-label="Drawing tools"
    >
      {TOOL_GROUPS.map((group) => {
        const visibleTools = group.tools.filter((tool) =>
          isPlannerToolVisible(step, tool, visibilityMode),
        );
        if (visibleTools.length === 0) return null;

        return (
        <div key={group.id} className="pwx-rail-group" role="group" aria-label={group.label}>
          <span className="pwx-rail-group-label" aria-hidden>
            {group.label}
          </span>
          {visibleTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = isToolActive(tool, activeTool, activePlannerTool);

            return (
              <span key={tool.id} className="pw-tool-rail-item">
                <PlannerTooltip
                  label={tool.label}
                  hint={tool.hint}
                  shortcut={tool.shortcut}
                  side={tooltipSide}
                >
                  <button
                    type="button"
                    className="pw-tool-rail-btn pwx-rail-btn"
                    data-active={isActive}
                    aria-label={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                    aria-pressed={isActive}
                    aria-keyshortcuts={tool.shortcut}
                    data-command-id={`tool.select.${tool.id}`}
                    data-command-handler="onSelect"
                    data-command-mutation="activeTool"
                    data-command-feedback="aria-pressed"
                    onClick={() => onSelect(tool.toolId, tool.plannerTool)}
                  >
                    <Icon size={19} strokeWidth={1.75} aria-hidden />
                  </button>
                </PlannerTooltip>
              </span>
            );
          })}
        </div>
        );
      })}
    </nav>
  );
}
