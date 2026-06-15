import type { Editor } from "tldraw";

import { repairPlannerShapeUnits } from "@/features/planner/editor/repairPlannerShapeUnits";
import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";
import { canvasUnitsToMillimeters, readMmPerCanvasUnit } from "@/features/planner/lib/calibrationScale";
import { normalizeCatalogMm } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import {
  createPlannerDocument,
  normalizePlannerDocument,
  type PlannerDocument,
  type PlannerJsonValue,
  type PlannerMeasurementSourceUnit,
} from "../model";
import { getShapeMeta, getStructuralShapes, type MeasurementUnit } from "./measurements";

const DEFAULT_ROOM_WIDTH_MM = 6000;
const DEFAULT_ROOM_DEPTH_MM = 8000;
const DEFAULT_ROOM_HEIGHT_MM = 2100;
const DEFAULT_WALL_THICKNESS_MM = 120;
const DEFAULT_FLOOR_THICKNESS_MM = 40;

export interface PlannerSceneRoom {
  widthMm: number;
  depthMm: number;
  wallHeightMm: number;
  wallThicknessMm: number;
  floorThicknessMm: number;
  originMm: {
    xMm: number;
    yMm: number;
  };
}

export interface PlannerSceneItem {
  id: string;
  productId?: string;
  productSlug?: string;
  plannerSourceSlug?: string;
  name: string;
  category: string;
  imageUrl?: string;
  dimensions?: string;
  centerMm: {
    xMm: number;
    yMm: number;
  };
  sizeMm: {
    widthMm: number;
    depthMm: number;
    heightMm: number;
  };
  rotationDeg: number;
}

export interface PlannerSceneEnvelope {
  type: "cad-suite-planner-scene";
  version: 1;
  measurement: {
    canonicalUnit: "mm";
    displayUnit: MeasurementUnit;
    sourceUnit?: PlannerMeasurementSourceUnit;
  };
  room: PlannerSceneRoom;
  items: PlannerSceneItem[];
  tldrawSnapshot: unknown;
}

export interface BuildPlannerDocumentFromEditorOptions {
  documentId?: string | null;
  name?: string;
  projectName?: string | null;
  clientName?: string | null;
  preparedBy?: string | null;
  seatTarget?: number;
  unitSystem: MeasurementUnit;
  thumbnailUrl?: string | null;
}

type PlannerBounds = NonNullable<ReturnType<Editor["getShapePageBounds"]>>;

function clampPositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.round(value));
}

function mergeBounds(boundsList: PlannerBounds[]) {
  if (boundsList.length === 0) return null;

  const minX = Math.min(...boundsList.map((bounds) => bounds.minX));
  const minY = Math.min(...boundsList.map((bounds) => bounds.minY));
  const maxX = Math.max(...boundsList.map((bounds) => bounds.maxX));
  const maxY = Math.max(...boundsList.map((bounds) => bounds.maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX,
    h: maxY - minY,
  };
}

function sanitizePlannerSnapshot<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePlannerSnapshot(entry)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const clone: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "meta" && entry && typeof entry === "object" && !Array.isArray(entry)) {
      const metaWithoutPrice = { ...(entry as Record<string, unknown>) };
      delete metaWithoutPrice.price;
      clone[key] = sanitizePlannerSnapshot(metaWithoutPrice);
      continue;
    }

    clone[key] = sanitizePlannerSnapshot(entry);
  }

  return clone as T;
}

function toMillimeters(value: number, rawDimensions?: string) {
  if (!Number.isFinite(value)) return 0;
  const hint = String(rawDimensions ?? "").toLowerCase();

  if (hint.includes("cm") && !hint.includes("mm")) {
    return normalizeCatalogMm(value);
  }

  if (hint.includes("m") && !hint.includes("mm") && !hint.includes("cm")) {
    return Math.round(value * 1000);
  }

  // Heuristic: small numbers (<300) with no explicit mm are likely cm
  if (!hint.includes("mm") && value < 300) {
    return normalizeCatalogMm(value);
  }

  return Math.round(value);
}

function parseDimensionNumbers(rawDimensions?: string) {
  if (!rawDimensions) return [];

  return rawDimensions
    .match(/\d+(?:\.\d+)?/g)
    ?.map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value)) ?? [];
}

function estimateHeightMm(meta: PlannerShapeMeta, widthMm: number, depthMm: number) {
  const parsed = parseDimensionNumbers(meta.dimensions);
  if (parsed.length >= 3) {
    return clampPositiveInteger(toMillimeters(parsed[2], meta.dimensions), Math.max(widthMm, depthMm));
  }

  const category = String(meta.category ?? "").toLowerCase();
  if (category.includes("storage")) return 2100;
  if (category.includes("table") || category.includes("desk") || category.includes("work")) return 750;
  if (category.includes("seat") || category.includes("sofa") || category.includes("lounge")) return 900;
  return 900;
}

