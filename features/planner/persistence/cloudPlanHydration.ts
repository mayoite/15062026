import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { getPlannerSceneEnvelope } from "@/features/planner/model";
import type { PlannerDocument } from "@/features/planner/model/plannerDocument";
import { buildSessionEnvelope } from "@/features/planner/persistence/plannerSession";
import {
  getPlannerProjectId,
  loadProject,
  saveProject,
} from "@/features/planner/persistence/persistence";

export function plannerDocumentToAutosaveSnapshot(document: PlannerDocument): string | null {
  const scene = getPlannerSceneEnvelope(document.sceneJson);
  const store = scene?.fabricSnapshot;
  if (!store || typeof store !== "object") return null;
  return JSON.stringify(buildSessionEnvelope(store));
}

/** Pull a cloud plan into IndexedDB so autosave restore can load `?id=` URLs. */
export async function hydrateCloudPlanIntoIndexedDb(
  planId: string,
  guestMode: boolean,
): Promise<boolean> {
  const trimmed = planId?.trim();
  if (guestMode || !trimmed) return false;

  const projectId = getPlannerProjectId(false, trimmed);
  const existing = await loadProject(projectId).catch(() => undefined);
  if (existing?.snapshot?.trim()) return true;

  const response = await browserApiFetch(
    apiPath(`/api/plans/${encodeURIComponent(trimmed)}`),
    { method: "GET" },
  );
  if (!response.ok) return false;

  const body = (await response.json()) as { document?: PlannerDocument };
  if (!body.document) return false;

  const snapshot = plannerDocumentToAutosaveSnapshot(body.document);
  if (!snapshot) return false;

  const now = Date.now();
  const title = body.document.title ?? body.document.name ?? "Workspace Plan";
  await saveProject({
    id: projectId,
    name: title,
    createdAt: now,
    updatedAt: now,
    snapshot,
  });
  return true;
}