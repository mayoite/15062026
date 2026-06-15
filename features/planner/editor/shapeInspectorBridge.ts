import { createShapeId, type Editor, type TLShape, type TLShapeId } from "@tldraw/editor";
import {
  canvasUnitsToMillimeters,
  millimetersToCanvasUnits,
} from "@/features/planner/lib/calibrationScale";
import {
  catalogMmToCanvasCm,
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { PLANNER_CATALOG_ITEMS as CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { InspectorData } from "@/features/planner/editor/inspector/inspectorTypes";

const INSPECTABLE_TYPES = new Set([
  "planner-furniture",
  "planner-room",
  "planner-zone",
  "planner-wall",
  "planner-door",
  "planner-window",
]);

function rectPoints(widthMm: number, heightMm: number) {
  return [
    { x: 0, y: 0 },
    { x: widthMm, y: 0 },
    { x: widthMm, y: heightMm },
    { x: 0, y: heightMm },
  ];
}

function catalogSeatCount(catalogId?: string): number | undefined {
  if (!catalogId) return undefined;
  const item = CATALOG_ITEMS.find((entry) => entry.id === catalogId);
  return item?.seatCount;
}

export function shapeToInspectorData(shape: TLShape): InspectorData | null {
  if (!INSPECTABLE_TYPES.has(shape.type)) return null;

  const props = shape.props as Record<string, unknown>;
  const catalogId = typeof props.catalogId === "string" ? props.catalogId : undefined;
  const teamName = typeof props.teamName === "string" ? props.teamName : undefined;

  if (shape.type === "planner-furniture") {
    const widthCm = plannerCanvasUnits(
      typeof props.widthMm === "number" ? props.widthMm : 120,
      typeof props.heightMm === "number" ? props.heightMm : 60,
    );
    const heightCm = plannerCanvasUnits(
      typeof props.heightMm === "number" ? props.heightMm : 60,
      typeof props.widthMm === "number" ? props.widthMm : 120,
    );
    const seatCount =
      typeof props.seatCount === "number" ? props.seatCount : catalogSeatCount(catalogId);
    return {
      id: shape.id,
      type: String(props.furnitureType ?? props.furnitureCategory ?? "furniture"),
      label: String(props.productName ?? "Furniture"),
      widthMm: normalizeCatalogMm(widthCm, heightCm),
      heightMm: normalizeCatalogMm(heightCm, widthCm),
      rotation: shape.rotation,
      isLocked: shape.isLocked,
      teamName,
      seatCount,
    };
  }

  if (shape.type === "planner-zone") {
    const widthCm = plannerCanvasUnits(
      typeof props.widthMm === "number" ? props.widthMm : 120,
      typeof props.heightMm === "number" ? props.heightMm : 80,
    );
    const heightCm = plannerCanvasUnits(
      typeof props.heightMm === "number" ? props.heightMm : 80,
      typeof props.widthMm === "number" ? props.widthMm : 120,
    );
    const widthMm = canvasUnitsToMillimeters(widthCm);
    const heightMm = canvasUnitsToMillimeters(heightCm);
    return {
      id: shape.id,
      type: "zone",
      label: String(props.label ?? "Zone"),
      widthMm,
      heightMm,
      rotation: shape.rotation,
      isLocked: shape.isLocked,
      zoneType: String(props.zoneType ?? "focus"),
      teamName,
    };
  }

  if (shape.type === "planner-room") {
    const widthCm = plannerCanvasUnits(
      typeof props.widthMm === "number" ? props.widthMm : 120,
      typeof props.heightMm === "number" ? props.heightMm : 80,
    );
    const heightCm = plannerCanvasUnits(
      typeof props.heightMm === "number" ? props.heightMm : 80,
      typeof props.widthMm === "number" ? props.widthMm : 120,
    );
    const widthMm = canvasUnitsToMillimeters(widthCm);
    const heightMm = canvasUnitsToMillimeters(heightCm);
    return {
      id: shape.id,
      type: String(props.roomType ?? "room"),
      label: String(props.label ?? "Room"),
      widthMm,
      heightMm,
      rotation: shape.rotation,
      isLocked: shape.isLocked,
      teamName,
    };
  }

  if (shape.type === "planner-wall") {
    const startX = typeof props.startX === "number" ? props.startX : 0;
    const startY = typeof props.startY === "number" ? props.startY : 0;
    const endX = typeof props.endX === "number" ? props.endX : 0;
    const endY = typeof props.endY === "number" ? props.endY : 0;
    const thickness = typeof props.thickness === "number" ? props.thickness : 10;
    return {
      id: shape.id,
      type: "wall",
      label: String(props.label ?? props.productName ?? "Wall"),
      widthMm: canvasUnitsToMillimeters(Math.hypot(endX - startX, endY - startY)),
      heightMm: canvasUnitsToMillimeters(thickness),
      rotation: shape.rotation,
      isLocked: shape.isLocked,
      teamName,
    };
  }

  const widthMm = typeof props.widthMm === "number" ? props.widthMm : 120;
  const heightMm = typeof props.heightMm === "number" ? props.heightMm : 80;

  return {
    id: shape.id,
    type: shape.type.replace("planner-", ""),
    label: String(props.label ?? props.productName ?? shape.type),
    widthMm,
    heightMm,
    rotation: shape.rotation,
    isLocked: shape.isLocked,
    teamName,
  };
}

export function syncSelectionFromEditor(
  editor: Editor,
  setSelected: (value: InspectorData | null) => void,
) {
  const ids = editor.getSelectedShapeIds();
  if (ids.length !== 1) {
    setSelected(null);
    return;
  }

  const shape = editor.getShape(ids[0]);
  if (!shape) {
    setSelected(null);
    return;
  }

  setSelected(shapeToInspectorData(shape));
}

export function applyInspectorChanges(
  editor: Editor,
  shapeId: string,
  changes: Partial<InspectorData>,
) {
  const shape = editor.getShape(shapeId as TLShapeId);
  if (!shape) return;

  const props = { ...(shape.props as Record<string, unknown>) };

  if (changes.label !== undefined) {
    props.label = changes.label;
    if (shape.type === "planner-furniture") {
      props.productName = changes.label;
    }
  }
  if (changes.zoneType !== undefined && shape.type === "planner-zone") {
    props.zoneType = changes.zoneType;
  }
  if (shape.type === "planner-furniture") {
    if (changes.teamName !== undefined) props.teamName = changes.teamName;
    if (changes.seatCount !== undefined) props.seatCount = changes.seatCount;
  }

  if (shape.type === "planner-room" || shape.type === "planner-zone") {
    if (changes.widthMm !== undefined) {
      props.widthMm = millimetersToCanvasUnits(changes.widthMm);
    }
    if (changes.heightMm !== undefined) {
      props.heightMm = millimetersToCanvasUnits(changes.heightMm);
    }
    const w = typeof props.widthMm === "number" ? props.widthMm : 100;
    const h = typeof props.heightMm === "number" ? props.heightMm : 100;
    props.points = rectPoints(w, h);
    if (shape.type === "planner-zone") {
      props.areaSqm = (canvasUnitsToMillimeters(w) * canvasUnitsToMillimeters(h)) / 1000000;
    }
    if (shape.type === "planner-room") {
      const widthMm = canvasUnitsToMillimeters(w);
      const heightMm = canvasUnitsToMillimeters(h);
      props.areaSqm = (widthMm * heightMm) / 1000000;
      props.perimeterMm = Math.round((widthMm + heightMm) * 2);
    }
  }

  if (shape.type === "planner-wall") {
    const startX = typeof props.startX === "number" ? props.startX : 0;
    const startY = typeof props.startY === "number" ? props.startY : 0;
    const endX = typeof props.endX === "number" ? props.endX : 0;
    const endY = typeof props.endY === "number" ? props.endY : 0;
    const currentLength = Math.hypot(endX - startX, endY - startY);

    if (changes.widthMm !== undefined && currentLength > 0) {
      const nextLength = millimetersToCanvasUnits(changes.widthMm);
      const scale = nextLength / currentLength;
      props.endX = startX + (endX - startX) * scale;
      props.endY = startY + (endY - startY) * scale;
      props.lengthMm = Math.round(changes.widthMm);
    }

    if (changes.heightMm !== undefined) {
      props.thickness = Math.max(1, millimetersToCanvasUnits(changes.heightMm));
    }
  }

  if (shape.type === "planner-furniture") {
    if (changes.widthMm !== undefined) {
      props.widthMm = catalogMmToCanvasCm(
        changes.widthMm,
        changes.heightMm ??
          normalizeCatalogMm(
            typeof props.heightMm === "number" ? props.heightMm : 60,
            typeof props.widthMm === "number" ? props.widthMm : 120,
          ),
      );
    }
    if (changes.heightMm !== undefined) {
      props.heightMm = catalogMmToCanvasCm(
        changes.heightMm,
        changes.widthMm ??
          normalizeCatalogMm(
            typeof props.widthMm === "number" ? props.widthMm : 120,
            typeof props.heightMm === "number" ? props.heightMm : 60,
          ),
      );
    }
  } else if (
    shape.type !== "planner-room" &&
    shape.type !== "planner-zone" &&
    shape.type !== "planner-wall"
  ) {
    if (changes.widthMm !== undefined) props.widthMm = changes.widthMm;
    if (changes.heightMm !== undefined) props.heightMm = changes.heightMm;
  }

  editor.updateShape({
    id: shape.id,
    type: shape.type,
    rotation: changes.rotation ?? shape.rotation,
    isLocked: changes.isLocked ?? shape.isLocked,
    props,
  });
}

export function deleteInspectorShape(editor: Editor, shapeId: string) {
  editor.deleteShape(shapeId as TLShapeId);
}

export function duplicateInspectorShape(editor: Editor, shapeId: string) {
  const shape = editor.getShape(shapeId as TLShapeId);
  if (!shape) return;

  editor.createShape({
    ...shape,
    id: createShapeId(),
    x: shape.x + 40,
    y: shape.y + 40,
  });
}
