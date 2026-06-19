import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
import {
  type PlannerDocument,
  type PlannerJsonValue,
  type PlannerMeasurementSourceUnit,
} from "../model";
import type { MeasurementUnit } from "./measurements";

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
  tldrawSnapshot?: unknown;
  fabricSnapshot?: unknown;
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

function readFabricExportDraft(): string | null {
  return getPlannerFabricRuntime()?.exportDraft() ?? null;
}

/** @deprecated Use buildPlannerDocumentFromFabric — delegates to fabric canvas export. */
export function buildPlannerDocumentFromEditor(
  _editor: null,
  options: BuildPlannerDocumentFromEditorOptions,
): PlannerDocument {
  return buildPlannerDocumentFromFabric(readFabricExportDraft(), {
    documentId: options.documentId,
    name: options.name,
    projectName: options.projectName,
    clientName: options.clientName,
    preparedBy: options.preparedBy,
    seatTarget: options.seatTarget,
    unitSystem: options.unitSystem,
    thumbnailUrl: options.thumbnailUrl,
  });
}

/** @deprecated Fabric canvas load not wired here — returns false. */
export function loadPlannerDocumentIntoEditor(_editor: null, _document: PlannerDocument): boolean {
  return false;
}
