"use client";

import {
  Eraser,
  Minus,
  Cursor,
  PaintBucket,
  Palette,
  PencilSimple,
  Ruler,
  Square,
  BezierCurve,
} from "@phosphor-icons/react";
import { useFloorplan } from "./context/FloorplanContext";
import {
  FABRIC_DRAW_TOOL_COLORS,
  type FabricDrawTool,
} from "./fabricDrawToolTypes";
import { PlannerTooltip } from "@/features/planner/ui/PlannerTooltip";

function DrawToolButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <PlannerTooltip label={title} side="bottom" disabled={disabled}>
      <button
        type="button"
        className="fcw-icon-btn fcw-draw-tool-btn"
        aria-label={title}
        aria-pressed={active || undefined}
        data-active={active || undefined}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </PlannerTooltip>
  );
}

const DRAW_TOOLS: Array<{
  id: FabricDrawTool;
  title: string;
  icon: React.ReactNode;
}> = [
  { id: "select", title: "Select", icon: <Cursor size={18} weight="bold" /> },
  { id: "line", title: "Line", icon: <Minus size={18} weight="bold" /> },
  { id: "measure", title: "Measure", icon: <Ruler size={18} weight="bold" /> },
  { id: "curve", title: "Curved line", icon: <BezierCurve size={18} weight="bold" /> },
  { id: "rectangle", title: "Rectangle", icon: <Square size={18} weight="bold" /> },
  { id: "pen", title: "Pen / Free draw", icon: <PencilSimple size={18} weight="bold" /> },
  { id: "eraser", title: "Eraser", icon: <Eraser size={18} weight="bold" /> },
];

const DRAW_TOOL_HELP: Record<FabricDrawTool, string> = {
  select: "Select and move existing items.",
  line: "Click and drag to place a straight line.",
  measure: "Click and drag to place a measurement label.",
  curve: "Click three points to place a curved line.",
  rectangle: "Click and drag to draw a rectangle.",
  pen: "Press and drag to free draw.",
  eraser: "Click an annotation or generic item to remove it.",
  wall: "Click and drag to draw a wall segment.",
};

export function FabricDrawToolsBar({ disabled = false }: { disabled?: boolean }) {
  const { drawTool, drawColor, drawFillColor, setDrawTool, setDrawColor, setDrawFillColor } = useFloorplan();
  const fillPickerValue = drawFillColor === "transparent" ? "#ffffff" : drawFillColor;

  return (
    <div className="fcw-toolbar-group fcw-toolbar-group--draw" role="group" aria-label="Drawing tools">
      <div className="fcw-draw-tool-row">
        {DRAW_TOOLS.map((tool) => (
          <DrawToolButton
            key={tool.id}
            title={tool.title}
            active={drawTool === tool.id}
            disabled={disabled}
            onClick={() => setDrawTool(tool.id)}
          >
            {tool.icon}
          </DrawToolButton>
        ))}
      </div>

      <div className="fcw-draw-tool-help sr-only" role="status" aria-live="polite">
        {DRAW_TOOL_HELP[drawTool]}
      </div>

      <div className="fcw-draw-tool-row">
        <PlannerTooltip label="Stroke color" side="bottom" disabled={disabled}>
          <label className="fcw-color-picker">
            <Palette size={16} weight="bold" aria-hidden />
            <input
              type="color"
              value={drawColor}
              disabled={disabled}
              aria-label="Stroke color"
              onChange={(e) => setDrawColor(e.target.value)}
            />
          </label>
        </PlannerTooltip>

        <PlannerTooltip label="Fill color" side="bottom" disabled={disabled}>
          <label className="fcw-color-picker">
            <PaintBucket size={16} weight="bold" aria-hidden />
            <input
              type="color"
              value={fillPickerValue}
              disabled={disabled}
              aria-label="Fill color"
              onChange={(e) => setDrawFillColor(e.target.value)}
            />
          </label>
        </PlannerTooltip>
        <PlannerTooltip label="No fill" side="bottom" disabled={disabled}>
          <button
            type="button"
            className="fcw-btn fcw-btn--compact"
            disabled={disabled}
            data-active={drawFillColor === "transparent" || undefined}
            aria-label="No fill"
            onClick={() => setDrawFillColor("transparent")}
          >
            No fill
          </button>
        </PlannerTooltip>

        <div className="fcw-color-swatches" role="group" aria-label="Color presets">
          {FABRIC_DRAW_TOOL_COLORS.map((color) => (
            <PlannerTooltip key={color} label={`Use color ${color}`} side="bottom" disabled={disabled}>
              <button
                type="button"
                className="fcw-color-swatch"
                data-active={drawColor === color || undefined}
                style={{ backgroundColor: color }}
                aria-label={`Use color ${color}`}
                aria-pressed={drawColor === color}
                disabled={disabled}
                onClick={() => setDrawColor(color)}
              />
            </PlannerTooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
