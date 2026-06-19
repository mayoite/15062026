import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
import {
  type PlannerDocument,
  type PlannerSceneEnvelope,
  type PlannerSceneItem,
  type PlannerSceneRoom,
  getPlannerSceneEnvelope,
  isPlannerSceneEnvelope,
} from "../model";
import type { MeasurementUnit } from "./measurements";

// Re-export canonical scene types from the model for backwards compatibility.
export type { PlannerSceneEnvelope, PlannerSceneItem, PlannerSceneRoom };
export { getPlannerSceneEnvelope, isPlannerSceneEnvelope };

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
