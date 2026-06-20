"use client";

import {
  Eraser,
  Minus,
  MousePointer2,
  PaintBucket,
  Palette,
  Pencil,
  Ruler,
  Square,
  Spline,
} from "lucide-react";
import { useFloorplan } from "./context/FloorplanContext";
import {
  FABRIC_DRAW_TOOL_COLORS,
  type FabricDrawTool,
} from "./fabricDrawToolTypes";

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
    <button
      type="button"
      className="fcw-icon-btn fcw-draw-tool-btn"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      data-active={active || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const DRAW_TOOLS: Array<{
  id: FabricDrawTool;
  title: string;
  icon: React.ReactNode;
}> = [
  { id: "select", title: "Select", icon: <MousePointer2 size={16} strokeWidth={1.9} /> },
  { id: "line", title: "Line", icon: <Minus size={16} strokeWidth={1.9} /> },
  { id: "measure", title: "Measure", icon: <Ruler size={16} strokeWidth={1.9} /> },
  { id: "curve", title: "Curved line", icon: <Spline size={16} strokeWidth={1.9} /> },
  { id: "rectangle", title: "Rectangle", icon: <Square size={16} strokeWidth={1.9} /> },
  { id: "pen", title: "Pen / Free draw", icon: <Pencil size={16} strokeWidth={1.9} /> },
  { id: "eraser", title: "Eraser", icon: <Eraser size={16} strokeWidth={1.9} /> },
];

export function FabricDrawToolsBar({ disabled = false }: { disabled?: boolean }) {
  const { drawTool, drawColor, drawFillColor, setDrawTool, setDrawColor, setDrawFillColor } = useFloorplan();
  const fillPickerValue = drawFillColor === "transparent" ? "#ffffff" : drawFillColor;

  return (
    <div className="fcw-toolbar-group fcw-toolbar-group--draw" role="group" aria-label="Drawing tools">
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

      <label className="fcw-color-picker" title="Stroke color">
        <Palette size={14} strokeWidth={1.9} aria-hidden />
        <input
          type="color"
          value={drawColor}
          disabled={disabled}
          aria-label="Stroke color"
          onChange={(e) => setDrawColor(e.target.value)}
        />
      </label>

      <label className="fcw-color-picker" title="Fill color">
        <PaintBucket size={14} strokeWidth={1.9} aria-hidden />
        <input
          type="color"
          value={fillPickerValue}
          disabled={disabled}
          aria-label="Fill color"
          onChange={(e) => setDrawFillColor(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="fcw-btn fcw-btn--compact"
        title="No fill"
        disabled={disabled}
        data-active={drawFillColor === "transparent" || undefined}
        onClick={() => setDrawFillColor("transparent")}
      >
        No fill
      </button>

      <div className="fcw-color-swatches" role="group" aria-label="Color presets">
        {FABRIC_DRAW_TOOL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className="fcw-color-swatch"
            data-active={drawColor === color || undefined}
            style={{ backgroundColor: color }}
            aria-label={`Use color ${color}`}
            aria-pressed={drawColor === color}
            disabled={disabled}
            onClick={() => setDrawColor(color)}
          />
        ))}
      </div>
    </div>
  );
}