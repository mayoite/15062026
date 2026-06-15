import type { Editor } from "tldraw";

import { furnitureCatalog } from "../data/catalogData";
import { getUnifiedCatalog } from "../data/unifiedCatalog";
import type {
  DoorItem,
  FurnitureItem,
  MeasurementItem,
  Room,
  Wall,
  WindowItem,
  Zone,
} from "../data/plannerStore";
import type {
  PlannerDoorTLShape,
  PlannerFurnitureTLShape,
  PlannerMeasurementTLShape,
  PlannerRoomTLShape,
  PlannerWallTLShape,
  PlannerWindowTLShape,
  PlannerZoneTLShape,
} from "../shapes/tldrawShapeTypes";
import {
  fromShapeId,
  mapTldrawFloorMaterialToZustand,
  mapTldrawZoneTypeToZustand,
  type ShapePoint,
} from "./plannerSyncMappings";

export interface PlannerSyncSnapshot {
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones: Zone[];
  selectedId: string | null;
  selectedIds: string[];
}

export function extractPlannerSyncSnapshot(editor: Editor): PlannerSyncSnapshot {
  const shapes = editor.getCurrentPageShapes();
  const walls: Wall[] = [];
  const rooms: Room[] = [];
  const furniture: FurnitureItem[] = [];
  const doors: DoorItem[] = [];
  const windows: WindowItem[] = [];
  const measurements: MeasurementItem[] = [];
  const zones: Zone[] = [];

  shapes.forEach((shape) => {
    const type = shape.type as string;
    if (type === "planner-wall") {
      const wallShape = shape as PlannerWallTLShape;
      const props = wallShape.props;
      walls.push({
        id: fromShapeId(shape.id),
        start: { x: shape.x + (props.startX ?? 0), y: shape.y + (props.startY ?? 0) },
        end: { x: shape.x + (props.endX ?? 0), y: shape.y + (props.endY ?? 0) },
        thickness: props.thickness ?? 8,
        color: props.color || "var(--border-soft)",
      });
      return;
    }

    if (type === "planner-room") {
      const roomShape = shape as PlannerRoomTLShape;
      const props = roomShape.props;
      const pts = (props.points ?? []).map((point: ShapePoint) => ({
        x: shape.x + point.x,
        y: shape.y + point.y,
      }));
      rooms.push({
        id: fromShapeId(shape.id),
        points: pts,
        name: props.label || "Room",
        color: props.fillColor || "var(--surface-glass)",
        floorMaterial: mapTldrawFloorMaterialToZustand(props.floorMaterial || "carpet"),
        wallColor: props.strokeColor || "var(--border-soft)",
      });
      return;
    }

    if (type === "planner-furniture") {
      const furnitureShape = shape as PlannerFurnitureTLShape;
      const props = furnitureShape.props;
      const catalogEntry = furnitureCatalog.find((entry) => entry.id === props.catalogId);
      const unifiedEntry = getUnifiedCatalog().find((entry) => entry.id === props.catalogId);
      furniture.push({
        id: fromShapeId(shape.id),
        catalogId: props.catalogId || "desk",
        name: props.productName || "Desk",
        x: shape.x,
        y: shape.y,
        width: props.widthMm ?? 120,
        height: props.heightMm ?? 70,
        rotation: Math.round((shape.rotation * 180) / Math.PI),
        color: props.color || unifiedEntry?.color || "var(--border-soft)",
        shape: catalogEntry?.shape || props.furnitureType || props.furnitureCategory || "workstation",
        zIndex: 0,
      });
      return;
    }

    if (type === "planner-door") {
      const doorShape = shape as PlannerDoorTLShape;
      const props = doorShape.props;
      doors.push({
        id: fromShapeId(shape.id),
        x: shape.x,
        y: shape.y,
        width: props.widthMm ?? 90,
        rotation: Math.round((shape.rotation * 180) / Math.PI),
        swing: props.swingDirection === "both" ? "double" : props.swingDirection === "left" ? "left" : "right",
        openAngle: props.swingAngle ?? 90,
      });
      return;
    }

    if (type === "planner-window") {
      const windowShape = shape as PlannerWindowTLShape;
      const props = windowShape.props;
      windows.push({
        id: fromShapeId(shape.id),
        x: shape.x,
        y: shape.y,
        width: props.widthMm ?? 120,
        rotation: Math.round((shape.rotation * 180) / Math.PI),
        style: props.windowType === "sliding" ? "sliding" : props.windowType === "double" ? "double" : "single",
      });
      return;
    }

    if (type === "planner-measurement") {
      const measurementShape = shape as PlannerMeasurementTLShape;
      const props = measurementShape.props;
      measurements.push({
        id: fromShapeId(shape.id),
        start: { x: shape.x + (props.startX ?? 0), y: shape.y + (props.startY ?? 0) },
        end: { x: shape.x + (props.endX ?? 0), y: shape.y + (props.endY ?? 0) },
      });
      return;
    }

    if (type === "planner-zone") {
      const zoneShape = shape as PlannerZoneTLShape;
      const props = zoneShape.props;
      const pts = (props.points ?? []).map((point: ShapePoint) => ({
        x: shape.x + point.x,
        y: shape.y + point.y,
      }));
      zones.push({
        id: fromShapeId(shape.id),
        points: pts,
        name: props.label || "Zone",
        type: mapTldrawZoneTypeToZustand(props.zoneType || "quiet"),
        color: props.zoneColor || "var(--surface-glass)",
        opacity: props.showFill ? 0.25 : 0,
      });
    }
  });

  const selectedShapeIds = editor.getSelectedShapeIds();
  return {
    walls,
    rooms,
    furniture,
    doors,
    windows,
    measurements,
    zones,
    selectedId: selectedShapeIds.length > 0 ? fromShapeId(selectedShapeIds[0]) : null,
    selectedIds: selectedShapeIds.map(fromShapeId),
  };
}
