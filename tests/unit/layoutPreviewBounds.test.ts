import { describe, expect, it } from "vitest";

import { buildLayoutPreviewModel } from "@/features/planner/ai/layoutPreviewBounds";
import type { SuggestedLayoutJson } from "@/features/planner/ai/types";

const SAMPLE_LAYOUT: SuggestedLayoutJson = {
  version: 1,
  source: "grid-pack",
  summary: "Test layout",
  room: { label: "Office", x: 100, y: 100, widthMm: 800, depthMm: 600 },
  walls: [
    { type: "planner-wall", x: 100, y: 100, endX: 80, endY: 0, lengthMm: 8000 },
  ],
  zones: [
    {
      label: "Focus",
      x: 110,
      y: 110,
      widthMm: 300,
      heightMm: 200,
      zoneType: "focus",
    },
  ],
  furniture: [
    {
      catalogItemId: "room-meeting-8",
      label: "Bench",
      x: 130,
      y: 150,
    },
  ],
};

describe("buildLayoutPreviewModel", () => {
  it("includes room, zones, furniture, and walls in bounds", () => {
    const model = buildLayoutPreviewModel(SAMPLE_LAYOUT);

    expect(model.room.x).toBe(100);
    expect(model.room.w).toBeGreaterThan(0);
    expect(model.zones).toHaveLength(1);
    expect(model.furniture).toHaveLength(1);
    expect(model.walls).toHaveLength(1);
    expect(model.bounds.w).toBeGreaterThan(model.room.w);
    expect(model.bounds.h).toBeGreaterThan(model.room.h);
  });
});