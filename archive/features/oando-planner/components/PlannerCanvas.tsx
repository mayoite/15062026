"use client";

import { useState } from "react";
import { Tldraw, type Editor } from "tldraw";
import "tldraw/tldraw.css";
import {
  PLANNER_TLDRAW_SHAPE_UTILS,
  PLANNER_TLDRAW_TOOLS,
} from "../tldraw/plannerTldrawRegistration";
import ErrorBoundary from "./ErrorBoundary";

const PLANNER_TOOL_IDS = [
  "select",
  "planner-wall",
  "planner-room",
  "planner-furniture",
  "planner-door-window",
  "planner-measurement",
  "planner-zone",
] as const;

const PLANNER_TOOL_LABELS: Record<(typeof PLANNER_TOOL_IDS)[number], string> = {
  select: "Select",
  "planner-wall": "Wall",
  "planner-room": "Room",
  "planner-furniture": "Furniture",
  "planner-door-window": "Door/Window",
  "planner-measurement": "Measure",
  "planner-zone": "Zone",
};

export function PlannerCanvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [activeTool, setActiveTool] =
    useState<(typeof PLANNER_TOOL_IDS)[number]>("planner-wall");

  const handleMount = (instance: Editor) => {
    setEditor(instance);
    instance.setCurrentTool("planner-wall");
  };

  const handleToolSelect = (toolId: (typeof PLANNER_TOOL_IDS)[number]) => {
    if (!editor) return;
    editor.setCurrentTool(toolId);
    setActiveTool(toolId);
  };

  return (
    <div className="fixed inset-0">
      <div className="planner-glass absolute left-4 top-4 z-50 flex gap-2 p-2">
        {PLANNER_TOOL_IDS.map((toolId) => (
          <button
            key={toolId}
            type="button"
            className={`planner-btn-secondary ${activeTool === toolId ? "planner-active" : ""}`}
            onClick={() => handleToolSelect(toolId)}
          >
            {PLANNER_TOOL_LABELS[toolId]}
          </button>
        ))}
      </div>
      <ErrorBoundary resetKey="planner-canvas">
        <Tldraw
          onMount={handleMount}
          shapeUtils={PLANNER_TLDRAW_SHAPE_UTILS}
          tools={PLANNER_TLDRAW_TOOLS}
          initialState="planner-wall"
        />
      </ErrorBoundary>
    </div>
  );
}
