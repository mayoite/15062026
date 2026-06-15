import type { Editor } from "tldraw";

import { canvasUnitsToMillimeters } from "@/features/planner/lib/calibrationScale";
import {
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

function wallLengthMm(props: Record<string, unknown>): number | null {
  const startX = typeof props.startX === "number" ? props.startX : null;
  const startY = typeof props.startY === "number" ? props.startY : null;
  const endX = typeof props.endX === "number" ? props.endX : null;
  const endY = typeof props.endY === "number" ? props.endY : null;
  if (startX === null || startY === null || endX === null || endY === null) return null;
  const dx = endX - startX;
  const dy = endY - startY;
  return canvasUnitsToMillimeters(Math.hypot(dx, dy));
}

/** RoomSketcher-style selection readout for the status bar. */
export function getEditorSelectionStatus(editor: Editor | null): string | null {
  if (!editor) return null;

  const ids = editor.getSelectedShapeIds();
  if (ids.length === 0) return null;
  if (ids.length > 1) return `${ids.length} selected`;

  const shape = editor.getShape(ids[0]);
  if (!shape) return null;

  const props = (shape.props ?? {}) as Record<string, unknown>;
  const rotation = Math.round((shape.rotation * 180) / Math.PI);
  const label =
    (typeof props.label === "string" && props.label) ||
    (typeof props.productName === "string" && props.productName) ||
    shape.type.replace(/^planner-/, "");

  if (shape.type === "planner-wall") {
    const lengthMm = wallLengthMm(props);
    if (lengthMm !== null) {
      return `${label} · ${lengthMm} mm wall · ${rotation}°`;
    }
  }

  const widthMm = typeof props.widthMm === "number" ? props.widthMm : null;
  const heightMm = typeof props.heightMm === "number" ? props.heightMm : null;
  if (widthMm !== null && heightMm !== null) {
    const displayWidthMm =
      shape.type === "planner-room" || shape.type === "planner-zone"
        ? canvasUnitsToMillimeters(plannerCanvasUnits(widthMm, heightMm))
        : normalizeCatalogMm(widthMm, heightMm);
    const displayHeightMm =
      shape.type === "planner-room" || shape.type === "planner-zone"
        ? canvasUnitsToMillimeters(plannerCanvasUnits(heightMm, widthMm))
        : normalizeCatalogMm(heightMm, widthMm);
    const seatCount = typeof props.seatCount === "number" ? props.seatCount : null;
    const seats = seatCount && seatCount > 0 ? ` · ${seatCount} seats` : "";
    return `${label} · ${displayWidthMm}×${displayHeightMm} mm · ${rotation}°${seats}`;
  }

  const w = typeof props.w === "number" ? plannerCanvasUnits(props.w) : null;
  const h = typeof props.h === "number" ? plannerCanvasUnits(props.h) : null;
  if (w !== null && h !== null) {
    return `${label} · ${canvasUnitsToMillimeters(w)}×${canvasUnitsToMillimeters(h)} mm · ${rotation}°`;
  }

  return `${label} · ${rotation}°`;
}
