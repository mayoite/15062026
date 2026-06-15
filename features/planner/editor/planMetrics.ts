import type { Editor, TLShape } from "tldraw";

import { getCalibrationScale, readCalibrationScale } from "@/features/planner/lib/calibrationScale";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

export interface PlanMetrics {
  shapeCount: number;
  roomAreaSqm: number;
  zoneAreaSqm: number;
  totalFloorAreaSqm: number;
  wallCount: number;
  furnitureCount: number;
  calibrated: boolean;
}

function roomAreaFromProps(
  props: Record<string, unknown>,
  scale: number,
): number {
  if (typeof props.areaSqm === "number" && props.areaSqm > 0) {
    return props.areaSqm * scale * scale;
  }
  const w = typeof props.widthMm === "number" ? plannerCanvasUnits(props.widthMm) : 0;
  const h = typeof props.heightMm === "number" ? plannerCanvasUnits(props.heightMm) : 0;
  if (w > 0 && h > 0) {
    const wM = (w * scale) / 100;
    const hM = (h * scale) / 100;
    return wM * hM;
  }
  return 0;
}

export function computePlanMetrics(
  shapes: TLShape[],
  calibrationScale = 1,
): PlanMetrics {
  let roomAreaSqm = 0;
  let zoneAreaSqm = 0;
  let wallCount = 0;
  let furnitureCount = 0;

  for (const shape of shapes) {
    if (shape.meta?.layerHidden) continue;

    const props = (shape.props ?? {}) as Record<string, unknown>;
    if (shape.type === "planner-room") {
      roomAreaSqm += roomAreaFromProps(props, calibrationScale);
    } else if (shape.type === "planner-zone") {
      zoneAreaSqm += roomAreaFromProps(props, calibrationScale);
    } else if (shape.type === "planner-wall") {
      wallCount += 1;
    } else if (shape.type === "planner-furniture") {
      furnitureCount += 1;
    }
  }

  return {
    shapeCount: shapes.filter((s) => !s.meta?.layerHidden).length,
    roomAreaSqm,
    zoneAreaSqm,
    totalFloorAreaSqm: Math.max(roomAreaSqm, zoneAreaSqm),
    wallCount,
    furnitureCount,
    calibrated: calibrationScale !== 1,
  };
}

export function getPageMetrics(editor: Editor | null): PlanMetrics {
  if (!editor) {
    return {
      shapeCount: 0,
      roomAreaSqm: 0,
      zoneAreaSqm: 0,
      totalFloorAreaSqm: 0,
      wallCount: 0,
      furnitureCount: 0,
      calibrated: false,
    };
  }
  const scale = readCalibrationScale();
  return computePlanMetrics(editor.getCurrentPageShapes(), scale);
}

export function getCalibrationScaleFromBlueprint(mmPerUnit: number | null): number {
  return getCalibrationScale(mmPerUnit);
}
