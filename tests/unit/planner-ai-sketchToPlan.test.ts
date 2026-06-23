import { describe, expect, it } from "vitest";

import { SketchToPlanRequestSchema, SketchToPlanResponseSchema } from "@/lib/api/schemas";
import { buildSketchPlanFabricDraft } from "@/features/planner/ai/sketchToPlan";

describe("sketch-to-plan schemas", () => {
  it("accepts a sketch upload request", () => {
    const result = SketchToPlanRequestSchema.parse({
      imageDataUrl: "data:image/png;base64,AAA",
      fileName: "sketch.png",
      prompt: "Convert this sketch to an editable floor plan",
      includeRooms: true,
    });

    expect(result.fileName).toBe("sketch.png");
  });

  it("accepts an editable plan response", () => {
    const result = SketchToPlanResponseSchema.parse({
      objects: [
        { type: "wall", x1: 10, y1: 10, x2: 200, y2: 10 },
        { type: "room", left: 20, top: 20, width: 180, height: 120, label: "Room" },
      ],
      warnings: [],
    });

    expect(result.objects).toHaveLength(2);
  });

  it("builds a fabric draft from sketch objects", () => {
    const draft = buildSketchPlanFabricDraft({
      objects: [
        { type: "wall", x1: 10, y1: 10, x2: 200, y2: 10 },
        { type: "room", left: 20, top: 20, width: 180, height: 120, label: "Room" },
      ],
      warnings: [],
    });

    const parsed = JSON.parse(draft) as { objects?: Array<{ type?: string; name?: string }> };
    expect(parsed.objects?.some((object) => object.type === "line" && object.name?.startsWith("WALL:"))).toBe(true);
    expect(parsed.objects?.some((object) => object.type === "rect" && object.name?.startsWith("ROOM:"))).toBe(true);
  });
});
