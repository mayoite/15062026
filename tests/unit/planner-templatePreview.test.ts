import { describe, expect, it } from "vitest";

import { LAYOUT_TEMPLATES } from "@/features/planner/templates/layoutTemplates";
import { buildTemplatePreview } from "@/features/planner/editor/templates/TemplatePickerModal";

describe("buildTemplatePreview", () => {
  it("returns a preview for every layout template", () => {
    expect(LAYOUT_TEMPLATES.length).toBeGreaterThan(0);
    for (const template of LAYOUT_TEMPLATES) {
      const preview = buildTemplatePreview(template);
      expect(preview.viewBoxHeight).toBeGreaterThan(0);
      expect(preview.rects.length).toBeGreaterThan(1);
      expect(preview.rects.length).toBe(template.shapes.length + 1);
    }
  });

  it("starts with the outer room rect covering the full viewBox", () => {
    for (const template of LAYOUT_TEMPLATES) {
      const preview = buildTemplatePreview(template);
      const [outer] = preview.rects;
      expect(outer.kind).toBe("room");
      expect(outer.x).toBe(0);
      expect(outer.y).toBe(0);
      expect(outer.width).toBe(100);
      expect(outer.height).toBeCloseTo(preview.viewBoxHeight, 5);
    }
  });

  it("preserves the room aspect ratio (min 900×620 mm floor)", () => {
    for (const template of LAYOUT_TEMPLATES) {
      const roomW = Math.max(template.recommendedRoomSize.minWidth, 900);
      const roomH = Math.max(template.recommendedRoomSize.minHeight, 620);
      const preview = buildTemplatePreview(template);
      expect(preview.viewBoxHeight).toBeCloseTo((roomH / roomW) * 100, 5);
    }
  });

  it("clamps every rect inside the viewBox", () => {
    for (const template of LAYOUT_TEMPLATES) {
      const preview = buildTemplatePreview(template);
      for (const rect of preview.rects) {
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.height).toBeGreaterThan(0);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(100 + 1e-6);
        expect(rect.y + rect.height).toBeLessThanOrEqual(preview.viewBoxHeight + 1e-6);
      }
    }
  });

  it("classifies zones, rooms, and furniture like the canvas builder", () => {
    const openPlan = LAYOUT_TEMPLATES.find((t) => t.id === "open-plan-24");
    expect(openPlan).toBeDefined();
    const preview = buildTemplatePreview(openPlan as NonNullable<typeof openPlan>);
    const kinds = preview.rects.map((rect) => rect.kind);
    expect(kinds).toContain("zone");
    expect(kinds).toContain("furniture");
    // Benches and desks are furniture, not rooms.
    const furnitureCount = kinds.filter((kind) => kind === "furniture").length;
    expect(furnitureCount).toBe(8);
  });
});

