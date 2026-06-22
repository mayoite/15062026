import { describe, expect, it, vi } from "vitest";

import {
  buildPlannerDocumentFromFabric,
  getFabricSnapshotFromDocument,
  loadPlannerDocumentIntoFabric,
} from "@/features/planner/lib/fabricDocumentBridge";
import { getPlannerSceneEnvelope } from "@/features/planner/model";
import { createPlannerDocument } from "@/features/planner/model";

describe("planner lib fabricDocumentBridge", () => {
  it("falls back to a canonical empty scene when the Fabric export is malformed", () => {
    const document = buildPlannerDocumentFromFabric("{not-json", {
      documentId: " plan-1 ",
      name: "Fallback plan",
      projectName: "Fallback project",
      unitSystem: "ft-in",
    });

    const scene = getPlannerSceneEnvelope(document.sceneJson);

    expect(document.name).toBe("Fallback plan");
    expect(document.projectName).toBe("Fallback project");
    expect(document.itemCount).toBe(0);
    expect(document.unitSystem).toBe("imperial");
    expect(scene).toMatchObject({
      room: {
        widthMm: 5000,
        depthMm: 4000,
        wallHeightMm: 2400,
        wallThicknessMm: 120,
        floorThicknessMm: 40,
      },
      items: [],
      fabricSnapshot: null,
    });
    expect(getFabricSnapshotFromDocument(document)).toBeNull();
  });

  it("serializes wrapped Fabric snapshots back into the active canvas loader", () => {
    const document = createPlannerDocument({
      name: "Import me",
      sceneJson: {
        plannerScene: {
          type: "cad-suite-planner-scene",
          version: 1,
          measurement: {
            canonicalUnit: "mm",
            displayUnit: "mm",
            sourceUnit: "mm",
          },
          room: {
            widthMm: 6000,
            depthMm: 4000,
            wallHeightMm: 2400,
            wallThicknessMm: 120,
            floorThicknessMm: 40,
            originMm: { xMm: 0, yMm: 0 },
          },
          items: [],
          fabricSnapshot: {
            objects: [{ name: "GENERIC:Desk", left: 12, top: 24, width: 60, height: 30 }],
          },
        },
      },
    });
    const importDraft = vi.fn(async () => undefined);

    const loaded = loadPlannerDocumentIntoFabric(importDraft, document);

    expect(loaded).toBe(true);
    expect(getFabricSnapshotFromDocument(document)).toBe(
      JSON.stringify({
        objects: [{ name: "GENERIC:Desk", left: 12, top: 24, width: 60, height: 30 }],
      }),
    );
    expect(importDraft).toHaveBeenCalledWith(
      JSON.stringify({
        objects: [{ name: "GENERIC:Desk", left: 12, top: 24, width: 60, height: 30 }],
      }),
    );
  });
});

