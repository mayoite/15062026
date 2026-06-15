"use client";

import type { LucideIcon } from "lucide-react";
import {
  BrickWall,
  DoorOpen,
  Hand,
  Layers2,
  MousePointer2,
  PanelTop,
  RectangleHorizontal,
  Ruler,
} from "lucide-react";

import type { PlannerTooltipSide } from "@/features/planner/ui/PlannerTooltip";
import { PlannerTooltip } from "@/features/planner/ui/PlannerTooltip";

export type PlannerToolId =
  | "select"
  | "hand"
  | "planner-wall"
  | "planner-room"
  | "planner-door-window"
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
  | "measure";

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
    ],
  },
];

interface PlannerToolRailProps {
  activeTool: PlannerToolId;
  activePlannerTool?: PlannerStoreTool;
  tooltipSide?: PlannerTooltipSide;
  onSelect: (toolId: PlannerToolId, plannerTool: PlannerStoreTool) => void;
}

function isToolActive(
  tool: ToolDef,
  activeTool: PlannerToolId,
  activePlannerTool?: PlannerStoreTool,
): boolean {
  // Door and window share one tldraw tool id — disambiguate via planner tool.
  if (tool.plannerTool === "door" || tool.plannerTool === "window") {
    return activePlannerTool === tool.plannerTool;
  }
  return activeTool === tool.toolId;
}

export function PlannerToolRail({
  activeTool,
  activePlannerTool,
  tooltipSide = "right",
  onSelect,
}: PlannerToolRailProps) {
  return (
    <nav className="pw-tool-rail" data-coach="toolbar" aria-label="Drawing tools">
      {TOOL_GROUPS.map((group) => (
        <div key={group.id} className="pwx-rail-group" role="group" aria-label={group.label}>
          <span className="pwx-rail-group-label" aria-hidden>
            {group.label}
          </span>
          {group.tools.map((tool) => {
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
                    aria-label={tool.label}
                    aria-pressed={isActive}
                    aria-keyshortcuts={tool.shortcut}
                    onClick={() => onSelect(tool.toolId, tool.plannerTool)}
                  >
                    <Icon size={19} strokeWidth={1.75} aria-hidden />
                  </button>
                </PlannerTooltip>
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
