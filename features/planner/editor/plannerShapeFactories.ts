/**
 * plannerShapeFactories — pure builders that translate catalog items,
 * templates, and tldraw page shapes into planner canvas/viewer shapes.
 *
 * Kept free of React so the factories stay unit-testable.
 */

import { createShapeId } from "@tldraw/editor";
import type { Editor, TLShape } from "tldraw";

import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  isCatalogShapeType,
  isRoomCatalogShapeType,
  PlannerCatalogShapeType,
  roomTypeFromCatalogShapeType,
} from "@/features/planner/catalog/shapeTypeRegistry";
import {
  computeWallOpenings,
  doorPlanSize,
  findWallAttachment,
  rectCenterAt,
  windowPlanSize,
  type OpeningCandidate,
  type WallSegmentSpec,
} from "@/features/planner/lib/geometry/wallOpenings";
import { canvasUnitsToMillimeters } from "@/features/planner/lib/calibrationScale";
import type { LayoutTemplate, TemplateShape } from "@/features/planner/templates/layoutTemplates";
import { isShapeLayerHidden } from "@/features/planner/editor/layerVisibility";
import { fitPlannerContent } from "@/features/planner/editor/plannerCamera";
import { plannerCanvasUnits } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import type { PlannerViewerShape } from "@/features/planner/viewer/PlannerViewer";
import { BLOCK_STYLE } from "@/lib/catalog/blocks2d";

