import type { Editor } from "tldraw";
import { getSnapshot } from "tldraw";

import {
  createEmptyPlannerDocument,
  type PlannerDocument,
} from "@/features/planner/model/plannerDocument";
import { getPageMetrics } from "@/features/planner/editor/planMetrics";
import { metadataToDocumentFields } from "@/features/planner/onboarding/projectSetup";
import { serializeWorkspaceState, usePlannerWorkspaceStore } from "../store/workspaceStore";

/** Build canonical PlannerDocument from live editor + workspace state. */
export function buildPlannerDocumentFromEditor(
  editor: Editor,
  overrides: Partial<PlannerDocument> = {},
): PlannerDocument {
  const shapes = editor.getCurrentPageShapes();
  const furnitureCount = shapes.filter((s) => s.type === "planner-furniture").length;
  const metrics = getPageMetrics(editor);
  const workspace = serializeWorkspaceState();
  const projectMetadata = usePlannerWorkspaceStore.getState().projectMetadata;
  const projectFields = projectMetadata ? metadataToDocumentFields(projectMetadata) : null;
  const now = new Date().toISOString();

  const metricRoomWidth =
    metrics.totalFloorAreaSqm > 0 ? Math.round(Math.sqrt(metrics.totalFloorAreaSqm) * 1000) : undefined;
  const metricRoomDepth =
    metrics.totalFloorAreaSqm > 0 ? Math.round(Math.sqrt(metrics.totalFloorAreaSqm) * 1000) : undefined;

  return createEmptyPlannerDocument({
    title: overrides.title ?? projectMetadata?.projectName ?? "Workspace Plan",
    itemCount: furnitureCount,
    ...(projectFields ?? {}),
    roomWidthMm: metricRoomWidth ?? projectFields?.roomWidthMm ?? 6000,
    roomDepthMm: metricRoomDepth ?? projectFields?.roomDepthMm ?? 8000,
    sceneJson: {
      type: "cad-suite-planner-scene",
      version: 1,
      measurement: {
        canonicalUnit: "mm",
        displayUnit: workspace.unitSystem === "imperial" ? "ft-in" : "mm",
      },
      projectSetup: projectMetadata,
      tldrawSnapshot: getSnapshot(editor.store),
      workspace,
    } as unknown as PlannerDocument["sceneJson"],
    updatedAt: now,
    ...overrides,
  });
}
