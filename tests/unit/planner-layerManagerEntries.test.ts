import { describe, expect, it } from "vitest";

import {
  buildLayerManagerEntries,
  filterLayerManagerEntries,
  getNextLayerSelection,
  groupLayerManagerEntries,
  summarizeLayerGroupSelection,
} from "@/features/planner/editor/layerManagerEntries";

describe("buildLayerManagerEntries", () => {
  it("prefers product and label metadata for row titles", () => {
    const entries = buildLayerManagerEntries(
      [
        {
          id: "shape-1",
          type: "planner-furniture",
          props: { productName: "Executive Desk", widthMm: 1800, heightMm: 900 },
        },
        {
          id: "shape-2",
          type: "planner-zone",
          props: { label: "Reception" },
        },
      ],
      ["shape-2"],
      "metric",
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: "shape-2",
      category: "zone",
      label: "Reception",
      isSelected: true,
    });
    expect(entries[1]).toMatchObject({
      id: "shape-1",
      label: "Executive Desk",
      detail: "1800 x 900 mm",
    });
  });

  it("falls back to planner-friendly labels and lock state", () => {
    const entries = buildLayerManagerEntries(
      [
        {
          id: "shape-1",
          type: "planner-wall",
          isLocked: true,
          props: { startX: 0, startY: 0, endX: 400, endY: 0 },
        },
      ],
      [],
      "metric",
    );

    expect(entries[0]).toMatchObject({
      label: "Wall",
      category: "wall",
      typeLabel: "wall",
      isLocked: true,
      detail: "4000 mm wall",
    });
  });

  it("filters entries by category and search query", () => {
    const entries = buildLayerManagerEntries(
      [
        {
          id: "shape-1",
          type: "planner-furniture",
          props: { productName: "Executive Desk", widthMm: 1800, heightMm: 900 },
        },
        {
          id: "shape-2",
          type: "planner-zone",
          props: { label: "Reception" },
        },
        {
          id: "shape-3",
          type: "planner-wall",
          props: { startX: 0, startY: 0, endX: 300, endY: 0 },
        },
      ],
      [],
      "metric",
    );

    expect(filterLayerManagerEntries(entries, "zone", "")).toHaveLength(1);
    expect(filterLayerManagerEntries(entries, "all", "desk")).toHaveLength(1);
    expect(filterLayerManagerEntries(entries, "wall", "reception")).toHaveLength(0);
  });

  it("groups filtered entries by planner category order", () => {
    const entries = buildLayerManagerEntries(
      [
        {
          id: "shape-1",
          type: "planner-furniture",
          props: { productName: "Executive Desk" },
        },
        {
          id: "shape-2",
          type: "planner-zone",
          props: { label: "Reception" },
        },
        {
          id: "shape-3",
          type: "planner-wall",
          props: { startX: 0, startY: 0, endX: 300, endY: 0 },
        },
      ],
      [],
      "metric",
    );

    const groups = groupLayerManagerEntries(entries);

    expect(groups.map((group) => group.category)).toEqual(["wall", "zone", "furniture"]);
    expect(groups[0]?.entries).toHaveLength(1);
    expect(groups[1]?.label).toBe("Zones");
  });

  it("supports additive and range layer-list selection", () => {
    const orderedIds = ["shape-4", "shape-3", "shape-2", "shape-1"];

    expect(getNextLayerSelection({
      anchorId: "shape-3",
      clickedId: "shape-1",
      currentIds: ["shape-3"],
      orderedIds,
      extendRange: true,
    })).toEqual(["shape-3", "shape-2", "shape-1"]);

    expect(getNextLayerSelection({
      anchorId: "shape-3",
      clickedId: "shape-2",
      currentIds: ["shape-3"],
      orderedIds,
      toggleSelection: true,
    })).toEqual(["shape-3", "shape-2"]);

    expect(getNextLayerSelection({
      anchorId: "shape-3",
      clickedId: "shape-3",
      currentIds: ["shape-3"],
      orderedIds,
      toggleSelection: true,
    })).toEqual([]);
  });

  it("summarizes selected rows inside a group", () => {
    const entries = buildLayerManagerEntries(
      [
        {
          id: "shape-1",
          type: "planner-furniture",
          props: { productName: "Executive Desk" },
        },
        {
          id: "shape-2",
          type: "planner-furniture",
          props: { productName: "Visitor Chair" },
        },
      ],
      ["shape-2"],
      "metric",
    );

    expect(summarizeLayerGroupSelection(entries)).toEqual({
      totalCount: 2,
      selectedCount: 1,
      allSelected: false,
    });
  });
});

