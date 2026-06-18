import type { PlannerShapeMeta } from "@/features/planner/shared/types/planner";
import { canvasUnitsToMillimeters } from "@/features/planner/lib/calibrationScale";
import {
  normalizeCatalogMm,
  plannerCanvasUnits,
} from "@/features/planner/catalog/catalogBlockBridge";

type LayerManagerShape = {
  id: string;
  type: string;
  isLocked?: boolean;
  meta?: unknown;
  rotation?: number;
  props?: unknown;
};

export interface LayerManagerEntry {
  id: string;
  label: string;
  category: LayerManagerCategory;
  typeLabel: string;
  detail: string;
  isLocked: boolean;
  isSelected: boolean;
}

export const LAYER_MANAGER_CATEGORIES = [
  "all",
  "wall",
  "door",
  "window",
  "room",
  "zone",
  "furniture",
  "measurement",
] as const;

export type LayerManagerCategory = (typeof LAYER_MANAGER_CATEGORIES)[number];

export interface LayerManagerGroup {
  category: Exclude<LayerManagerCategory, "all"> | "other";
  label: string;
  entries: LayerManagerEntry[];
}

export interface LayerManagerSelectionOptions {
  anchorId: string | null;
  clickedId: string;
  currentIds: ReadonlyArray<string>;
  orderedIds: ReadonlyArray<string>;
  extendRange?: boolean;
  toggleSelection?: boolean;
}

export interface LayerManagerGroupSelectionSummary {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
}

function getShapeMeta(meta: unknown): PlannerShapeMeta {
  return meta && typeof meta === "object" ? (meta as PlannerShapeMeta) : {};
}

function formatShapeTypeLabel(type: string) {
  return type.replace(/^planner-/, "").replace(/-/g, " ");
}

function getShapeCategory(type: string): LayerManagerCategory {
  const formatted = formatShapeTypeLabel(type);
  return (
    LAYER_MANAGER_CATEGORIES.find((category) => category !== "all" && category === formatted) ??
    "all"
  );
}

function getShapeLabel(shape: LayerManagerShape) {
  const meta = getShapeMeta(shape.meta);
  const props =
    shape.props && typeof shape.props === "object"
      ? (shape.props as Record<string, unknown>)
      : {};

  if (typeof props.productName === "string" && props.productName.trim().length > 0) {
    return props.productName.trim();
  }

  if (typeof props.label === "string" && props.label.trim().length > 0) {
    return props.label.trim();
  }

  if (typeof meta.text === "string" && meta.text.trim().length > 0) {
    return meta.text.trim();
  }

  switch (shape.type) {
    case "planner-wall":
      return "Wall";
    case "planner-door":
      return "Door";
    case "planner-window":
      return "Window";
    case "planner-room":
      return "Room";
    case "planner-zone":
      return "Zone";
    case "planner-furniture":
      return "Furniture";
    case "planner-measurement":
      return "Measurement";
    default:
      return formatShapeTypeLabel(shape.type);
  }
}

function getWallLengthMm(props: Record<string, unknown>) {
  const startX = typeof props.startX === "number" ? props.startX : null;
  const startY = typeof props.startY === "number" ? props.startY : null;
  const endX = typeof props.endX === "number" ? props.endX : null;
  const endY = typeof props.endY === "number" ? props.endY : null;

  if (startX === null || startY === null || endX === null || endY === null) {
    return null;
  }

  return canvasUnitsToMillimeters(Math.hypot(endX - startX, endY - startY));
}

function formatShapeDetail(shape: LayerManagerShape, unitSystem: "metric" | "imperial") {
  const props =
    shape.props && typeof shape.props === "object"
      ? (shape.props as Record<string, unknown>)
      : {};
  const widthMm = typeof props.widthMm === "number" ? props.widthMm : null;
  const heightMm = typeof props.heightMm === "number" ? props.heightMm : null;

  if (widthMm !== null && heightMm !== null) {
    const displayWidthMm =
      shape.type === "planner-room" || shape.type === "planner-zone"
        ? canvasUnitsToMillimeters(plannerCanvasUnits(widthMm, heightMm))
        : normalizeCatalogMm(widthMm, heightMm);
    const displayHeightMm =
      shape.type === "planner-room" || shape.type === "planner-zone"
        ? canvasUnitsToMillimeters(plannerCanvasUnits(heightMm, widthMm))
        : normalizeCatalogMm(heightMm, widthMm);
    const unitLabel = unitSystem === "imperial" ? "mm source" : "mm";
    return `${displayWidthMm} x ${displayHeightMm} ${unitLabel}`;
  }

  if (shape.type === "planner-wall") {
    const wallLengthMm = getWallLengthMm(props);
    if (wallLengthMm !== null) {
      return `${wallLengthMm} mm wall`;
    }
  }

  const rotation = typeof shape.rotation === "number"
    ? `${Math.round((shape.rotation * 180) / Math.PI)} deg`
    : null;

  return rotation ?? "Ready";
}

