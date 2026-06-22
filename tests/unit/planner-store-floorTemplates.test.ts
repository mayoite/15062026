import { describe, it, expect } from "vitest";
import { floorTemplates, instantiateTemplate } from "@/features/planner/store/floorTemplates";

describe("floorTemplates", () => {
  it("exports an array of floor templates", () => {
    expect(Array.isArray(floorTemplates)).toBe(true);
    expect(floorTemplates.length).toBeGreaterThan(0);
  });

  it("each template has correct structure", () => {
    for (const template of floorTemplates) {
      expect(template).toHaveProperty("id");
      expect(typeof template.id).toBe("string");
      expect(template).toHaveProperty("name");
      expect(template).toHaveProperty("description");
      expect(template).toHaveProperty("icon");
      expect(template).toHaveProperty("size");
      expect(Array.isArray(template.walls)).toBe(true);
      expect(Array.isArray(template.rooms)).toBe(true);
      expect(Array.isArray(template.doors)).toBe(true);
      expect(Array.isArray(template.windows)).toBe(true);
      expect(Array.isArray(template.furniture)).toBe(true);
    }
  });

  describe("instantiateTemplate", () => {
    it("adds UUIDs to all elements and zIndex to furniture", () => {
      const template = floorTemplates.find(t => t.id === "single-room");
      expect(template).toBeDefined();
      if (!template) return;

      const instantiated = instantiateTemplate(template);

      expect(instantiated.walls).toHaveLength(template.walls.length);
      for (const w of instantiated.walls) {
        expect(w.id).toBeDefined();
        expect(typeof w.id).toBe("string");
      }

      expect(instantiated.rooms).toHaveLength(template.rooms.length);
      for (const r of instantiated.rooms) {
        expect(r.id).toBeDefined();
      }

      expect(instantiated.doors).toHaveLength(template.doors.length);
      for (const d of instantiated.doors) {
        expect(d.id).toBeDefined();
      }

      expect(instantiated.windows).toHaveLength(template.windows.length);
      for (const w of instantiated.windows) {
        expect(w.id).toBeDefined();
      }

      // Check another template with furniture
      const templateWithFurniture = floorTemplates.find(t => t.id === "executive-suite");
      expect(templateWithFurniture).toBeDefined();
      if (!templateWithFurniture) return;

      const instWithFurniture = instantiateTemplate(templateWithFurniture);
      expect(instWithFurniture.furniture.length).toBeGreaterThan(0);
      
      for (let i = 0; i < instWithFurniture.furniture.length; i++) {
        const f = instWithFurniture.furniture[i];
        expect(f?.id).toBeDefined();
        expect(typeof f?.id).toBe("string");
        expect(f?.zIndex).toBe(i);
      }
    });
  });
});

