import {
  createEmptyPlannerDocument,
  type PlannerDocument,
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

  const fabricDoc = buildPlannerDocumentFromFabric(readFabricExportDraft(), {
    name: overrides.title ?? projectMetadata?.projectName ?? "Workspace Plan",
    projectName: projectMetadata?.projectName,
    unitSystem: workspace.unitSystem === "imperial" ? "ft-in" : "mm",
  });
  const serializedDraft = readFabricExportDraft();

  return createEmptyPlannerDocument({
    ...fabricDoc,
    title: overrides.title ?? projectMetadata?.projectName ?? "Workspace Plan",
    itemCount: fabricDoc.itemCount,
    ...(projectFields ?? {}),
    roomWidthMm: metricRoomWidth ?? projectFields?.roomWidthMm ?? fabricDoc.roomWidthMm ?? 6000,
    roomDepthMm: metricRoomDepth ?? projectFields?.roomDepthMm ?? fabricDoc.roomDepthMm ?? 8000,
    sceneJson: toPlannerJsonSafe({
      type: "cad-suite-planner-scene",
      version: 1,
      measurement: {
        canonicalUnit: "mm",
        displayUnit: workspace.unitSystem === "imperial" ? "ft-in" : "mm",
      },
      projectSetup: projectMetadata,
      workspace,
      fabricSnapshot: serializedDraft ? JSON.parse(serializedDraft) : null,
    }),
    updatedAt: new Date().toISOString(),
    ...overrides,
  });
}
