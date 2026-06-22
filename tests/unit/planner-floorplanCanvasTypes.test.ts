import { describe, expect, it } from "vitest";
import type { FabricObject } from "fabric";
import { getBoundingRect, resolveLayerCategory } from "@/features/planner/canvas-fabric/hooks/floorplanCanvasTypes";

// ─── getBoundingRect ──────────────────────────────────────────────────────────

describe("getBoundingRect", () => {
  function obj(left: number, top: number) {
    return { left, top } as FabricObject;
  }

  it("returns correct bounds for 3 objects at distinct positions", () => {
    const result = getBoundingRect([
      obj(10, 20),
      obj(50, 5),
      obj(30, 40),
    ]);
    expect(result.left).toBe(10);
    expect(result.top).toBe(5);    // BUG-01 fix: was computing left as top
    expect(result.right).toBe(50);
    expect(result.bottom).toBe(40);
    expect(result.center).toBe(30); // (10+50)/2
    expect(result.middle).toBe(22.5); // (5+40)/2
  });

  it("returns correct bounds for a single object", () => {
    const result = getBoundingRect([obj(100, 200)]);
    expect(result.left).toBe(100);
    expect(result.top).toBe(200);
    expect(result.right).toBe(100);
    expect(result.bottom).toBe(200);
  });

  it("handles objects aligned on the same row (same top)", () => {
    const result = getBoundingRect([obj(0, 50), obj(100, 50), obj(200, 50)]);
    expect(result.top).toBe(50);
    expect(result.bottom).toBe(50);
    expect(result.left).toBe(0);
    expect(result.right).toBe(200);
  });

  it("handles objects aligned on the same column (same left)", () => {
    const result = getBoundingRect([obj(75, 0), obj(75, 100), obj(75, 200)]);
    expect(result.left).toBe(75);
    expect(result.right).toBe(75);
    expect(result.top).toBe(0);
    expect(result.bottom).toBe(200);
  });

  it("BUG-01 regression: Align Top uses top coordinate (not left)", () => {
    // Before the fix, obj.left < top was used → top tracked left positions
    const result = getBoundingRect([
      obj(100, 300), // left=100, top=300
      obj(200, 100), // left=200, top=100 ← should become the topmost
      obj(300, 200), // left=300, top=200
    ]);
    expect(result.top).toBe(100); // must be minimum top, not minimum left
    expect(result.left).toBe(100);
    expect(result.right).toBe(300);
    expect(result.bottom).toBe(300);
  });
});

// ─── resolveLayerCategory ─────────────────────────────────────────────────────

describe("resolveLayerCategory", () => {
  function fab(name: string) {
    return { name } as FabricObject & { name: string };
  }

  it.each([
    ["CORNER", "walls"],
    ["WALL:0", "walls"],
    ["WALL:3", "walls"],
    ["DOOR", "walls"],
    ["DOOR:main", "walls"],
    ["WINDOW", "walls"],
    ["WINDOW:2", "walls"],
  ])("maps %s → walls", (name, expected) => {
    expect(resolveLayerCategory(fab(name))).toBe(expected);
  });

  it.each([
    ["DRAW:measure", "measurements"],
    ["DRAW:measure:1", "measurements"],
  ])("maps %s → measurements", (name, expected) => {
    expect(resolveLayerCategory(fab(name))).toBe(expected);
  });

  it.each([
    ["DRAW:line", "zones"],
    ["DRAW:rect", "zones"],
    ["DRAW:free", "zones"],
  ])("maps %s → zones", (name, expected) => {
    expect(resolveLayerCategory(fab(name))).toBe(expected);
  });

  it.each([
    ["GENERIC:Sofa", "furniture"],
    ["GENERIC:Chair", "furniture"],
    ["TABLE", "furniture"],
    ["TABLE:conference", "furniture"],
    ["CHAIR", "furniture"],
    ["DESK", "furniture"],
    ["DESK:standing", "furniture"],
  ])("maps %s → furniture", (name, expected) => {
    expect(resolveLayerCategory(fab(name))).toBe(expected);
  });

  it.each([
    ["unknown-name", null],
    ["", null],
    ["GROUP", null],
    ["ROOM", null],
  ])("maps %s → null", (name, expected) => {
    expect(resolveLayerCategory(fab(name))).toBe(expected);
  });

  it("returns null for null/undefined input", () => {
    expect(resolveLayerCategory(null)).toBeNull();
    expect(resolveLayerCategory(undefined)).toBeNull();
    expect(resolveLayerCategory({})).toBeNull();
  });
});

