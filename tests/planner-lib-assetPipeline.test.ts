import { Document, NodeIO } from "@gltf-transform/core";
import { vi } from "vitest";

import { getAssetForCatalogId, validateGlbAsset, FURNITURE_ASSET_REGISTRY } from "@/features/planner/lib/assetPipeline";

describe("assetPipeline", () => {
  describe("FURNITURE_ASSET_REGISTRY", () => {
    it("contains 5 entries", () => {
      expect(FURNITURE_ASSET_REGISTRY.size).toBe(5);
    });

    it("each entry has required fields", () => {
      for (const [key, asset] of FURNITURE_ASSET_REGISTRY) {
        expect(asset.catalogId).toBe(key);
        expect(asset.glbUrl).toMatch(/\.glb$/);
        expect(asset.boundingBox.width).toBeGreaterThan(0);
        expect(asset.boundingBox.depth).toBeGreaterThan(0);
        expect(asset.boundingBox.height).toBeGreaterThan(0);
      }
    });
  });

  describe("getAssetForCatalogId", () => {
    it("returns asset for known catalogId", () => {
      const asset = getAssetForCatalogId("chair-arvo");
      expect(asset).not.toBeNull();
      expect(asset?.glbUrl).toBe("/models/chairs/arvo/arvo.glb");
    });

    it("returns null for unknown catalogId", () => {
      const asset = getAssetForCatalogId("unknown-item");
      expect(asset).toBeNull();
    });
  });

  describe("validateGlbAsset", () => {
    it("returns expected structure for invalid buffer", async () => {
      const emptyBuffer = new ArrayBuffer(0);
      const result = await validateGlbAsset(emptyBuffer);
      expect(result).toHaveProperty("valid");
      expect(result).toHaveProperty("errors");
      expect(result).toHaveProperty("nodeCount");
      expect(result).toHaveProperty("triangleCount");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("validates a minimal generated GLB document", async () => {
      const document = new Document();
      const scene = document.createScene();
      const node = document.createNode("root");
      scene.addChild(node);

      const bytes = await new NodeIO().writeBinary(document);
      const result = await validateGlbAsset(bytes.buffer);

      expect(result.valid).toBe(true);
      expect(result.nodeCount).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it("counts zero triangles for non-indexed primitives and stringifies non-error parse failures", async () => {
      const document = new Document();
      const buffer = document.createBuffer();
      const scene = document.createScene();
      const node = document.createNode("mesh-node");
      const mesh = document.createMesh("mesh");
      const primitive = document.createPrimitive();
      const position = document
        .createAccessor("pos")
        .setType("VEC3")
        .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
        .setBuffer(buffer);
      primitive.setAttribute("POSITION", position);
      mesh.addPrimitive(primitive);
      node.setMesh(mesh);
      scene.addChild(node);

      const bytes = await new NodeIO().writeBinary(document);
      const withoutIndices = await validateGlbAsset(bytes.buffer);
      expect(withoutIndices.valid).toBe(true);
      expect(withoutIndices.triangleCount).toBe(0);

      vi.spyOn(NodeIO.prototype, "readBinary").mockRejectedValueOnce("corrupt glb");
      const corrupt = await validateGlbAsset(bytes.buffer);
      expect(corrupt.valid).toBe(false);
      expect(corrupt.errors[0]).toContain("corrupt glb");
    });
  });
});
