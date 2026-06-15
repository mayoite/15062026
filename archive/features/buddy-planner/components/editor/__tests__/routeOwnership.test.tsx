/**
 * routeOwnership.test.tsx — Buddy
 *
 * Regression suite asserting that the buddy feature strictly
 * owns Konva + Fabric engines and never exposes planner engine behaviour.
 *
 * These tests must remain green at all times. Failing here means an
 * architecture boundary has been crossed.
 */
import {
  isBuddyEngine,
  BUDDY_ENGINES,
} from "../../../lib/engineAdapter/ownership";

describe("Buddy — Route Ownership", () => {
  describe("Engine ownership contract", () => {
    it("tldraw is NOT a buddy engine", () => {
      expect(isBuddyEngine("tldraw")).toBe(false);
    });

    it("konva IS a buddy engine", () => {
      expect(isBuddyEngine("konva")).toBe(true);
    });

    it("fabric IS a buddy engine", () => {
      expect(isBuddyEngine("fabric")).toBe(true);
    });

    it("three3d IS a buddy engine", () => {
      expect(isBuddyEngine("three3d")).toBe(true);
    });
  });

  describe("Engine list is buddy-only", () => {
    it("BUDDY_ENGINES has konva, fabric, and three3d", () => {
      expect(BUDDY_ENGINES).toContain("konva");
      expect(BUDDY_ENGINES).toContain("fabric");
      expect(BUDDY_ENGINES).toContain("three3d");
    });
  });

  describe("Product scene mapper contract", () => {
    it("mapElementsToProductScene can be imported from the buddy lib", async () => {
      const { mapElementsToProductScene } = await import(
        "../../../lib/elementsToProductScene"
      );
      expect(typeof mapElementsToProductScene).toBe("function");
    });

    it("product scene mapper filters out wall elements", async () => {
      const { mapElementsToProductScene } = await import(
        "../../../lib/elementsToProductScene"
      );
      const result = mapElementsToProductScene([
        { id: "w1", type: "wall", x: 0, y: 0, width: 200, height: 15 },
        { id: "d1", type: "desk", x: 100, y: 100, width: 120, height: 60 },
      ]);
      // Wall should be filtered, only desk should be in nodes
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].id).toBe("d1");
    });

    it("product scene mapper classifies desk as furniture node", async () => {
      const { mapElementsToProductScene } = await import(
        "../../../lib/elementsToProductScene"
      );
      const result = mapElementsToProductScene([
        { id: "d1", type: "desk", x: 0, y: 0, width: 120, height: 60 },
      ]);
      expect(result.nodes[0].nodeType).toBe("furniture");
    });

    it("product scene mapper returns a generatedAt ISO timestamp", async () => {
      const { mapElementsToProductScene } = await import(
        "../../../lib/elementsToProductScene"
      );
      const result = mapElementsToProductScene([]);
      expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
