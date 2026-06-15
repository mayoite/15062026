import { describe, expect, it, vi } from "vitest";

vi.mock('@tldraw/editor', () => ({
  Box: class Box {
    x: number; y: number; width: number; height: number;
    constructor(x: number, y: number, w: number, h: number) {
      this.x = x; this.y = y; this.width = w; this.height = h;
    }
  },
  Vec: class Vec {
    x: number; y: number;
    constructor(x: number, y: number) { this.x = x; this.y = y; }
  },
}));

import {
  checkClearanceViolations,
  checkOverlap,
  checkWallClearance,
  getClearanceSummary,
  meetsAdaClearance,
  validatePlacement,
  MIN_WALL_CLEARANCE_MM,
} from "@/features/planner/tldraw/tools/ClearanceChecker";
import type { RectItem, Wall } from "@/features/planner/tldraw/tools/ClearanceChecker";
import { createMockEditor } from "./planner-tldraw-mockEditor";

describe("ClearanceChecker - overlap detection", () => {
  it("detects overlapping rectangles", () => {
    const items: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
    ];
    const violations = checkOverlap(items);
    expect(violations).toHaveLength(1);
    expect(violations[0].indexA).toBe(0);
    expect(violations[0].indexB).toBe(1);
  });

  it("returns no violations for non-overlapping rectangles", () => {
    const items: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 200, y: 200, width: 100, height: 100 },
    ];
    const violations = checkOverlap(items);
    expect(violations).toHaveLength(0);
  });

  it("detects edge-touching as non-overlapping", () => {
    const items: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    ];
    const violations = checkOverlap(items);
    expect(violations).toHaveLength(0);
  });

  it("detects multiple overlaps", () => {
    const items: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
      { x: 80, y: 80, width: 100, height: 100 },
    ];
    const violations = checkOverlap(items);
    // 0-1 overlap, 0-2 overlap, 1-2 overlap
    expect(violations).toHaveLength(3);
  });

  it("handles rotated items via AABB expansion", () => {
    // A 100x20 rect rotated 90deg becomes 20x100 AABB
    const items: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 20, rotation: Math.PI / 2 },
      { x: 45, y: 0, width: 20, height: 20 },
    ];
    const violations = checkOverlap(items);
    // Rotated AABB: center(50,10), newW=20, newH=100 => x=40,y=-40,w=20,h=100
    // Second: x=45..65, y=0..20
    // Overlap: 40<65 && 60>45 (X), -40<20 && 60>0 (Y) => overlap
    expect(violations.length).toBeGreaterThanOrEqual(1);
  });
});
describe("ClearanceChecker - wall clearance", () => {
  it("flags furniture too close to wall", () => {
    const furniture: RectItem[] = [
      { x: 150, y: 0, width: 100, height: 100 },
    ];
    // Vertical wall at x=0..10 (thickness 10), height 500
    const walls: Wall[] = [
      { x1: 0, y1: 0, x2: 0, y2: 500, thickness: 10 },
    ];
    // Distance from furniture(x=150) to wall rect(x=0,w=10) = 150-10 = 140mm
    const violations = checkWallClearance(furniture, walls, 100);
    expect(violations).toHaveLength(0);
  });

  it("flags furniture within 100mm of wall", () => {
    const furniture: RectItem[] = [
      { x: 50, y: 0, width: 100, height: 100 },
    ];
    // Vertical wall at x=0, thickness 10 => wall rect x=0,w=10
    // Furniture starts at x=50, gap = 50 - 10 = 40mm
    const walls: Wall[] = [
      { x1: 0, y1: 0, x2: 0, y2: 500, thickness: 10 },
    ];
    const violations = checkWallClearance(furniture, walls, 100);
    expect(violations).toHaveLength(1);
    expect(violations[0].distanceMm).toBe(40);
    expect(violations[0].requiredMm).toBe(100);
  });

  it("no violation when furniture is far from wall", () => {
    const furniture: RectItem[] = [
      { x: 500, y: 0, width: 100, height: 100 },
    ];
    const walls: Wall[] = [
      { x1: 0, y1: 0, x2: 0, y2: 500, thickness: 10 },
    ];
    const violations = checkWallClearance(furniture, walls, MIN_WALL_CLEARANCE_MM);
    expect(violations).toHaveLength(0);
  });
});
describe("ClearanceChecker - validatePlacement", () => {
  it("returns valid=true when no conflicts", () => {
    const newItem: RectItem = { x: 500, y: 500, width: 100, height: 100 };
    const existing: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
    ];
    const walls: Wall[] = [
      { x1: 0, y1: 0, x2: 0, y2: 300, thickness: 10 },
    ];
    const result = validatePlacement(newItem, existing, walls);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.violations).toHaveLength(0);
  });

  it("returns valid=false when new item overlaps existing", () => {
    const newItem: RectItem = { x: 50, y: 50, width: 100, height: 100 };
    const existing: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
    ];
    const walls: Wall[] = [];
    const result = validatePlacement(newItem, existing, walls);
    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns valid=false when new item is too close to wall", () => {
    const newItem: RectItem = { x: 50, y: 0, width: 100, height: 100 };
    const existing: RectItem[] = [];
    // Wall rect: x=0, w=10, so gap = 50-10 = 40 < 100
    const walls: Wall[] = [
      { x1: 0, y1: 0, x2: 0, y2: 500, thickness: 10 },
    ];
    const result = validatePlacement(newItem, existing, walls);
    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("does not report overlap between existing items", () => {
    const newItem: RectItem = { x: 500, y: 500, width: 50, height: 50 };
    // These two existing items overlap each other
    const existing: RectItem[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
    ];
    const walls: Wall[] = [];
    const result = validatePlacement(newItem, existing, walls);
    // Only the new item is checked against existing; existing-to-existing overlaps not reported
    expect(result.valid).toBe(true);
  });
});

