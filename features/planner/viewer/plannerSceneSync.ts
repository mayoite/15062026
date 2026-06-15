import { useMemo } from "react";
import { PLANNER_CATALOG_ITEMS } from "../catalog/workspaceCatalog";
import type { CatalogCategory } from "../catalog/catalogTypes";
import { usePlannerFurnitureStore } from "../store/plannerFurnitureStore";
import { usePlannerGeometryStore } from "../store/plannerGeometryStore";
import type { PlannerViewerShape } from "./PlannerViewer";
import type { FurnitureItem, Wall, Room, DoorItem, WindowItem, Zone } from "../store/plannerTypes";

const CATEGORY_BY_CATALOG_ID: Map<string, CatalogCategory> = new Map(
  PLANNER_CATALOG_ITEMS.map((item) => [item.id, item.category]),
);

// ---------------------------------------------------------------------------
// Converters: Zustand store entities -> PlannerViewerShape
// ---------------------------------------------------------------------------

function wallToShape(wall: Wall): PlannerViewerShape {
  return {
    id: wall.id,
    type: "planner-wall",
    x: Math.min(wall.start.x, wall.end.x),
    y: Math.min(wall.start.y, wall.end.y),
    rotation: 0,
    width: Math.abs(wall.end.x - wall.start.x) || wall.thickness,
    height: Math.abs(wall.end.y - wall.start.y) || wall.thickness,
    color: wall.color,
    wall: {
      startX: wall.start.x,
      startY: wall.start.y,
      endX: wall.end.x,
      endY: wall.end.y,
      thickness: wall.thickness,
    },
  };
}

function roomToShape(room: Room): PlannerViewerShape {
  const xs = room.points.map((p) => p.x);
  const ys = room.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    id: room.id,
    type: "planner-room",
    x: minX,
    y: minY,
    rotation: 0,
    width: maxX - minX,
    height: maxY - minY,
    label: room.name,
    color: room.color,
  };
}

function furnitureToShape(item: FurnitureItem): PlannerViewerShape {
  const category = CATEGORY_BY_CATALOG_ID.get(item.catalogId);
  return {
    id: item.id,
    type: "planner-furniture",
    x: item.x,
    y: item.y,
    rotation: item.rotation,
    width: item.width,
    height: item.height,
    label: item.name,
    color: item.color,
    catalogId: item.catalogId,
    ...(category ? { category } : {}),
  };
}

function doorToShape(door: DoorItem, walls: Wall[]): PlannerViewerShape {
  if (door.wallId) {
    const wall = walls.find((w) => w.id === door.wallId);
    if (wall && door.position !== undefined) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.hypot(dx, dy);
      const t = len > 0 ? door.position / len : 0;
      const cx = wall.start.x + dx * t;
      const cy = wall.start.y + dy * t;
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      return {
        id: door.id,
        type: "planner-door",
        x: cx - (door.width ?? 40) / 2,
        y: cy - 5,
        rotation,
        width: door.width ?? 40,
        height: 10,
      };
    }
  }
  return {
    id: door.id,
    type: "planner-door",
    x: door.x,
    y: door.y,
    rotation: door.rotation,
    width: door.width ?? 40,
    height: 10,
  };
}

function windowToShape(win: WindowItem, walls: Wall[]): PlannerViewerShape {
  if (win.wallId) {
    const wall = walls.find((w) => w.id === win.wallId);
    if (wall && win.position !== undefined) {
      const dx = wall.end.x - wall.start.x;
      const dy = wall.end.y - wall.start.y;
      const len = Math.hypot(dx, dy);
      const t = len > 0 ? win.position / len : 0;
      const cx = wall.start.x + dx * t;
      const cy = wall.start.y + dy * t;
      const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
      return {
        id: win.id,
        type: "planner-window",
        x: cx - (win.width ?? 60) / 2,
        y: cy - 5,
        rotation,
        width: win.width ?? 60,
        height: 10,
      };
    }
  }
  return {
    id: win.id,
    type: "planner-window",
    x: win.x,
    y: win.y,
    rotation: win.rotation,
    width: win.width ?? 60,
    height: 10,
  };
}

function zoneToShape(zone: Zone): PlannerViewerShape {
  const xs = zone.points.map((p) => p.x);
  const ys = zone.points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return {
    id: zone.id,
    type: "planner-zone",
    x: minX,
    y: minY,
    rotation: 0,
    width: maxX - minX,
    height: maxY - minY,
    label: zone.name,
    color: zone.color,
  };
}

// ---------------------------------------------------------------------------
// Public hook: reads from both Zustand stores and returns unified shapes
// ---------------------------------------------------------------------------

export interface PlannerSceneData {
  shapes: PlannerViewerShape[];
  furniture: PlannerViewerShape[];
  rooms: PlannerViewerShape[];
  walls: PlannerViewerShape[];
}

/**
 * Reads furniture from plannerFurnitureStore and geometry (walls, rooms, doors,
 * windows, zones) from plannerGeometryStore. Returns a unified PlannerViewerShape
 * array that can be passed directly to <PlannerViewer shapes={...} />.
 */
export function usePlannerSceneData(): PlannerSceneData {
  const furniture = usePlannerFurnitureStore((s) => s.furniture);
  const walls = usePlannerGeometryStore((s) => s.walls);
  const rooms = usePlannerGeometryStore((s) => s.rooms);
  const doors = usePlannerGeometryStore((s) => s.doors);
  const windows = usePlannerGeometryStore((s) => s.windows);
  const zones = usePlannerGeometryStore((s) => s.zones);

  return useMemo(() => {
    const wallShapes = walls.map(wallToShape);
    const roomShapes = rooms.map(roomToShape);
    const furnitureShapes = furniture.map(furnitureToShape);
    const doorShapes = doors.map((d) => doorToShape(d, walls));
    const windowShapes = windows.map((w) => windowToShape(w, walls));
    const zoneShapes = zones.map(zoneToShape);

    const shapes: PlannerViewerShape[] = [
      ...wallShapes,
      ...roomShapes,
      ...zoneShapes,
      ...doorShapes,
      ...windowShapes,
      ...furnitureShapes,
    ];

    return { shapes, furniture: furnitureShapes, rooms: roomShapes, walls: wallShapes };
  }, [furniture, walls, rooms, doors, windows, zones]);
}

// ---------------------------------------------------------------------------
// Camera framing helpers — moved to viewerFraming.ts, re-exported for compat
// ---------------------------------------------------------------------------

export {
  computeSceneBounds,
  frameToContent,
  type FrameToContentResult,
  type SceneBounds,
} from "./viewerFraming";
