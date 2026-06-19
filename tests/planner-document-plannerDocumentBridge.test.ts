import { afterEach, describe, expect, it } from "vitest";

import { buildPlanner3DSceneDocument } from "@/features/planner/3d/types";
import { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { getPlannerSceneEnvelope } from "@/features/planner/lib/documentBridge";
import { getFabricSnapshotFromDocument } from "@/features/planner/lib/fabricDocumentBridge";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

describe("planner document editor bridge", () => {
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
});
