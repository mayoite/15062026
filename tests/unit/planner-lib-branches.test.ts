import { Document, NodeIO } from "@gltf-transform/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { analyzeSpace, autoFurnishRoom } from "@/features/planner/lib/aiService";
import { validateGlbAsset } from "@/features/planner/lib/assetPipeline";
import {
  fetchFeatureFlagsFromSupabase,
  resetFeatureFlags,
} from "@/features/planner/lib/featureFlags";
import { saveProjectIndex } from "@/features/planner/lib/projectIndex";
import {
  calculatePlannerBoqTotal,
  groupPlannerBoqItems,
} from "@/features/planner/lib/quoteBridge";
import { SnapManager } from "@/features/planner/lib/snapManager";
import { appendSnapshot } from "@/features/planner/lib/versioning";
import { createPlannerDocument } from "@/features/planner/model";

describe("planner lib branch coverage gaps", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFeatureFlags();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetFeatureFlags();
  });

  it("covers snap manager grid miss paths", () => {
    const manager = new SnapManager({ snapThreshold: 2, gridSpacing: 50, snapToGrid: true });
    expect(manager.findSnap(12, 12).snapped).toBe(false);

    manager.setOptions({
      snapToGrid: false,
      snapToCorners: false,
      snapToWalls: false,
      snapToEdges: false,
      snapToMidpoints: false,
    });
    manager.addSnapPoints([{ x: 5, y: 5, type: "corner" }]);
    expect(manager.findSnap(5, 5).snapped).toBe(false);
  });

  it("covers quote grouping fallbacks for sparse BOQ metadata", () => {
    const grouped = groupPlannerBoqItems([
      {
        id: "shape-1",
        name: "  Custom Pod  ",
        category: undefined,
        dimensions: undefined,
        price: 10,
        imageUrl: "/pod.png",
      },
      {
        id: "shape-2",
        name: "Custom Pod",
        category: undefined,
        dimensions: undefined,
        price: undefined,
        imageUrl: "/pod.png",
      },
    ]);

    expect(Object.values(grouped)).toHaveLength(1);
    expect(calculatePlannerBoqTotal(Object.values(grouped))).toBe(10);
  });

  it("covers project index and versioning storage failure branches", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    expect(() => saveProjectIndex([{ id: "p1", key: "planner_p1", name: "One" }])).not.toThrow();
    expect(appendSnapshot("project-quota", createPlannerDocument({ name: "Too Big" }))).toBeNull();
  });

  it("covers asset validation branches for empty nodes and indexed meshes", async () => {
    const emptyNodes = new Document();
    emptyNodes.createScene();
    const emptyBytes = await new NodeIO().writeBinary(emptyNodes);
    const emptyResult = await validateGlbAsset(emptyBytes.buffer);
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.errors).toContain("GLB contains no nodes");

    const withMesh = new Document();
    const buffer = withMesh.createBuffer();
    const scene = withMesh.createScene();
    const node = withMesh.createNode("mesh-node");
    const mesh = withMesh.createMesh("mesh");
    const primitive = withMesh.createPrimitive();
    const position = withMesh.createAccessor("pos")
      .setType("VEC3")
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
      .setBuffer(buffer);
    const indices = withMesh.createAccessor("idx")
      .setType("SCALAR")
      .setArray(new Uint16Array([0, 1, 2]))
      .setBuffer(buffer);
    primitive.setAttribute("POSITION", position).setIndices(indices);
    mesh.addPrimitive(primitive);
    node.setMesh(mesh);
    scene.addChild(node);

    const meshBytes = await new NodeIO().writeBinary(withMesh);
    const meshResult = await validateGlbAsset(meshBytes.buffer);
    expect(meshResult.valid).toBe(true);
    expect(meshResult.triangleCount).toBe(1);
  });

  it("covers ai advisor plain-text fallbacks and failed feature flag fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ content: "Layout advice in prose" }),
    } as Response);

    const room = {
      id: "room-1",
      name: "Focus",
      points: [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 200 },
        { x: 0, y: 200 },
      ],
    };

    expect((await autoFurnishRoom(room, [], "Modern")).message).toBe("Layout advice in prose");
    expect((await analyzeSpace({ rooms: [room], furniture: [] }, "Modern")).message).toBe(
      "Layout advice in prose",
    );

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      statusText: "Service Unavailable",
      json: async () => ({}),
    } as Response);
    expect(await fetchFeatureFlagsFromSupabase()).toBeNull();
  });
});
