import { createShapeId, type Editor } from "tldraw";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { fitPlannerContent } from "@/features/planner/editor/plannerCamera";
import {
  buildCatalogShape,
  buildRoomShape,
  buildZoneShape,
  type PlannerCanvasShape,
} from "@/features/planner/editor/plannerShapeFactories";
import { getWallThicknessCanvasUnits } from "@/features/planner/tldraw/shapes/WallShape";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

import type { SuggestedLayoutJson } from "./types";

function catalogById(id: string) {
  return PLANNER_CATALOG_ITEMS.find((item) => item.id === id);
}

/** Real-world millimetres from layout JSON → planner canvas units. */
function layoutMmToCanvasUnits(mm: number): number {
  return plannerCanvasUnits(mm);
}

export function buildShapesFromSuggestedLayout(layout: SuggestedLayoutJson): PlannerCanvasShape[] {
  const roomW = layoutMmToCanvasUnits(layout.room.widthMm);
  const roomH = layoutMmToCanvasUnits(layout.room.depthMm);

  const shapes: PlannerCanvasShape[] = [
    buildRoomShape(
      layout.room.x,
      layout.room.y,
      roomW,
      roomH,
      layout.room.label,
      "office",
    ),
  ];

  for (const zone of layout.zones) {
    shapes.push(
      buildZoneShape(
        zone.x,
        zone.y,
        layoutMmToCanvasUnits(zone.widthMm),
        layoutMmToCanvasUnits(zone.heightMm),
        zone.label,
        zone.zoneType,
      ),
    );
  }

  for (const wall of layout.walls) {
    shapes.push({
      id: createShapeId(),
      type: "planner-wall" as unknown as PlannerCanvasShape["type"],
      x: wall.x,
      y: wall.y,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        startX: 0,
        startY: 0,
        endX: wall.endX,
        endY: wall.endY,
        lengthMm: wall.lengthMm,
        thickness: getWallThicknessCanvasUnits("drywall"),
        material: "drywall",
        color: "var(--color-primary)",
        fillColor: "var(--color-primary)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
        hasJunctionStart: false,
        hasJunctionEnd: false,
        isLoadBearing: false,
        isExterior: true,
        showDimensions: false,
        showMaterial: false,
      },
    } as PlannerCanvasShape);
  }

  for (const piece of layout.furniture) {
    const item = catalogById(piece.catalogItemId);
    if (item) {
      const shape = buildCatalogShape(item, piece.x, piece.y);
      if (piece.rotation) shape.rotation = piece.rotation;
      shapes.push(shape);
      continue;
    }

    shapes.push({
      id: createShapeId(),
      type: "planner-furniture",
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation ?? 0,
      opacity: 1,
      isLocked: false,
      props: {
        furnitureCategory: "workstation",
        furnitureType: piece.label.toLowerCase().replace(/\s+/g, "-"),
        widthMm: plannerCanvasUnits(1200),
        heightMm: plannerCanvasUnits(600),
        depthMm: plannerCanvasUnits(600),
        height3dMm: 75,
        catalogId: piece.catalogItemId,
        productSlug: piece.catalogItemId,
        sku: piece.catalogItemId,
        productName: piece.label,
        manufacturer: "One&Only",
        imageUrl: "",
        isAgainstWall: false,
        snapDistance: 10,
        showDimensions: true,
        showLabel: true,
        renderStyle: "filled",
        color: "var(--color-primary)",
        fillColor: "var(--surface-glass)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
      },
    });
  }

  return shapes;
}

/** Append suggested shapes without clearing existing canvas content. */
export function applySuggestedLayout(editor: Editor, layout: SuggestedLayoutJson): void {
  const shapes = buildShapesFromSuggestedLayout(layout);
  for (const shape of shapes) {
    editor.createShape(shape as unknown as Parameters<Editor["createShape"]>[0]);
  }
  fitPlannerContent(editor);
}