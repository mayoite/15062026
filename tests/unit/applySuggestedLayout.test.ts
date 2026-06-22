import { describe, it, expect, beforeEach, vi } from "vitest";
import { applySuggestedLayout } from "@/features/planner/ai/applySuggestedLayout";
import { suggestLayoutGridPack } from "@/features/planner/ai/spaceSuggest";
import type { SpaceSuggestInput } from "@/features/planner/ai/types";
import { type getPlannerFabricRuntime, setPlannerFabricRuntime } from "@/features/planner/canvas-fabric";

describe("applySuggestedLayout", () => {
  let mockRuntime: ReturnType<typeof getPlannerFabricRuntime>;
  const insertedObjects: { type: string; object: unknown }[] = [];

  beforeEach(() => {
    insertedObjects.length = 0;
    mockRuntime = {
      insertObject: vi.fn((payload) => {
        insertedObjects.push(payload);
      }),
    } as unknown as ReturnType<typeof getPlannerFabricRuntime>;
    setPlannerFabricRuntime(mockRuntime);
  });

  it("inserts room object from layout", () => {
    const input: SpaceSuggestInput = {
      seatCount: 10,
      floorAreaSqFt: 2000,
      purpose: "open-office",
    };
    const layout = suggestLayoutGridPack(input);
    applySuggestedLayout(null, layout);

    expect(insertedObjects).toContainEqual(
      expect.objectContaining({
        type: "ROOM",
      })
    );
  });

  it("inserts at least 4 wall objects from perimeter walls", () => {
    const input: SpaceSuggestInput = {
      seatCount: 10,
      floorAreaSqFt: 2000,
      purpose: "open-office",
    };
    const layout = suggestLayoutGridPack(input);
    applySuggestedLayout(null, layout);

    const wallObjects = insertedObjects.filter((obj) => obj.type === "WALL");
    expect(wallObjects.length).toBeGreaterThanOrEqual(4);
    expect(wallObjects.every((w) => (w.object as { name?: string }).name?.startsWith("WALL:"))).toBe(true);
  });

  it("places furniture at explicit coordinates", () => {
    const input: SpaceSuggestInput = {
      seatCount: 5,
      floorAreaSqFt: 1500,
      purpose: "open-office",
    };
    const layout = suggestLayoutGridPack(input);
    applySuggestedLayout(null, layout);

    const genericObjects = insertedObjects.filter((obj) => obj.type === "GENERIC");
    expect(genericObjects.length).toBeGreaterThan(0);
    expect(genericObjects.every((g) => (g.object as { left?: number, top?: number }).left !== undefined && (g.object as { left?: number, top?: number }).top !== undefined)).toBe(true);
  });

  it("handles empty layout gracefully", () => {
    applySuggestedLayout(null, undefined);
    expect(insertedObjects.length).toBe(0);
  });
});
