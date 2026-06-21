import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildPlanner3DSceneDocument } from "@/features/planner/3d/types";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { getFabricSnapshotFromDocument, loadPlannerDocumentIntoFabric } from "@/features/planner/lib/fabricDocumentBridge";
import { createPlannerExportPayload } from "@/features/planner/lib/sessionState";
import { getPlannerSceneEnvelope, normalizePlannerDocument } from "@/features/planner/model";
import { applyProjectSetup } from "@/features/planner/onboarding/projectSetup";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
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

    const document = buildPlannerDocumentFromEditor(null, {
      title: "Workspace Plan",
    });

    const scene = getPlannerSceneEnvelope(document.sceneJson);
    const viewerScene = buildPlanner3DSceneDocument(document);

    expect(document.roomWidthMm).toBe(6040);
    expect(document.roomDepthMm).toBe(4040);
    expect(document.itemCount).toBe(1);
    expect(scene?.room).toMatchObject({
      widthMm: 6040,
      depthMm: 4040,
    });
    expect(scene?.items[0]).toMatchObject({
      id: "fabric-item-0",
      name: "Desk",
      category: "Furniture",
    });
    expect(viewerScene.room).toMatchObject({
      widthMm: 6040,
      depthMm: 4040,
    });
    expect(viewerScene.items).toHaveLength(document.itemCount);
    expect(viewerScene.items[0]).toMatchObject({
      id: "fabric-item-0",
      name: "Desk",
      category: "Furniture",
    });
    expect(scene?.items.some((item) => item.name === "Desk")).toBe(true);
    expect(getFabricSnapshotFromDocument(document)).toContain('"name":"GENERIC:Desk"');
  });

  it("preserves project setup metadata through document export and import", () => {
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

    const document = buildPlannerDocumentFromEditor(null, {
      title: "Local Session A",
    });
    const normalized = normalizePlannerDocument(createPlannerExportPayload(document));
    const importDraft = vi.fn(async () => undefined);

    expect(loadPlannerDocumentIntoFabric(importDraft, normalized)).toBe(true);
    expect(normalized.title).toBe("Local Session A");
    expect(normalized.projectName).toBe("TVS Bihar Office");
    expect(normalized.clientName).toBe("Patna");
    expect(normalized.seatTarget).toBe(42);
    expect(normalized.sceneJson).toMatchObject({
      projectSetup: {
        projectName: "TVS Bihar Office",
        city: "Patna",
        floorAreaSqFt: 5000,
        primaryPurpose: "workstations",
        seatTarget: 42,
        completedAt: "2026-06-21T10:30:00.000Z",
      },
      workspace: {
          mmPerUnit: 500,
        },
        projectMetadata: {
          projectName: "TVS Bihar Office",
          city: "Patna",
          floorAreaSqFt: 5000,
          primaryPurpose: "workstations",
          seatTarget: 42,
          completedAt: "2026-06-21T10:30:00.000Z",
        },
      },
    });
    expect(importDraft).toHaveBeenCalledTimes(1);
    expect(getFabricSnapshotFromDocument(normalized)).toContain('"name":"GENERIC:Desk"');
  });

    seedFabricRuntime({
      objects: [
        { name: "GENERIC:Desk", left: 40, top: 60, width: 120, height: 60 },
        { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 800, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 800, top: 500, width: 4, height: 4 },
        { name: "CORNER", left: 0, top: 500, width: 4, height: 4 },
      ],
    });
    usePlannerWorkspaceStore.setState((state) => ({
      ...state,
        sourceKind: "image",
        sourcePage: null,
        sourcePageCount: null,
        x: 42,
        y: 24,
        scale: 1.75,
        widthPx: 1400,
        heightPx: 900,
        opacity: 0.6,
        mmPerUnit: 125,
        calibrating: false,
        calibrationPoints: [{ x: 12, y: 18 }, { x: 144, y: 18 }],
        knownDistanceMm: 4500,
      },
    }));

    const document = buildPlannerDocumentFromEditor(null, {
    });
    const normalized = normalizePlannerDocument(createPlannerExportPayload(document));
    const importDraft = vi.fn(async () => undefined);

    expect(loadPlannerDocumentIntoFabric(importDraft, normalized)).toBe(true);
    expect(normalized.sceneJson).toMatchObject({
      workspace: {
          sourceKind: "image",
          x: 42,
          y: 24,
          scale: 1.75,
          widthPx: 1400,
          heightPx: 900,
          opacity: 0.6,
          mmPerUnit: 125,
          knownDistanceMm: 4500,
          calibrationPoints: [{ x: 12, y: 18 }, { x: 144, y: 18 }],
        },
      },
    });
    expect(importDraft).toHaveBeenCalledTimes(1);
  });
});
