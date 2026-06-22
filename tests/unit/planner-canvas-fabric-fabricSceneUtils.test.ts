import { describe, expect, it } from "vitest";

import {
  fabricObjectCategory,
  parseFabricObjects,
  PLANNER_MAX_CANVAS_MM,
  resolveRoomMmFromFabricObjects,
  resolveRoomMmFromFabricSnapshot,
} from "@/features/planner/canvas-fabric/fabricSceneUtils";

describe("fabricSceneUtils", () => {
  describe("parseFabricObjects", () => {
    it("returns empty array for null or empty input", () => {
      expect(parseFabricObjects(null)).toEqual([]);
      expect(parseFabricObjects("")).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
      expect(parseFabricObjects("{not-json")).toEqual([]);
    });

    it("extracts the objects array and filters non-objects", () => {
      const serialized = JSON.stringify({
        objects: [{ name: "WALL:0" }, null, "skip", { name: "CORNER" }],
      });
      expect(parseFabricObjects(serialized)).toEqual([
        { name: "WALL:0" },
        { name: "CORNER" },
      ]);
    });

    it("returns empty array when objects is missing", () => {
      const serialized = JSON.stringify({ version: "1" });
      expect(parseFabricObjects(serialized)).toEqual([]);
    });
  });

  describe("resolveRoomMmFromFabricObjects", () => {
    it("returns fallback when fewer than two corners", () => {
      expect(resolveRoomMmFromFabricObjects([])).toEqual({
        widthMm: 5000,
        depthMm: 4000,
      });
      expect(
        resolveRoomMmFromFabricObjects([{ name: "CORNER", left: 10, top: 10 }]),
      ).toEqual({ widthMm: 1000, depthMm: 1000 });
    });

    it("computes room mm from corner bounds (fabric units * 10)", () => {
      const corners = [
        { name: "CORNER", left: 0, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 200, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 200, top: 150, width: 0, height: 0 },
        { name: "CORNER", left: 0, top: 150, width: 0, height: 0 },
      ];
      // (200 - 0) * 10 = 2000mm wide; (150 - 0) * 10 = 1500mm deep.
      expect(resolveRoomMmFromFabricObjects(corners)).toEqual({
        widthMm: 2000,
        depthMm: 1500,
      });
    });

    it("enforces a configured minimum for each dimension", () => {
      const corners = [
        { name: "CORNER", left: 0, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 5, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 5, top: 5, width: 0, height: 0 },
      ];
      expect(resolveRoomMmFromFabricObjects(corners)).toEqual({
        widthMm: 1000,
        depthMm: 1000,
      });
    });

    it("caps room dimensions at the configured canvas maximum", () => {
      const corners = [
        { name: "CORNER", left: 0, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 200_000, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 200_000, top: 200_000, width: 0, height: 0 },
      ];
      expect(resolveRoomMmFromFabricObjects(corners)).toEqual({
        widthMm: PLANNER_MAX_CANVAS_MM,
        depthMm: PLANNER_MAX_CANVAS_MM,
      });
    });

    it("includes wall objects when computing bounds", () => {
      const objects = [
        { name: "WALL:0", left: 5000, top: 5000, width: 0, height: 0 },
        { name: "CORNER", left: 0, top: 0, width: 0, height: 0 },
        { name: "CORNER", left: 100, top: 100, width: 0, height: 0 },
      ];
      expect(resolveRoomMmFromFabricObjects(objects)).toEqual({
        widthMm: 50000,
        depthMm: 50000,
      });
    });

    it("respects a custom fallback", () => {
      expect(
        resolveRoomMmFromFabricObjects([], { widthMm: 3000, depthMm: 2000 }),
      ).toEqual({ widthMm: 3000, depthMm: 2000 });
    });
  });

  describe("resolveRoomMmFromFabricSnapshot", () => {
    it("combines parse + resolve", () => {
      const serialized = JSON.stringify({
        objects: [
          { name: "CORNER", left: 0, top: 0, width: 0, height: 0 },
          { name: "CORNER", left: 300, top: 0, width: 0, height: 0 },
          { name: "CORNER", left: 300, top: 200, width: 0, height: 0 },
        ],
      });
      expect(resolveRoomMmFromFabricSnapshot(serialized)).toEqual({
        widthMm: 3000,
        depthMm: 2000,
      });
    });

    it("returns fallback for null input", () => {
      expect(resolveRoomMmFromFabricSnapshot(null)).toEqual({
        widthMm: 5000,
        depthMm: 4000,
      });
    });
  });

  describe("fabricObjectCategory", () => {
    it("classifies structure names", () => {
      expect(fabricObjectCategory("CORNER")).toBe("Structure");
      expect(fabricObjectCategory("WALL:0")).toBe("Structure");
      expect(fabricObjectCategory("DOOR:front")).toBe("Structure");
      expect(fabricObjectCategory("WINDOW:left")).toBe("Structure");
    });

    it("classifies measurements and zones", () => {
      expect(fabricObjectCategory("DRAW:measure-1")).toBe("Measurement");
      expect(fabricObjectCategory("DRAW:zone-a")).toBe("Zone");
    });

    it("classifies furniture (and defaults to Furniture)", () => {
      expect(fabricObjectCategory("GENERIC:Desk")).toBe("Furniture");
      expect(fabricObjectCategory("TABLE:round")).toBe("Furniture");
      expect(fabricObjectCategory("CHAIR:Generic")).toBe("Furniture");
      expect(fabricObjectCategory("DESK:stand")).toBe("Furniture");
      expect(fabricObjectCategory("UNKNOWN")).toBe("Furniture");
    });
  });
});