function getSceneRoom(editor: Editor): PlannerSceneRoom {
  const mmPerUnit = readMmPerCanvasUnit();
  const roomBounds = mergeBounds(
    getStructuralShapes(editor)
      .map((shape) => editor.getShapePageBounds(shape.id))
      .filter((bounds): bounds is PlannerBounds => bounds !== null),
  );

  if (!roomBounds) {
    return {
      widthMm: DEFAULT_ROOM_WIDTH_MM,
      depthMm: DEFAULT_ROOM_DEPTH_MM,
      wallHeightMm: DEFAULT_ROOM_HEIGHT_MM,
      wallThicknessMm: DEFAULT_WALL_THICKNESS_MM,
      floorThicknessMm: DEFAULT_FLOOR_THICKNESS_MM,
      originMm: { xMm: 0, yMm: 0 },
    };
  }

  return {
    widthMm: clampPositiveInteger(canvasUnitsToMillimeters(roomBounds.w, mmPerUnit), DEFAULT_ROOM_WIDTH_MM),
    depthMm: clampPositiveInteger(canvasUnitsToMillimeters(roomBounds.h, mmPerUnit), DEFAULT_ROOM_DEPTH_MM),
    wallHeightMm: DEFAULT_ROOM_HEIGHT_MM,
    wallThicknessMm: DEFAULT_WALL_THICKNESS_MM,
    floorThicknessMm: DEFAULT_FLOOR_THICKNESS_MM,
    originMm: {
      xMm: canvasUnitsToMillimeters(roomBounds.minX, mmPerUnit),
      yMm: canvasUnitsToMillimeters(roomBounds.minY, mmPerUnit),
    },
  };
}

function getSceneItems(editor: Editor, room: PlannerSceneRoom): PlannerSceneItem[] {
  const mmPerUnit = readMmPerCanvasUnit();
  return editor
    .getCurrentPageShapes()
    .filter((shape) => getShapeMeta(shape.meta).isPlannerItem)
    .map((shape) => {
      const meta = getShapeMeta(shape.meta);
      const bounds = editor.getShapePageBounds(shape.id);
      const parsed = parseDimensionNumbers(meta.dimensions);

      const widthMm = clampPositiveInteger(
        parsed[0] ? toMillimeters(parsed[0], meta.dimensions) : canvasUnitsToMillimeters(bounds?.w ?? 120, mmPerUnit),
        1200,
      );
      const depthMm = clampPositiveInteger(
        parsed[1] ? toMillimeters(parsed[1], meta.dimensions) : canvasUnitsToMillimeters(bounds?.h ?? 120, mmPerUnit),
        1200,
      );
      const heightMm = estimateHeightMm(meta, widthMm, depthMm);
      const centerX = bounds ? canvasUnitsToMillimeters(bounds.minX, mmPerUnit) + widthMm / 2 : widthMm / 2;
      const centerY = bounds ? canvasUnitsToMillimeters(bounds.minY, mmPerUnit) + depthMm / 2 : depthMm / 2;
      const originRelativeX = Math.round(centerX - room.originMm.xMm);
      const originRelativeY = Math.round(centerY - room.originMm.yMm);
      const rotationRad = typeof shape.rotation === "number" ? shape.rotation : 0;

      return {
        id: String(shape.id),
        productId: meta.productId,
        productSlug: meta.productSlug,
        plannerSourceSlug: meta.plannerSourceSlug,
        name: meta.text || "Planner item",
        category: meta.category || "Workstations",
        imageUrl: meta.imageUrl,
        dimensions: meta.dimensions,
        centerMm: {
          xMm: originRelativeX,
          yMm: originRelativeY,
        },
        sizeMm: {
          widthMm,
          depthMm,
          heightMm,
        },
        rotationDeg: Math.round((rotationRad * 180) / Math.PI),
      } satisfies PlannerSceneItem;
    });
}

export function isPlannerSceneEnvelope(value: unknown): value is PlannerSceneEnvelope {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<PlannerSceneEnvelope>;
  return candidate.type === "cad-suite-planner-scene" && candidate.version === 1;
}

export function getPlannerSceneEnvelope(sceneJson: PlannerJsonValue): PlannerSceneEnvelope | null {
  if (isPlannerSceneEnvelope(sceneJson)) return sceneJson;

  if (sceneJson && typeof sceneJson === "object" && !Array.isArray(sceneJson)) {
    const obj = sceneJson as Record<string, unknown>;
    if (isPlannerSceneEnvelope(obj.plannerScene)) {
      return obj.plannerScene;
    }
  }

  return null;
}

export function buildPlannerDocumentFromEditor(
  editor: Editor,
  options: BuildPlannerDocumentFromEditorOptions,
): PlannerDocument {
  const room = getSceneRoom(editor);
  const items = getSceneItems(editor, room);
  const snapshot = sanitizePlannerSnapshot(editor.getSnapshot());

  const sceneJson = {
    type: "cad-suite-planner-scene",
    version: 1,
    measurement: {
      canonicalUnit: "mm",
      displayUnit: options.unitSystem,
      sourceUnit: "mm",
    },
    room,
    items,
    tldrawSnapshot: snapshot,
  } satisfies PlannerSceneEnvelope;

  return createPlannerDocument({
    id: options.documentId ?? undefined,
    name: options.name,
    projectName: options.projectName ?? null,
    clientName: options.clientName ?? null,
    preparedBy: options.preparedBy ?? null,
    roomWidthMm: room.widthMm,
    roomDepthMm: room.depthMm,
    seatTarget: options.seatTarget ?? 10,
    unitSystem: options.unitSystem === "ft-in" ? "imperial" : "metric",
    sceneJson: sceneJson as unknown as PlannerJsonValue,
    itemCount: items.length,
    thumbnailUrl: options.thumbnailUrl ?? null,
  });
}

export function loadPlannerDocumentIntoEditor(editor: Editor, document: PlannerDocument) {
  const normalized = normalizePlannerDocument(document);
  const scene = getPlannerSceneEnvelope(normalized.sceneJson);
  const snapshot = scene?.tldrawSnapshot;

  if (!snapshot || typeof snapshot !== "object") return false;

  editor.loadSnapshot(snapshot as Parameters<Editor["loadSnapshot"]>[0]);
  repairPlannerShapeUnits(editor);
  editor.setCurrentTool("select");
  editor.zoomToFit({ animation: { duration: 200 } });
  return true;
}
