import type { Editor } from "tldraw";

import type { RoomPreset } from "@/features/planner/catalog/roomPresets";
import {
  applyShapes,
  buildRoomShape,
  buildZoneShape,
  type PlannerCanvasShape,
  type PlannerRoomType,
  type PlannerZoneType,
} from "@/features/planner/editor/plannerShapeFactories";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

function zoneTypeFromLabel(label: string): PlannerZoneType {
  const normalized = label.toLowerCase();
  if (normalized.includes("meeting") || normalized.includes("board")) return "collaborative";
  if (normalized.includes("lounge") || normalized.includes("reception") || normalized.includes("pantry")) {
    return "social";
  }
  if (normalized.includes("cabin") || normalized.includes("quiet")) return "focus";
  return "collaborative";
}

function roomTypeFromPreset(preset: RoomPreset): PlannerRoomType {
  const name = preset.name.toLowerCase();
  if (name.includes("meeting") || name.includes("board")) return "meeting";
  if (name.includes("conference")) return "conference";
  return "office";
}

export function buildRoomPresetShapes(
  preset: RoomPreset,
  origin: { x: number; y: number },
): PlannerCanvasShape[] {
  const width = plannerCanvasUnits(preset.widthMm);
  const height = plannerCanvasUnits(preset.heightMm);
  const { x: ox, y: oy } = origin;
  const zones = preset.zones ?? [{ label: preset.name, widthMm: preset.widthMm }];
  const isMultiZone = zones.length > 1;

  const shapes: PlannerCanvasShape[] = [
    buildRoomShape(ox, oy, width, height, preset.name, roomTypeFromPreset(preset)),
  ];

  if (isMultiZone) {
    let xCursor = 0;
    zones.forEach((zone, index) => {
      const zoneWidth = plannerCanvasUnits(zone.widthMm);
      shapes.push(
        buildZoneShape(ox + xCursor, oy, zoneWidth, height, zone.label, zoneTypeFromLabel(zone.label)),
      );
      xCursor += zoneWidth;
      if (index >= zones.length - 1) return;
    });
  }

  return shapes;
}

export function applyRoomPreset(editor: Editor, preset: RoomPreset): void {
  const width = plannerCanvasUnits(preset.widthMm);
  const height = plannerCanvasUnits(preset.heightMm);
  const center = editor.getViewportPageBounds().center;
  const origin = { x: center.x - width / 2, y: center.y - height / 2 };

  applyShapes(editor, buildRoomPresetShapes(preset, origin));
}
