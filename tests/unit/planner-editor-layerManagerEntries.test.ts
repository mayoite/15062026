import { describe, expect, it } from "vitest";

import {
  buildLayerManagerEntries,
  filterLayerManagerEntries,
  getNextLayerSelection,
  groupLayerManagerEntries,
  summarizeLayerGroupSelection,
} from "@/features/planner/editor/layerManagerEntries";

const shapes = [
  {
    id: "shape:wall",
    type: "planner-wall",
    props: { startX: 0, startY: 0, endX: 100, endY: 0 },
    rotation: 0,
  },
  {
    id: "shape:room",
    type: "planner-room",
    props: { label: "Office", widthMm: 120, heightMm: 80 },
    rotation: Math.PI / 4,
  },
  {
    id: "shape:furniture",
    type: "planner-furniture",
    props: { productName: "Desk", widthMm: 1200, heightMm: 600 },
    rotation: 0,
    isLocked: true,
  },
  {
    id: "shape:zone",
    type: "planner-zone",
    props: { widthMm: 100, heightMm: 50 },
    rotation: 0,
  },
  {
    id: "shape:unknown",
    type: "planner-custom",
    meta: { text: "Custom layer item" },
    rotation: 0,
  },
];

describe("layer manager entries", () => {
  it("builds entries with labels, details, and selection state", () => {
    const entries = buildLayerManagerEntries(shapes, ["shape:furniture"], "metric");
    expect(entries).toHaveLength(5);
    expect(entries[0]?.id).toBe("shape:unknown");
    expect(entries.find((entry) => entry.id === "shape:furniture")).toMatchObject({
      label: "Desk",
      category: "furniture",
      isLocked: true,
      isSelected: true,
    });
    expect(entries.find((entry) => entry.id === "shape:room")?.detail).toContain("mm");
    expect(entries.find((entry) => entry.id === "shape:wall")?.detail).toContain("wall");
  });

  it("uses imperial unit label in details", () => {
    const entries = buildLayerManagerEntries(
      [shapes[1]!],
      [],
      "imperial",
    );
    expect(entries[0]?.detail).toContain("mm source");
  });

  it("filters entries by category and query", () => {
    const entries = buildLayerManagerEntries(shapes, [], "metric");
    expect(filterLayerManagerEntries(entries, "furniture", "")).toHaveLength(1);
    expect(filterLayerManagerEntries(entries, "all", "office")).toHaveLength(1);
    expect(filterLayerManagerEntries(entries, "wall", "desk")).toHaveLength(0);
    expect(filterLayerManagerEntries(entries, "all", "   ")).toHaveLength(entries.length);
  });

  it("groups entries in stable order and skips empty groups", () => {
    const entries = buildLayerManagerEntries(shapes, [], "metric");
    const groups = groupLayerManagerEntries(entries);
    expect(groups.map((group) => group.category)).toEqual([
      "wall",
      "room",
      "zone",
      "furniture",
      "other",
    ]);
    expect(groups.find((group) => group.category === "furniture")?.label).toBe("Furniture");
  });

  it("computes next selection for range and toggle interactions", () => {
    const orderedIds = ["a", "b", "c", "d"];
    expect(
      getNextLayerSelection({
        anchorId: "a",
        clickedId: "c",
        currentIds: ["a"],
        orderedIds,
        extendRange: true,
      }),
    ).toEqual(["a", "b", "c"]);
    expect(
      getNextLayerSelection({
        anchorId: null,
        clickedId: "b",
        currentIds: ["a", "b"],
        orderedIds,
        toggleSelection: true,
      }),
    ).toEqual(["a"]);
    expect(
      getNextLayerSelection({
        anchorId: null,
        clickedId: "c",
        currentIds: ["a"],
        orderedIds,
        toggleSelection: true,
      }),
    ).toEqual(["a", "c"]);
    expect(
      getNextLayerSelection({
        anchorId: null,
        clickedId: "d",
        currentIds: [],
        orderedIds,
      }),
    ).toEqual(["d"]);
  });

  it("summarizes group selection", () => {
    const entries = buildLayerManagerEntries(shapes, ["shape:wall", "shape:room"], "metric");
    const groupEntries = entries.filter((entry) => entry.category === "wall" || entry.category === "room");
    expect(summarizeLayerGroupSelection(groupEntries)).toEqual({
      totalCount: 2,
      selectedCount: 2,
      allSelected: true,
    });
    expect(summarizeLayerGroupSelection([])).toEqual({
      totalCount: 0,
      selectedCount: 0,
      allSelected: false,
    });
  });
});
