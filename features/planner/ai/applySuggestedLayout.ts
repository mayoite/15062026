import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { getPlacementCatalogItem } from "@/features/planner/catalog/placementCatalogResolver";
import { catalogMmToCanvasCm } from "@/features/planner/catalog/catalogBlockBridge";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { PlannerCanvasShape } from "@/features/planner/editor/plannerShapeFactories";
import type { SuggestedLayoutJson } from "./types";

const MM_PER_INCH = 25.4;
const DEFAULT_FURNITURE_WIDTH_MM = 1200;
const DEFAULT_FURNITURE_HEIGHT_MM = 600;

type SuggestedLayoutCatalogDimensions = {
  widthMm: number;
  heightMm: number;
};

type FabricRectObject = {
  title: string;
  width: number;
  height: number;
  parts: Array<{
    type: "rect";
    definition: {
      left: number;
      top: number;
      width: number;
      height: number;
      fill: string;
      stroke: string;
      strokeWidth: number;
      strokeDashArray?: number[];
    };
  }>;
};

function mmToFabricRoomUnits(mm: number): number {
  return Math.max(1, Math.round(mm / MM_PER_INCH));
}

function mmToCanvasUnits(widthMm: number, heightMm: number): { width: number; height: number } {
  return {
    width: Math.max(1, catalogMmToCanvasCm(widthMm, heightMm)),
    height: Math.max(1, catalogMmToCanvasCm(heightMm, widthMm)),
  };
}

function resolveCatalogDimensions(catalogItemId: string): SuggestedLayoutCatalogDimensions | null {
  const placementItem = getPlacementCatalogItem(catalogItemId);
  if (placementItem) {
    return {
      widthMm: placementItem.widthMm,
      heightMm: placementItem.depthMm,
    };
  }

  const workspaceItem = PLANNER_CATALOG_ITEMS.find((item) => item.id === catalogItemId);
  if (!workspaceItem) return null;

  return {
    widthMm: workspaceItem.widthMm,
    heightMm: workspaceItem.heightMm,
  };
}

function buildOutlinedRect(
  title: string,
  width: number,
  height: number,
  options?: { fill?: string; stroke?: string; dashed?: boolean },
): FabricRectObject {
  return {
    title,
    width,
    height,
    parts: [
      {
        type: "rect",
        definition: {
          left: 0,
          top: 0,
          width,
          height,
          fill: options?.fill ?? "transparent",
          stroke: options?.stroke ?? "#475569",
          strokeWidth: 2,
          strokeDashArray: options?.dashed ? [10, 8] : undefined,
        },
      },
    ],
  };
}

export function buildShapesFromSuggestedLayout(layout: SuggestedLayoutJson): PlannerCanvasShape[] {
  const roomUnits = mmToCanvasUnits(layout.room.widthMm, layout.room.depthMm);
  const roomShape: PlannerCanvasShape = {
    id: `suggested-room-${layout.room.label.toLowerCase().replace(/\s+/g, "-")}`,
    type: "planner-room",
    x: layout.room.x,
    y: layout.room.y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {
      label: layout.room.label,
      widthMm: roomUnits.width,
      heightMm: roomUnits.height,
      source: layout.source,
    },
  };

  const zoneShapes: PlannerCanvasShape[] = layout.zones.map((zone, index) => {
    const units = mmToCanvasUnits(zone.widthMm, zone.heightMm);
    return {
      id: `suggested-zone-${index}-${zone.label.toLowerCase().replace(/\s+/g, "-")}`,
      type: "planner-zone",
      x: zone.x,
      y: zone.y,
      rotation: 0,
      opacity: 0.4,
      isLocked: false,
      props: {
        label: zone.label,
        widthMm: units.width,
        heightMm: units.height,
        zoneType: zone.zoneType,
      },
    };
  });

  const furnitureShapes: PlannerCanvasShape[] = layout.furniture.map((item, index) => {
    const dimensions = resolveCatalogDimensions(item.catalogItemId) ?? {
      widthMm: DEFAULT_FURNITURE_WIDTH_MM,
      heightMm: DEFAULT_FURNITURE_HEIGHT_MM,
    };
    const units = mmToCanvasUnits(dimensions.widthMm, dimensions.heightMm);
    return {
      id: `suggested-furniture-${index}-${item.catalogItemId}`,
      type: "planner-furniture",
      x: item.x,
      y: item.y,
      rotation: item.rotation ?? 0,
      opacity: 1,
      isLocked: false,
      props: {
        label: item.label,
        catalogItemId: item.catalogItemId,
        widthMm: units.width,
        heightMm: units.height,
      },
    };
  });

  return [roomShape, ...zoneShapes, ...furnitureShapes];
}

export function applySuggestedLayout(_editor?: null, layout?: SuggestedLayoutJson): void {
  if (!layout) return;

  const runtime = getPlannerFabricRuntime();
  if (!runtime) return;

  runtime.insertObject({
    type: "ROOM",
    object: {
      title: layout.room.label,
      width: mmToFabricRoomUnits(layout.room.widthMm),
      height: mmToFabricRoomUnits(layout.room.depthMm),
    },
  });

  layout.walls?.forEach((wall) => {
    const endX = wall.x + wall.endX;
    const endY = wall.y + wall.endY;
    runtime.insertObject({
      type: "WALL",
      object: {
        x1: wall.x,
        y1: wall.y,
        x2: endX,
        y2: endY,
        name: `WALL:${Date.now()}`,
      },
    });
  });

  layout.zones.forEach((zone) => {
    const units = mmToCanvasUnits(zone.widthMm, zone.heightMm);
    runtime.insertObject({
      type: "ZONE",
      object: buildOutlinedRect(zone.label, units.width, units.height, {
        fill: "transparent",
        stroke: "#64748b",
        dashed: true,
      }),
    });
  });

  layout.furniture.forEach((item) => {
    const dimensions = resolveCatalogDimensions(item.catalogItemId) ?? {
      widthMm: DEFAULT_FURNITURE_WIDTH_MM,
      heightMm: DEFAULT_FURNITURE_HEIGHT_MM,
    };
    const units = mmToCanvasUnits(dimensions.widthMm, dimensions.heightMm);
    runtime.insertObject({
      type: "GENERIC",
      object: {
        title: item.label,
        width: units.width,
        height: units.height,
        left: item.x,
        top: item.y,
      },
    });
  });
}
