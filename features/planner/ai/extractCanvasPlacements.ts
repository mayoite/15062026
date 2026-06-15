import type { Editor, TLShape } from "tldraw";

import type { CanvasFurnitureKind, CanvasPlacementSummary } from "./types";

function classifyFurnitureKind(props: Record<string, unknown>): CanvasFurnitureKind {
  const category = typeof props.furnitureCategory === "string" ? props.furnitureCategory : "";
  if (category === "storage") return "storage";
  if (category === "accessory" || category === "chair") return "chair";
  return "workstation";
}

function readPlacement(shape: TLShape): CanvasPlacementSummary | null {
  if (shape.type !== "planner-furniture") return null;
  const props = (shape.props ?? {}) as unknown as Record<string, unknown>;
  const widthMm = typeof props.widthMm === "number" ? props.widthMm : 0;
  const heightMm = typeof props.heightMm === "number" ? props.heightMm : 0;
  if (widthMm <= 0 || heightMm <= 0) return null;

  const label =
    (typeof props.productName === "string" && props.productName) ||
    (typeof props.furnitureType === "string" && props.furnitureType) ||
    "Furniture item";

  return {
    shapeId: shape.id,
    kind: classifyFurnitureKind(props),
    label,
    widthMm,
    heightMm,
    catalogItemId: typeof props.catalogId === "string" ? props.catalogId : undefined,
  };
}

export function extractCanvasPlacements(editor: Editor | null): CanvasPlacementSummary[] {
  if (!editor) return [];
  return editor
    .getCurrentPageShapes()
    .map(readPlacement)
    .filter((item): item is CanvasPlacementSummary => item !== null);
}