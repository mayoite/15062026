/**
 * plannerShapeFactories — fabric-era shape builders.
 */

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import type { LayoutTemplate } from "@/features/planner/templates/layoutTemplates";
import type { PlannerViewerShape } from "@/features/planner/canvas-fabric/fabricToViewerShapes";

export type PlannerCanvasShape = {
  id: string;
  type: "planner-room" | "planner-furniture" | "planner-zone";
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  isLocked: boolean;
  props: Record<string, unknown>;
};

export type PlannerRoomType = "office" | "meeting" | "conference";
export type PlannerZoneType = "quiet" | "collaborative" | "focus" | "social";

export function toPlannerViewerShapes(_shapes: unknown[]): PlannerViewerShape[] {
  return [];
}

export function buildRoomShape(
  x: number,
  y: number,
  _w: number,
  _h: number,
  _label: string,
  _roomType: PlannerRoomType,
): PlannerCanvasShape {
  return {
    id: `room-${x}-${y}`,
    type: "planner-room",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {},
  };
}

export function buildZoneShape(
  x: number,
  y: number,
  _w: number,
  _h: number,
  _label: string,
  _zoneType: PlannerZoneType,
): PlannerCanvasShape {
  return {
    id: `zone-${x}-${y}`,
    type: "planner-zone",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {},
  };
}

export function buildFurnitureShape(
  x: number,
  y: number,
  _item: { name: string; widthMm: number; depthMm: number },
): PlannerCanvasShape {
  return {
    id: `furniture-${x}-${y}`,
    type: "planner-furniture",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {},
  };
}

export function buildCatalogShape(item: CatalogItem, x: number, y: number): PlannerCanvasShape {
  return {
    id: `catalog-${item.id}-${x}-${y}`,
    type: "planner-furniture",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: { catalogId: item.id },
  };
}

export function buildTemplateShapes(_template: LayoutTemplate): PlannerCanvasShape[] {
  return [];
}

export function applyShapes(_editor: null, _shapes: PlannerCanvasShape[]): void {
  // Fabric canvas handles placement via window.__fabricPlaceCatalog.
}