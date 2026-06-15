import {
  normalizePlannerDocument,
  type PlannerDocument as CanonicalPlannerDocument,
} from "../model";
import { getPlannerSceneEnvelope } from "../lib/documentBridge";

export type PlannerDocument = CanonicalPlannerDocument;

export interface Planner3DRoom {
  widthMm: number;
  depthMm: number;
  wallHeightMm: number;
  wallThicknessMm: number;
  floorThicknessMm: number;
}

export interface Planner3DItemSize {
  widthMm: number;
  depthMm: number;
  heightMm: number;
}

export interface Planner3DItemPosition {
  xMm: number;
  yMm: number;
}

export interface Planner3DItem {
  id: string;
  name: string;
  category: string;
  centerMm: Planner3DItemPosition;
  sizeMm: Planner3DItemSize;
  rotationDeg?: number;
  color?: string;
}

export interface Planner3DSceneDocument {
  id: string;
  title: string;
  note?: string;
  room: Planner3DRoom;
  items: Planner3DItem[];
}

export interface PlannerDocumentSummary {
  roomAreaSqm: number;
  totalFootprintSqm: number;
  itemCount: number;
  largestItemName: string | null;
}

const MM_TO_WORLD = 0.001;
const DEFAULT_WALL_HEIGHT_MM = 2100;
const DEFAULT_WALL_THICKNESS_MM = 120;
const DEFAULT_FLOOR_THICKNESS_MM = 40;
const DEFAULT_ITEM_WIDTH_MM = 1200;
const DEFAULT_ITEM_DEPTH_MM = 1200;
const DEFAULT_ITEM_HEIGHT_MM = 900;

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function coercePositiveMm(value: unknown, fallback: number) {
  const candidate = toFiniteNumber(value);
  const resolved = candidate !== null && candidate > 0 ? candidate : fallback;
  return Math.max(1, Math.round(resolved));
}

function coerceCoordinateMm(value: unknown, fallback: number) {
  const candidate = toFiniteNumber(value);
  return Math.round(candidate ?? fallback);
}

function coerceRotationDeg(value: unknown) {
  const candidate = toFiniteNumber(value);
  if (candidate === null) return 0;
  return ((candidate % 360) + 360) % 360;
}

function coerceText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function resolveDocumentRoomFallback(document: unknown, normalized: PlannerDocument) {
  const candidate = document && typeof document === "object" ? (document as Partial<PlannerDocument>) : null;

  return {
    widthMm: coercePositiveMm(candidate?.roomWidthMm, normalized.roomWidthMm),
    depthMm: coercePositiveMm(candidate?.roomDepthMm, normalized.roomDepthMm),
  };
}

function buildSafeRoom(
  fallbackRoom: { widthMm: number; depthMm: number },
  room: Partial<Planner3DRoom> | null | undefined,
): Planner3DRoom {
  return {
    widthMm: coercePositiveMm(room?.widthMm, fallbackRoom.widthMm),
    depthMm: coercePositiveMm(room?.depthMm, fallbackRoom.depthMm),
    wallHeightMm: coercePositiveMm(room?.wallHeightMm, DEFAULT_WALL_HEIGHT_MM),
    wallThicknessMm: coercePositiveMm(room?.wallThicknessMm, DEFAULT_WALL_THICKNESS_MM),
    floorThicknessMm: coercePositiveMm(room?.floorThicknessMm, DEFAULT_FLOOR_THICKNESS_MM),
  };
}

function buildSafeItems(room: Planner3DRoom, items: unknown): Planner3DItem[] {
  if (!Array.isArray(items)) return [];

  const fallbackCenter = {
    xMm: Math.round(room.widthMm / 2),
    yMm: Math.round(room.depthMm / 2),
  };

  return items.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];

    const item = candidate as Partial<Planner3DItem>;
    const category = coerceText(item.category, "Workstations");
    const name = coerceText(item.name, `Planner item ${index + 1}`);

    return [
      {
        id: coerceText(item.id, `planner-item-${index + 1}`),
        name,
        category,
        centerMm: {
          xMm: coerceCoordinateMm(item.centerMm?.xMm, fallbackCenter.xMm),
          yMm: coerceCoordinateMm(item.centerMm?.yMm, fallbackCenter.yMm),
        },
        sizeMm: {
          widthMm: coercePositiveMm(item.sizeMm?.widthMm, DEFAULT_ITEM_WIDTH_MM),
          depthMm: coercePositiveMm(item.sizeMm?.depthMm, DEFAULT_ITEM_DEPTH_MM),
          heightMm: coercePositiveMm(item.sizeMm?.heightMm, DEFAULT_ITEM_HEIGHT_MM),
        },
        rotationDeg: coerceRotationDeg(item.rotationDeg),
        color: resolveFallbackColor(category),
      } satisfies Planner3DItem,
    ];
  });
}

function resolveFallbackColor(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("storage")) return "#4b5563";
  if (normalized.includes("seat") || normalized.includes("sofa") || normalized.includes("lounge")) return "#8d6b4f";
  if (normalized.includes("table")) return "#c08a45";
  if (normalized.includes("desk") || normalized.includes("work")) return "#6f8594";
  return "#6f7e87";
}

export function buildPlanner3DSceneDocument(document: PlannerDocument): Planner3DSceneDocument {
  const normalized = normalizePlannerDocument(document);
  const scene = getPlannerSceneEnvelope(normalized.sceneJson);
  const fallbackRoom = resolveDocumentRoomFallback(document, normalized);
  const room = buildSafeRoom(fallbackRoom, scene?.room);
  const items = buildSafeItems(room, scene?.items);

  return {
    id: normalized.id ?? "planner-preview",
    title: normalized.name,
    note: normalized.projectName ?? normalized.clientName ?? undefined,
    room,
    items,
  };
}

export function mmToWorld(mm: number) {
  return mm * MM_TO_WORLD;
}

export function formatMm(mm: number) {
  return `${Math.round(mm).toLocaleString("en-IN")} mm`;
}

export function formatMeters(mm: number) {
  return `${(mm / 1000).toFixed(mm >= 10000 ? 0 : 1)} m`;
}

export function formatAreaSqm(areaMm2: number) {
  return `${(areaMm2 / 1000000).toFixed(1)} m2`;
}

export function summarizePlannerDocument(document: PlannerDocument): PlannerDocumentSummary {
  const scene = buildPlanner3DSceneDocument(document);
  const roomAreaMm2 = scene.room.widthMm * scene.room.depthMm;
  const totalFootprintMm2 = scene.items.reduce(
    (total, item) => total + item.sizeMm.widthMm * item.sizeMm.depthMm,
    0,
  );

  const largestItem = scene.items.reduce<{ name: string; areaMm2: number } | null>((best, item) => {
    const areaMm2 = item.sizeMm.widthMm * item.sizeMm.depthMm;
    if (!best || areaMm2 > best.areaMm2) {
      return { name: item.name, areaMm2 };
    }
    return best;
  }, null);

  return {
    roomAreaSqm: roomAreaMm2 / 1000000,
    totalFootprintSqm: totalFootprintMm2 / 1000000,
    itemCount: scene.items.length,
    largestItemName: largestItem?.name ?? null,
  };
}