describe("ClearanceChecker - editor ADA checks", () => {
  it("checkClearanceViolations flags narrow aisles between furniture", () => {
    const editor = createMockEditor({
      shapes: [
        {
          id: "f1",
          type: "planner-furniture",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
        {
          id: "f2",
          type: "planner-furniture",
          x: 150,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
      ],
    });

    const violations = checkClearanceViolations(editor, {
      minAisleWidthMm: 900,
      canvasUnitsPerMm: 0.1,
    });
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe("aisle-too-narrow");
  });

  it("checkClearanceViolations flags insufficient wall clearance", () => {
    const editor = createMockEditor({
      shapes: [
        {
          id: "f1",
          type: "planner-furniture",
          x: 20,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 80, depthMm: 80 },
        } as never,
        {
          id: "w1",
          type: "planner-wall",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { startX: 0, startY: 0, endX: 0, endY: 200, thickness: 10 },
        } as never,
      ],
    });

    const violations = checkClearanceViolations(editor, {
      minAisleWidthMm: 900,
      canvasUnitsPerMm: 0.1,
    });
    expect(violations.some((v) => v.type === "insufficient-clearance")).toBe(true);
  });

  it("meetsAdaClearance and getClearanceSummary report pass/fail", () => {
    const editor = createMockEditor({
      shapes: [
        {
          id: "f1",
          type: "planner-furniture",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
        {
          id: "f2",
          type: "planner-furniture",
          x: 2000,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
      ],
    });

    expect(meetsAdaClearance(editor)).toBe(true);
    const summary = getClearanceSummary(editor);
    expect(summary.passed).toBe(true);
    expect(summary.errors).toBe(0);
  });

  it("checkClearanceViolations emits warning severity when close but not under minimum", () => {
    const editor = createMockEditor({
      shapes: [
        {
          id: "f1",
          type: "planner-furniture",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
        {
          id: "f2",
          type: "planner-furniture",
          x: 195,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
      ],
    });

    const violations = checkClearanceViolations(editor, {
      minAisleWidthMm: 900,
      warningFactor: 2,
      canvasUnitsPerMm: 0.1,
    });
    const warning = violations.find((v) => v.severity === "warning");
    expect(warning).toBeTruthy();
    expect(warning?.message).toContain("close to ADA minimum");
  });

  it("checkClearanceViolations respects disabled furniture and wall checks", () => {
    const editor = createMockEditor({
      shapes: [
        {
          id: "f1",
          type: "planner-furniture",
          x: 0,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
        {
          id: "f2",
          type: "planner-furniture",
          x: 50,
          y: 0,
          rotation: 0,
          opacity: 1,
          isLocked: false,
          props: { widthMm: 100, depthMm: 100 },
        } as never,
      ],
    });

    expect(
      checkClearanceViolations(editor, { checkFurnitureClearance: false, checkWallClearance: false }),
    ).toHaveLength(0);
  });
});
