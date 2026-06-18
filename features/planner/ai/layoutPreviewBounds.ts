import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { plannerCanvasUnits } from "@/features/planner/catalog/catalogBlockBridge";

import type { SuggestedLayoutJson } from "./types";

export type LayoutPreviewRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type LayoutPreviewModel = {
  bounds: LayoutPreviewRect;
  room: LayoutPreviewRect;
  zones: Array<LayoutPreviewRect & { label: string; zoneType: string }>;
  furniture: Array<LayoutPreviewRect & { label: string; catalogItemId: string }>;
  walls: Array<{ x1: number; y1: number; x2: number; y2: number }>;
};

function mmToCu(mm: number): number {
  return plannerCanvasUnits(mm);
}

function furnitureSize(catalogItemId: string): { w: number; h: number } {
  const item = PLANNER_CATALOG_ITEMS.find((entry) => entry.id === catalogItemId);
  if (!item) return { w: plannerCanvasUnits(120), h: plannerCanvasUnits(60) };
  return { w: plannerCanvasUnits(item.widthMm), h: plannerCanvasUnits(item.heightMm) };
}

function expandBounds(
  bounds: LayoutPreviewRect,
  x: number,
  y: number,
  w: number,
  h: number,
): LayoutPreviewRect {
  const minX = Math.min(bounds.x, x);
  const minY = Math.min(bounds.y, y);
  const maxX = Math.max(bounds.x + bounds.w, x + w);
  const maxY = Math.max(bounds.y + bounds.h, y + h);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Build a schematic coordinate model for SVG preview rendering. */
export function buildLayoutPreviewModel(layout: SuggestedLayoutJson): LayoutPreviewModel {
  const room: LayoutPreviewRect = {
    x: layout.room.x,
    y: layout.room.y,
    w: mmToCu(layout.room.widthMm),
    h: mmToCu(layout.room.depthMm),
  };

  let bounds = { ...room };

  const zones = layout.zones.map((zone) => {
    const rect = {
      x: zone.x,
      y: zone.y,
      w: mmToCu(zone.widthMm),
      h: mmToCu(zone.heightMm),
      label: zone.label,
      zoneType: zone.zoneType,
    };
    bounds = expandBounds(bounds, rect.x, rect.y, rect.w, rect.h);
    return rect;
  });

  const furniture = layout.furniture.map((piece) => {
    const size = furnitureSize(piece.catalogItemId);
    const rect = {
      x: piece.x,
      y: piece.y,
      w: size.w,
      h: size.h,
      label: piece.label,
      catalogItemId: piece.catalogItemId,
    };
    bounds = expandBounds(bounds, rect.x, rect.y, rect.w, rect.h);
    return rect;
  });

  const walls = layout.walls.map((wall) => {
    const x2 = wall.x + wall.endX;
    const y2 = wall.y + wall.endY;
    bounds = expandBounds(bounds, wall.x, wall.y, 1, 1);
    bounds = expandBounds(bounds, x2, y2, 1, 1);
    return { x1: wall.x, y1: wall.y, x2, y2 };
  });

  const pad = Math.max(8, Math.min(bounds.w, bounds.h) * 0.04);
  bounds = {
    x: bounds.x - pad,
    y: bounds.y - pad,
    w: bounds.w + pad * 2,
    h: bounds.h + pad * 2,
  };

  return { bounds, room, zones, furniture, walls };
}