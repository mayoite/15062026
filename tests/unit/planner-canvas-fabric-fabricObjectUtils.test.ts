import { describe, expect, it, vi } from "vitest";

import {
  applyFabricTransformLocks,
  canEditFabricFill,
  canResizeFabricObject,
  isFabricAnnotation,
} from "@/features/planner/canvas-fabric/fabricObjectUtils";

describe("fabricObjectUtils", () => {
  describe("isFabricAnnotation", () => {
    it("returns true for DRAW: prefix", () => {
      expect(isFabricAnnotation({ name: "DRAW:measure-1" })).toBe(true);
    });

    it("returns false for non-annotation names and missing names", () => {
      expect(isFabricAnnotation({ name: "WALL:0" })).toBe(false);
      expect(isFabricAnnotation({})).toBe(false);
      expect(isFabricAnnotation(null)).toBe(false);
    });
  });

  describe("canResizeFabricObject", () => {
    it("allows annotations, MISCELLANEOUS and TEXT", () => {
      expect(canResizeFabricObject({ name: "DRAW:zone" })).toBe(true);
      expect(canResizeFabricObject({ name: "MISCELLANEOUS:note" })).toBe(true);
      expect(canResizeFabricObject({ name: "TEXT:title" })).toBe(true);
    });

    it("rejects walls and furniture and nullish objects", () => {
      expect(canResizeFabricObject({ name: "WALL:0" })).toBe(false);
      expect(canResizeFabricObject({ name: "GENERIC:Desk" })).toBe(false);
      expect(canResizeFabricObject(null)).toBe(false);
      expect(canResizeFabricObject({})).toBe(false);
    });
  });

  describe("canEditFabricFill", () => {
    it("returns true for resizable objects", () => {
      expect(canEditFabricFill({ name: "DRAW:zone" })).toBe(true);
    });

    it("returns true for GROUP names", () => {
      expect(canEditFabricFill({ name: "GROUP" })).toBe(true);
      expect(canEditFabricFill({ name: "GROUP:custom" })).toBe(true);
    });

    it("returns false for walls and nullish objects", () => {
      expect(canEditFabricFill({ name: "WALL:0" })).toBe(false);
      expect(canEditFabricFill(null)).toBe(false);
    });
  });

  describe("applyFabricTransformLocks", () => {
    it("locks scaling/rotation for non-resizable objects and sets borders", () => {
      const obj: Record<string, unknown> = { name: "WALL:0" };
      applyFabricTransformLocks(obj);
      expect(obj.lockScalingX).toBe(true);
      expect(obj.lockScalingY).toBe(true);
      expect(obj.lockRotation).toBe(true);
      expect(obj.hasBorders).toBe(true);
    });

    it("unlocks scaling/rotation for resizable objects and exposes all controls", () => {
      const setControlsVisibility = vi.fn();
      const obj: Record<string, unknown> = {
        name: "DRAW:zone",
        setControlsVisibility,
      };
      applyFabricTransformLocks(obj);
      expect(obj.lockScalingX).toBe(false);
      expect(obj.lockScalingY).toBe(false);
      expect(obj.lockRotation).toBe(false);
      expect(setControlsVisibility).toHaveBeenCalledWith({
        mt: true,
        mb: true,
        ml: true,
        mr: true,
        tl: true,
        tr: true,
        bl: true,
        br: true,
        mtr: true,
      });
    });

    it("preserves hasControls=false for non-resizable objects that opted out", () => {
      const obj: Record<string, unknown> = { name: "WALL:0", hasControls: false };
      applyFabricTransformLocks(obj);
      expect(obj.hasControls).toBe(false);
    });

    it("is a no-op for nullish input", () => {
      expect(() => applyFabricTransformLocks(null)).not.toThrow();
    });
  });
});