export type PlannerCanvasShape = {
  id: ReturnType<typeof createShapeId>;
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

function shapeLabel(props: Record<string, unknown>): string | undefined {
  return typeof props.label === "string"
    ? props.label
    : typeof props.productName === "string"
      ? props.productName
      : undefined;
}

function shapeColor(props: Record<string, unknown>): string | undefined {
  return (
    (typeof props.strokeColor === "string" && props.strokeColor) ||
    (typeof props.color === "string" && props.color) ||
    undefined
  );
}

/**
 * Plan footprint of a door/window tldraw shape: size in canvas units plus the
 * page-space center of its rectangle (honouring the shape's rotation).
 */
function openingFootprint(shape: TLShape): {
  kind: "door" | "window";
  width: number;
  depth: number;
  center: { x: number; y: number };
} | null {
  const props = (shape.props ?? {}) as Record<string, unknown>;
  const widthMm = typeof props.widthMm === "number" ? props.widthMm : 0;
  if (widthMm <= 0) return null;

  if (shape.type === "planner-door") {
    const thicknessMm = typeof props.thicknessMm === "number" ? props.thicknessMm : 40;
    const { width, depth } = doorPlanSize({ widthMm, thicknessMm });
    return {
      kind: "door",
      width,
      depth,
      center: rectCenterAt(shape.x, shape.y, width, depth, shape.rotation),
    };
  }
  if (shape.type === "planner-window") {
    const frameThicknessMm = typeof props.frameThicknessMm === "number" ? props.frameThicknessMm : 50;
    const { width, depth } = windowPlanSize({ widthMm, frameThicknessMm });
    return {
      kind: "window",
      width,
      depth,
      center: rectCenterAt(shape.x, shape.y, width, depth, shape.rotation),
    };
  }
  return null;
}

export function toPlannerViewerShapes(shapes: TLShape[]): PlannerViewerShape[] {
  const result: PlannerViewerShape[] = [];

  // Pass 1 — collect wall segments and door/window footprints so walls can
  // cut openings and openings can align flush to their wall in 3D.
  const wallSpecs: WallSegmentSpec[] = [];
  const openingCandidates: OpeningCandidate[] = [];
  for (const shape of shapes) {
    if (isShapeLayerHidden(shape)) continue;
    if (shape.type === "planner-wall") {
      const props = (shape.props ?? {}) as unknown as Record<string, unknown>;
      wallSpecs.push({
        id: String(shape.id),
        start: {
          x: shape.x + (typeof props.startX === "number" ? props.startX : 0),
          y: shape.y + (typeof props.startY === "number" ? props.startY : 0),
        },
        end: {
          x: shape.x + (typeof props.endX === "number" ? props.endX : 0),
          y: shape.y + (typeof props.endY === "number" ? props.endY : 0),
        },
        thickness: typeof props.thickness === "number" ? Math.max(1, props.thickness) : 12,
      });
      continue;
    }
    const footprint = openingFootprint(shape);
    if (footprint) {
      openingCandidates.push({
        id: String(shape.id),
        kind: footprint.kind,
        center: footprint.center,
        width: footprint.width,
      });
    }
  }
  const wallSpecById = new Map(wallSpecs.map((spec) => [spec.id, spec]));

  // Pass 2 — emit viewer shapes.
  for (const shape of shapes) {
    if (isShapeLayerHidden(shape)) continue;
    const props = (shape.props ?? {}) as Record<string, unknown>;
    const label = shapeLabel(props);
    const color = shapeColor(props);
    const shapeType = shape.type as string;

    if (shapeType === "planner-wall") {
      const spec = wallSpecById.get(String(shape.id));
      if (!spec) continue;
      const openings = computeWallOpenings(spec, openingCandidates);
      result.push({
        id: shape.id,
        type: "planner-wall",
        x: shape.x,
        y: shape.y,
        rotation: shape.rotation,
        width: Math.max(Math.abs(spec.end.x - spec.start.x), 1),
        height: Math.max(Math.abs(spec.end.y - spec.start.y), spec.thickness),
        label,
        color,
        wall: {
          startX: spec.start.x,
          startY: spec.start.y,
          endX: spec.end.x,
          endY: spec.end.y,
          thickness: spec.thickness,
          ...(openings.length > 0
            ? { openings: openings.map(({ start, end, kind }) => ({ start, end, kind })) }
            : {}),
        },
      });
      continue;
    }

    if (shapeType === "planner-door" || shapeType === "planner-window") {
      const footprint = openingFootprint(shape);
      if (!footprint) continue;

      // Align flush to the wall the opening sits on; fall back to the
      // shape's own transform when freestanding.
      const attachment = findWallAttachment(wallSpecs, footprint.center);
      const center = attachment ? attachment.point : footprint.center;
      const rotationDeg = (attachment ? attachment.angle : shape.rotation) * (180 / Math.PI);
      result.push({
        id: shape.id,
        type: shapeType as PlannerViewerShape["type"],
        x: center.x - footprint.width / 2,
        y: center.y - footprint.depth / 2,
        rotation: rotationDeg,
        width: footprint.width,
        height: footprint.depth,
        label,
        color,
      });
      continue;
    }

    const width = typeof props.widthMm === "number" ? plannerCanvasUnits(props.widthMm) : 120;
    const height = typeof props.heightMm === "number" ? plannerCanvasUnits(props.heightMm) : 80;
    const type = (
      shapeType === "planner-room" ||
      shapeType === "planner-furniture" ||
      shapeType === "planner-zone"
    ) ? shapeType as PlannerViewerShape["type"] : null;

    if (!type) continue;

    result.push({
      id: shape.id,
      type,
      x: shape.x,
      y: shape.y,
      rotation: shape.rotation,
      width,
      height,
      label,
      color,
      ...(type === "planner-furniture" && typeof props.catalogId === "string"
        ? { catalogId: props.catalogId }
        : {}),
      ...(type === "planner-furniture" && typeof props.modelUrl === "string"
        ? { modelUrl: props.modelUrl }
        : {}),
    });
  }

  return result;
}

export function buildRoomShape(
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
  label: string,
  roomType: PlannerRoomType = "office",
): PlannerCanvasShape {
  const widthMetricMm = canvasUnitsToMillimeters(widthMm);
  const heightMetricMm = canvasUnitsToMillimeters(heightMm);
  return {
    id: createShapeId(),
    type: "planner-room",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {
      points: [
        { x: 0, y: 0 },
        { x: widthMm, y: 0 },
        { x: widthMm, y: heightMm },
        { x: 0, y: heightMm },
      ],
      roomType,
      areaSqm: (widthMetricMm * heightMetricMm) / 1000000,
      perimeterMm: Math.round((widthMetricMm + heightMetricMm) * 2),
      floorMaterial: "carpet",
      widthMm,
      heightMm,
      showArea: true,
      showPerimeter: false,
      fillOpacity: 0.25,
      label,
      showLabel: true,
      color: "var(--color-primary)",
      fillColor: "var(--surface-glass)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    },
  };
}

export function buildZoneShape(
  x: number,
  y: number,
  widthMm: number,
  heightMm: number,
  label: string,
  zoneType: PlannerZoneType = "focus",
): PlannerCanvasShape {
  const widthMetricMm = canvasUnitsToMillimeters(widthMm);
  const heightMetricMm = canvasUnitsToMillimeters(heightMm);
  const areaSqm = (widthMetricMm * heightMetricMm) / 1000000;
  return {
    id: createShapeId(),
    type: "planner-zone",
    x,
    y,
    rotation: 0,
    opacity: 0.6,
    isLocked: false,
    props: {
      points: [
        { x: 0, y: 0 },
        { x: widthMm, y: 0 },
        { x: widthMm, y: heightMm },
        { x: 0, y: heightMm },
      ],
      zoneType,
      areaSqm,
      capacity: Math.max(1, Math.round(areaSqm / 1.2)),
      currentOccupancy: 0,
      widthMm,
      heightMm,
      areaPerPerson: 10,
      maxCapacity: Math.max(1, Math.round(areaSqm / 1.2)),
      showBoundary: true,
      showFill: true,
      showCapacity: true,
      showOccupancy: false,
      fillPattern: "solid",
      dashArray: [],
      zoneColor: "var(--color-ocean-boat-blue-500)",
      fillColor: "var(--surface-glass)",
      label,
      showLabel: true,
      color: "var(--color-primary)",
      strokeColor: "var(--color-primary)",
      strokeWidth: 2,
    },
  };
}

export function buildFurnitureShape(x: number, y: number, item: {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  category?: string;
  seatCount?: number;
}): PlannerCanvasShape {
  const widthMm = item.widthMm;
  const heightMm = item.heightMm;
  const depthMm = item.depthMm ?? item.heightMm;

  const furnitureCategory =
    item.category === "storage"
      ? "storage"
      : item.category === "equipment"
        ? "accessory"
        : item.category === "rooms"
          ? "table"
          : "workstation";

  return {
    id: createShapeId(),
    type: "planner-furniture",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {
      furnitureCategory,
      furnitureType: item.name.toLowerCase().replace(/\s+/g, "-"),
      widthMm,
      heightMm,
      depthMm,
      height3dMm: 75,
      catalogId: item.id,
      productSlug: item.id,
      sku: item.id,
      productName: item.name,
      manufacturer: "Buddy",
      imageUrl: "",
      isAgainstWall: false,
      snapDistance: 10,
      showDimensions: false,
      showLabel: true,
      renderStyle: "filled",
      color: BLOCK_STYLE.surfaceStroke,
      fillColor: BLOCK_STYLE.surface,
      strokeColor: BLOCK_STYLE.surfaceStroke,
      strokeWidth: BLOCK_STYLE.surfaceStrokeWidth,
      ...(item.seatCount !== undefined ? { seatCount: item.seatCount } : {}),
    },
  };
}

/** Single entry point for catalog drops/clicks — zone, room, or furniture. */
export function buildCatalogShape(item: CatalogItem, x: number, y: number): PlannerCanvasShape {
  if (isCatalogShapeType(item.shapeType, PlannerCatalogShapeType.zone)) {
    return buildZoneShape(x, y, item.widthMm, item.heightMm, item.name);
  }
  if (isRoomCatalogShapeType(item.shapeType)) {
    return buildRoomShape(
      x,
      y,
      item.widthMm,
      item.heightMm,
      item.name,
      roomTypeFromCatalogShapeType(item.shapeType),
    );
  }
  return buildFurnitureShape(x, y, item);
}

export function buildTemplateShapes(template: LayoutTemplate): PlannerCanvasShape[] {
  const baseX = 120;
  const baseY = 120;
  const roomWidth = Math.max(template.recommendedRoomSize.minWidth, 900);
  const roomHeight = Math.max(template.recommendedRoomSize.minHeight, 620);
  const shapes: PlannerCanvasShape[] = [
    buildRoomShape(baseX, baseY, roomWidth, roomHeight, template.name, "office"),
  ];

  const addTemplateShape = (shape: TemplateShape) => {
    const x = baseX + Math.round(shape.x * roomWidth);
    const y = baseY + Math.round(shape.y * roomHeight);

    if (isCatalogShapeType(shape.type, PlannerCatalogShapeType.zone)) {
      shapes.push(
        buildZoneShape(
          x,
          y,
          shape.widthMm,
          shape.heightMm,
          shape.label,
          (shape.zoneType as PlannerZoneType | undefined) ?? "focus",
        ),
      );
      return;
    }

    if (isRoomCatalogShapeType(shape.type)) {
      shapes.push(
        buildRoomShape(
          x,
          y,
          shape.widthMm,
          shape.heightMm,
          shape.label,
          roomTypeFromCatalogShapeType(shape.type),
        ),
      );
      return;
    }

    shapes.push(
      buildFurnitureShape(x, y, {
        id: `${template.id}-${shape.label.toLowerCase().replace(/\s+/g, "-")}`,
        name: shape.label,
        widthMm: shape.widthMm,
        heightMm: shape.heightMm,
        depthMm: shape.heightMm,
        category: "desks",
      }),
    );
  };

  template.shapes.forEach(addTemplateShape);
  return shapes;
}

/** Replace the current page contents with the given shapes and refit the camera. */
export function applyShapes(editor: Editor, shapes: PlannerCanvasShape[]) {
  const existingIds = editor.getCurrentPageShapes().map((shape) => shape.id);
  if (existingIds.length > 0) {
    editor.deleteShapes(existingIds);
  }
  for (const shape of shapes) {
    editor.createShape(shape as unknown as Parameters<Editor["createShape"]>[0]);
  }
  fitPlannerContent(editor);
}