export function buildLayerManagerEntries(
  shapes: ReadonlyArray<LayerManagerShape>,
  selectedIds: ReadonlyArray<string>,
  unitSystem: "metric" | "imperial",
): LayerManagerEntry[] {
  const selected = new Set(selectedIds);

  return shapes
    .map((shape) => ({
      id: shape.id,
      label: getShapeLabel(shape),
      category: getShapeCategory(shape.type),
      typeLabel: formatShapeTypeLabel(shape.type),
      detail: formatShapeDetail(shape, unitSystem),
      isLocked: shape.isLocked === true,
      isSelected: selected.has(shape.id),
    }))
    .reverse();
}

export function filterLayerManagerEntries(
  entries: ReadonlyArray<LayerManagerEntry>,
  category: LayerManagerCategory,
  query: string,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return entries.filter((entry) => {
    if (category !== "all" && entry.category !== category) {
      return false;
    }

    if (normalizedQuery.length === 0) {
      return true;
    }

    const haystack = `${entry.label} ${entry.typeLabel} ${entry.detail}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
}

const GROUP_ORDER: ReadonlyArray<LayerManagerGroup["category"]> = [
  "wall",
  "door",
  "window",
  "room",
  "zone",
  "furniture",
  "measurement",
  "other",
];

const GROUP_LABELS: Record<LayerManagerGroup["category"], string> = {
  wall: "Walls",
  door: "Doors",
  window: "Windows",
  room: "Rooms",
  zone: "Zones",
  furniture: "Furniture",
  measurement: "Measurements",
  other: "Other",
};

export function groupLayerManagerEntries(
  entries: ReadonlyArray<LayerManagerEntry>,
): LayerManagerGroup[] {
  const grouped = new Map<LayerManagerGroup["category"], LayerManagerEntry[]>();

  for (const entry of entries) {
    const category: LayerManagerGroup["category"] =
      entry.category === "all" ? "other" : entry.category;
    const existing = grouped.get(category) ?? [];
    existing.push(entry);
    grouped.set(category, existing);
  }

  return GROUP_ORDER
    .map((category) => {
      const categoryEntries = grouped.get(category);
      if (!categoryEntries || categoryEntries.length === 0) {
        return null;
      }
      return {
        category,
        label: GROUP_LABELS[category],
        entries: categoryEntries,
      };
    })
    .filter((group): group is LayerManagerGroup => group !== null);
}

export function getNextLayerSelection({
  anchorId,
  clickedId,
  currentIds,
  orderedIds,
  extendRange = false,
  toggleSelection = false,
}: LayerManagerSelectionOptions) {
  if (extendRange && anchorId) {
    const anchorIndex = orderedIds.indexOf(anchorId);
    const clickedIndex = orderedIds.indexOf(clickedId);
    if (anchorIndex >= 0 && clickedIndex >= 0) {
      const start = Math.min(anchorIndex, clickedIndex);
      const end = Math.max(anchorIndex, clickedIndex);
      return orderedIds.slice(start, end + 1);
    }
  }

  if (toggleSelection) {
    const current = new Set(currentIds);
    if (current.has(clickedId)) {
      current.delete(clickedId);
    } else {
      current.add(clickedId);
    }
    return orderedIds.filter((id) => current.has(id));
  }

  return [clickedId];
}

export function summarizeLayerGroupSelection(
  entries: ReadonlyArray<LayerManagerEntry>,
): LayerManagerGroupSelectionSummary {
  const totalCount = entries.length;
  const selectedCount = entries.filter((entry) => entry.isSelected).length;

  return {
    totalCount,
    selectedCount,
    allSelected: totalCount > 0 && selectedCount === totalCount,
  };
}
