import { describe, expect, it } from "vitest";

import {
  DEFAULT_LAYER_MANAGER_UI_STATE,
  normalizeLayerManagerUiState,
} from "@/features/planner/editor/layerManagerUiState";

describe("normalizeLayerManagerUiState", () => {
  it("falls back to defaults for invalid input", () => {
    expect(normalizeLayerManagerUiState(null)).toEqual(
      DEFAULT_LAYER_MANAGER_UI_STATE,
    );
    expect(normalizeLayerManagerUiState("bad")).toEqual(
      DEFAULT_LAYER_MANAGER_UI_STATE,
    );
  });

  it("keeps valid category, query, and boolean collapsed flags", () => {
    expect(
      normalizeLayerManagerUiState({
        activeCategory: "furniture",
        query: "desk",
        collapsedGroups: {
          furniture: true,
          wall: false,
          bad: "nope",
        },
      }),
    ).toEqual({
      activeCategory: "furniture",
      query: "desk",
      collapsedGroups: {
        furniture: true,
        wall: false,
      },
    });
  });

  it("rejects unknown categories", () => {
    expect(
      normalizeLayerManagerUiState({
        activeCategory: "unknown",
        query: "desk",
      }),
    ).toEqual({
      activeCategory: "all",
      query: "desk",
      collapsedGroups: {},
    });
  });
});

