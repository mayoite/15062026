import { getPlannerFabricRuntimeState, parseFabricObjects } from "@/features/planner/canvas-fabric";

import type { CanvasFurnitureKind, CanvasPlacementSummary } from "./types";

type FabricPlacementObject = Record<string, unknown> & {
  id?: string;
  name?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  catalogId?: string;
};

const FABRIC_UNIT_TO_MM = 10;

function scaledSize(value: unknown, scale: unknown): number {
  const base = Number(value);
  const multiplier = Number(scale);
  const resolvedBase = Number.isFinite(base) ? base : 0;
  const resolvedScale = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  return Math.max(1, resolvedBase * resolvedScale);
}

function objectLabel(name: string): string {
  if (!name.includes(":")) return name;
  return name.split(":").slice(1).join(":").trim() || name;
}

function inferKind(name: string, label: string): CanvasFurnitureKind | null {
  const upperName = name.toUpperCase();
  const lowerLabel = label.toLowerCase();

  if (
    upperName === "GROUP" ||
    upperName === "CORNER" ||
    upperName.startsWith("WALL:") ||
    upperName.startsWith("DOOR") ||
    upperName.startsWith("WINDOW") ||
    upperName.startsWith("DRAW:") ||
    upperName.startsWith("TEXT")
  ) {
    return null;
  }

  if (upperName.startsWith("CHAIR")) {
    return "chair";
  }

  if (
    upperName.startsWith("MISCELLANEOUS") ||
    lowerLabel.includes("storage") ||
    lowerLabel.includes("cabinet") ||
    lowerLabel.includes("locker") ||
    lowerLabel.includes("pedestal") ||
    lowerLabel.includes("file")
  ) {
    return "storage";
  }

  return "workstation";
}

function toPlacement(object: FabricPlacementObject, index: number): CanvasPlacementSummary | null {
  const name = String(object.name ?? "").trim();
  if (!name) return null;

  const label = objectLabel(name);
  const kind = inferKind(name, label);
  if (!kind) return null;

  const widthMm = Math.round(scaledSize(object.width, object.scaleX) * FABRIC_UNIT_TO_MM);
  const heightMm = Math.round(scaledSize(object.height, object.scaleY) * FABRIC_UNIT_TO_MM);
  const catalogItemId =
    typeof object.catalogId === "string" && object.catalogId.trim().length > 0
      ? object.catalogId
      : undefined;

  return {
    shapeId: typeof object.id === "string" && object.id.trim().length > 0
      ? object.id
      : `fabric-placement-${index}-${name}`,
    kind,
    label,
    widthMm,
    heightMm,
    catalogItemId,
  };
}

export function extractCanvasPlacements(_editor?: null): CanvasPlacementSummary[] {
  const { serializedDraft } = getPlannerFabricRuntimeState();
  const objects = parseFabricObjects(serializedDraft) as FabricPlacementObject[];

  return objects
    .map((object, index) => toPlacement(object, index))
    .filter((placement): placement is CanvasPlacementSummary => placement !== null);
}
