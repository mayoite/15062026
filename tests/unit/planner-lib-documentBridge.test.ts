import { afterEach, describe, expect, it } from "vitest";

import {
  buildPlannerDocumentFromEditor,
  loadPlannerDocumentIntoEditor,
} from "@/features/planner/lib/documentBridge";
import { getPlannerSceneEnvelope, isPlannerSceneEnvelope } from "@/features/planner/model";
import { createPlannerDocument } from "@/features/planner/model";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("planner document bridge", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("detects planner scene envelopes", () => {
    const envelope = {
      type: "cad-suite-planner-scene",
      version: 1,
      measurement: { canonicalUnit: "mm", displayUnit: "mm" },
      room: {
        widthMm: 5000,
        depthMm: 4000,
        wallHeightMm: 2400,
        wallThicknessMm: 120,
        floorThicknessMm: 40,
        originMm: { xMm: 0, yMm: 0 },
      },
      items: [],
    };

    expect(isPlannerSceneEnvelope(envelope)).toBe(true);
    expect(getPlannerSceneEnvelope(envelope)).toEqual(envelope);
  });

  it("builds planner documents from the Fabric runtime", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:Desk", left: 10, top: 10, width: 120, height: 60 },
        { name: "CORNER", left: 0, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 0, width: 4, height: 4 },
        { name: "CORNER", left: 600, top: 400, width: 4, height: 4 },
      ],
    });

    const document = buildPlannerDocumentFromEditor(null, {
      name: "Workspace Plan",
      unitSystem: "mm",
    });

    expect(document.itemCount).toBeGreaterThan(0);
    expect(document.roomWidthMm).toBeGreaterThan(0);
    expect(document.roomDepthMm).toBeGreaterThan(0);
  });

  it("does not load documents back into the removed legacy editor", () => {
    const document = createPlannerDocument({
      name: "Legacy",
      sceneJson: { type: "cad-suite-planner-scene", version: 1 },
    });
    expect(loadPlannerDocumentIntoEditor(null, document)).toBe(false);
  });
});

