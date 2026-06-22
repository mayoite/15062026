import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPlanner3DSceneDocument } from "@/features/planner/3d/types";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { getFabricSnapshotFromDocument, loadPlannerDocumentIntoFabric } from "@/features/planner/lib/fabricDocumentBridge";
import { createPlannerExportPayload } from "@/features/planner/lib/sessionState";
import { getPlannerSceneEnvelope, normalizePlannerDocument } from "@/features/planner/model";
import { applyProjectSetup } from "@/features/planner/onboarding/projectSetup";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("planner document editor bridge", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState((state) => ({
      ...state,
      unitSystem: "metric",
      projectMetadata: null,
    }));
    usePlannerCatalogStore.setState((state) => ({
      ...state,
      purposeFilter: null,
    }));
  });

  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("preserves the Fabric scene envelope for 3D consumers", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:Desk", left: 10, top: 10, width: 120, height: 60 },
        { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 400, width: 4, height: 4 },
        { name: "CORNER", left: 0, top: 400, width: 4, height: 4 },
      ],
    });

    const document = buildPlannerDocumentFromEditor(null, { title: "Workspace Plan" });
    const scene = getPlannerSceneEnvelope(document.sceneJson);
    const viewerScene = buildPlanner3DSceneDocument(document);

    expect(document.itemCount).toBe(1);
    expect(scene?.items[0]).toMatchObject({ name: "Desk", category: "Furniture" });
    expect(viewerScene.items).toHaveLength(1);
    expect(getFabricSnapshotFromDocument(document)).toContain('"name":"GENERIC:Desk"');
  });

  it("preserves project setup metadata through export/import", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:Desk", left: 12, top: 24, width: 120, height: 60 },
        { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 500, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 500, top: 300, width: 4, height: 4 },
        { name: "CORNER", left: 0, top: 300, width: 4, height: 4 },
      ],
    });

    applyProjectSetup({
      projectName: "TVS Bihar Office",
      city: "Patna",
      floorAreaSqFt: 5000,
      primaryPurpose: "workstations",
      seatTarget: 42,
      completedAt: "2026-06-21T10:30:00.000Z",
    });

    const document = buildPlannerDocumentFromEditor(null, { title: "Local Session A" });
    const normalized = normalizePlannerDocument(createPlannerExportPayload(document));
    const importDraft = vi.fn(async () => undefined);

    expect(loadPlannerDocumentIntoFabric(importDraft, normalized)).toBe(true);
    expect(normalized.projectName).toBe("TVS Bihar Office");
    expect(normalized.clientName).toBe("Patna");
    expect(normalized.seatTarget).toBe(42);
    expect(importDraft).toHaveBeenCalledTimes(1);
  });
});

