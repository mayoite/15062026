import { usePlannerCatalogStore } from "../catalog/catalogStore";
import {
  DEFAULT_LAYERS,
  hydrateWorkspaceState,
  serializeWorkspaceState,
  type WorkspacePersisted,
} from "../store/workspaceStore";

export const PLANNER_SESSION_VERSION = "2.0.0";

export type PlannerSessionEnvelope = {
  version: typeof PLANNER_SESSION_VERSION;
  store: unknown;
  workspace?: WorkspacePersisted;
  updatedAt: string;
};

export function buildSessionEnvelope(store: unknown): PlannerSessionEnvelope {
  return {
    version: PLANNER_SESSION_VERSION,
    store,
    workspace: serializeWorkspaceState(),
    updatedAt: new Date().toISOString(),
  };
}

export function parseSessionSnapshot(raw: string): PlannerSessionEnvelope | null {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    if (parsed.version === PLANNER_SESSION_VERSION && parsed.store) {
      return parsed as PlannerSessionEnvelope;
    }

    if (parsed.store) {
      return {
        version: PLANNER_SESSION_VERSION,
        store: parsed.store,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      version: PLANNER_SESSION_VERSION,
      store: parsed,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function applySessionWorkspace(envelope: PlannerSessionEnvelope) {
  if (envelope.workspace) {
    hydrateWorkspaceState(envelope.workspace);
    const purpose = envelope.workspace.projectMetadata?.primaryPurpose ?? null;
    usePlannerCatalogStore.getState().setPurposeFilter(purpose);
    return;
  }
  hydrateWorkspaceState({ layerVisible: { ...DEFAULT_LAYERS } });
}
