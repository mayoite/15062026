import { getPlannerFabricRuntimeState } from "@/features/planner/canvas-fabric";

export interface PlanMetrics {
  shapeCount: number;
  roomAreaSqm: number;
  zoneAreaSqm: number;
  totalFloorAreaSqm: number;
  wallCount: number;
  furnitureCount: number;
  calibrated: boolean;
}

const EMPTY_METRICS: PlanMetrics = {
  shapeCount: 0,
  roomAreaSqm: 0,
  zoneAreaSqm: 0,
  totalFloorAreaSqm: 0,
  wallCount: 0,
  furnitureCount: 0,
  calibrated: false,
};

const FABRIC_TO_MM = 10;

function roundSqm(valueMm2: number): number {
  const sqm = valueMm2 / 1_000_000;
  return Number(sqm.toFixed(2));
}

function areaFromObject(object: Record<string, unknown>) {
  const w = (Number(object.width) || 0) * (Number(object.scaleX) || 1);
  const h = (Number(object.height) || 0) * (Number(object.scaleY) || 1);
  return Math.max(0, w) * Math.max(0, h) * FABRIC_TO_MM * FABRIC_TO_MM;
}

function roomAreaFromWalls(objects: Record<string, unknown>[]) {
  const corners = objects.filter((object) => String(object.name ?? "") === "CORNER");
  if (corners.length < 3) return 0;

  const points = corners.map((corner) => ({
    x: Number(corner.left) || 0,
    y: Number(corner.top) || 0,
  }));

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area / 2) * FABRIC_TO_MM * FABRIC_TO_MM;
}

export function computePlanMetrics(
  shapes: unknown[],
  calibrationScale = 1,
): PlanMetrics {
  const objects = shapes.filter((shape): shape is Record<string, unknown> => Boolean(shape) && typeof shape === "object");
  if (!objects.length) return { ...EMPTY_METRICS };

  let wallCount = 0;
  let furnitureCount = 0;
  let zoneAreaMm2 = 0;

  objects.forEach((object) => {
    const name = String(object.name ?? "");
    if (name === "CORNER" || name.startsWith("WALL:") || name.startsWith("DOOR") || name.startsWith("WINDOW")) {
      if (name.startsWith("WALL:")) wallCount += 1;
      return;
    }

    if (name.startsWith("DRAW:rectangle")) {
      zoneAreaMm2 += areaFromObject(object);
      return;
    }

    if (
      name.startsWith("GENERIC:")
      || name.startsWith("TABLE")
      || name.startsWith("CHAIR")
      || name.startsWith("DESK")
    ) {
      furnitureCount += 1;
    }
  });

  const roomAreaMm2 = roomAreaFromWalls(objects);
  const scaledRoomArea = roomAreaMm2 * calibrationScale * calibrationScale;
  const scaledZoneArea = zoneAreaMm2 * calibrationScale * calibrationScale;

  return {
    shapeCount: objects.length,
    roomAreaSqm: roundSqm(scaledRoomArea),
    zoneAreaSqm: roundSqm(scaledZoneArea),
    totalFloorAreaSqm: roundSqm(Math.max(scaledRoomArea, scaledZoneArea || scaledRoomArea)),
    wallCount,
    furnitureCount,
    calibrated: calibrationScale !== 1,
  };
}

export function getPageMetrics(_editor: null): PlanMetrics {
  const serializedDraft = getPlannerFabricRuntimeState().serializedDraft;
  const calibrationScale = 1;
  if (!serializedDraft) return { ...EMPTY_METRICS, calibrated: false };

  try {
    const snapshot = JSON.parse(serializedDraft) as { objects?: unknown[] };
    return computePlanMetrics(snapshot.objects ?? [], calibrationScale);
  } catch {
    return { ...EMPTY_METRICS, calibrated: false };
  }
}


