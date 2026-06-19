import {
  createEmptyPlannerDocument,
  type PlannerDocument,
  type PlannerJsonValue,
} from "@/features/planner/model/plannerDocument";
import { toPlannerJsonSafe } from "@/features/planner/model/plannerJsonSafe";
import { getPlannerFabricRuntime } from "@/features/planner/canvas-fabric";
import { getPageMetrics } from "@/features/planner/editor/planMetrics";
import { metadataToDocumentFields } from "@/features/planner/onboarding/projectSetup";
import { buildPlannerDocumentFromFabric } from "@/features/planner/lib/fabricDocumentBridge";
import { serializeWorkspaceState, usePlannerWorkspaceStore } from "../store/workspaceStore";

function readFabricExportDraft(): string | null {
  return getPlannerFabricRuntime()?.exportDraft() ?? null;
}

function mergeFabricSceneMetadata(
  sceneJson: PlannerJsonValue,
  metadata: Record<string, unknown>,
): PlannerJsonValue {
  if (!sceneJson || typeof sceneJson !== "object" || Array.isArray(sceneJson)) {
    return toPlannerJsonSafe(metadata);
  }

  return toPlannerJsonSafe({
    ...sceneJson,
    ...metadata,
  });
}

/** Build canonical PlannerDocument from fabric canvas + workspace state. */
export function buildPlannerDocumentFromEditor(
  _editor: null,
  overrides: Partial<PlannerDocument> = {},
): PlannerDocument {
  const workspace = serializeWorkspaceState();
  const projectMetadata = usePlannerWorkspaceStore.getState().projectMetadata;
  const projectFields = projectMetadata ? metadataToDocumentFields(projectMetadata) : null;
  const metrics = getPageMetrics(null);

  const metricRoomWidth =
    metrics.totalFloorAreaSqm > 0 ? Math.round(Math.sqrt(metrics.totalFloorAreaSqm) * 1000) : undefined;
  const metricRoomDepth =
    metrics.totalFloorAreaSqm > 0 ? Math.round(Math.sqrt(metrics.totalFloorAreaSqm) * 1000) : undefined;
  const serializedDraft = readFabricExportDraft();

  const fabricDoc = buildPlannerDocumentFromFabric(serializedDraft, {
    name: overrides.title ?? projectMetadata?.projectName ?? "Workspace Plan",
    projectName: projectMetadata?.projectName,
    unitSystem: workspace.unitSystem === "imperial" ? "ft-in" : "mm",
  });
  const resolvedRoomWidthMm =
    fabricDoc.roomWidthMm ?? metricRoomWidth ?? projectFields?.roomWidthMm ?? 6000;
  const resolvedRoomDepthMm =
    fabricDoc.roomDepthMm ?? metricRoomDepth ?? projectFields?.roomDepthMm ?? 8000;
  let fabricSnapshot: unknown = null;

  if (serializedDraft) {
    try {
      fabricSnapshot = JSON.parse(serializedDraft);
    } catch {
      fabricSnapshot = null;
    }
  }

  return createEmptyPlannerDocument({
    ...fabricDoc,
    title: overrides.title ?? projectMetadata?.projectName ?? "Workspace Plan",
    itemCount: fabricDoc.itemCount,
    ...(projectFields ?? {}),
    roomWidthMm: resolvedRoomWidthMm,
    roomDepthMm: resolvedRoomDepthMm,
    sceneJson: mergeFabricSceneMetadata(fabricDoc.sceneJson, {
      projectSetup: projectMetadata,
      workspace,
      fabricSnapshot,
    }),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}
