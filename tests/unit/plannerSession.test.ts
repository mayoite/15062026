import { describe, expect, it, beforeEach } from "vitest";
import {
  buildSessionEnvelope,
  parseSessionSnapshot,
  applySessionWorkspace,
  PLANNER_SESSION_VERSION,
} from "@/features/planner/persistence/plannerSession";
import { usePlannerWorkspaceStore } from "../../features/planner/store/workspaceStore";
import { usePlannerCatalogStore } from "../../features/planner/catalog/catalogStore";

describe("plannerSession", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
      layerVisible: {
        walls: true,
        rooms: true,
        zones: true,
        furniture: true,
        measurements: true,
      },
      unitSystem: "metric",
      projectMetadata: null,
      plannerStep: "draw",
      pendingBootstrapLayout: null,
    });
    usePlannerCatalogStore.setState({ purposeFilter: null });
  });

  it("builds a session envelope from unknown store", () => {
    const storeObj = { test: 123 };
    const envelope = buildSessionEnvelope(storeObj);

    expect(envelope.version).toBe(PLANNER_SESSION_VERSION);
    expect(envelope.store).toBe(storeObj);
    expect(envelope.workspace).toBeDefined();
    expect(envelope.workspace?.unitSystem).toBe("metric");
    expect(typeof envelope.updatedAt).toBe("string");
  });

  it("parses a valid session snapshot", () => {
    const raw = JSON.stringify({
      version: PLANNER_SESSION_VERSION,
      store: { test: 123 },
      workspace: { unitSystem: "imperial" },
      updatedAt: new Date().toISOString(),
    });

    const parsed = parseSessionSnapshot(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(PLANNER_SESSION_VERSION);
    expect(parsed?.store).toEqual({ test: 123 });
  });

  it("parses an older session snapshot that only has a store field", () => {
    const raw = JSON.stringify({ store: { test: 456 } });
    const parsed = parseSessionSnapshot(raw);
    
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(PLANNER_SESSION_VERSION);
    expect(parsed?.store).toEqual({ test: 456 });
    expect(typeof parsed?.updatedAt).toBe("string");
  });

  it("parses an unknown snapshot structure by wrapping it", () => {
    const raw = JSON.stringify({ random: "data" });
    const parsed = parseSessionSnapshot(raw);
    
    expect(parsed).not.toBeNull();
    expect(parsed?.version).toBe(PLANNER_SESSION_VERSION);
    expect(parsed?.store).toEqual({ random: "data" });
  });

  it("returns null for invalid JSON", () => {
    expect(parseSessionSnapshot("invalid")).toBeNull();
  });

  it("returns null for non-object JSON", () => {
    expect(parseSessionSnapshot(JSON.stringify(123))).toBeNull();
    expect(parseSessionSnapshot(JSON.stringify(null))).toBeNull();
  });

  it("applies a session workspace state", () => {
    const envelope = buildSessionEnvelope({ test: 123 });
    if (envelope.workspace) {
      envelope.workspace.unitSystem = "imperial";
      envelope.workspace.projectMetadata = { primaryPurpose: "office", properties: {} };
    }
    
    applySessionWorkspace(envelope);

    const workspaceState = usePlannerWorkspaceStore.getState();
    expect(workspaceState.unitSystem).toBe("imperial");

    const catalogState = usePlannerCatalogStore.getState();
    expect(catalogState.purposeFilter).toBe("office");
  });

  it("applies defaults if no workspace is in envelope", () => {
    usePlannerWorkspaceStore.getState().setLayerVisible("walls", false);
    
    const envelope = buildSessionEnvelope({ test: 123 });
    delete envelope.workspace;
    
    applySessionWorkspace(envelope);
    
    const workspaceState = usePlannerWorkspaceStore.getState();
    expect(workspaceState.layerVisible.walls).toBe(true);
  });
});

