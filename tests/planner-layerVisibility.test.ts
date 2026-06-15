import { describe, expect, it } from "vitest";
import type { Editor } from "tldraw";

import {
  applyLayerVisibility,
  isShapeLayerHidden,
  nextLayerVisibilityUpdate,
} from "@/features/planner/editor/layerVisibility";
import type { PlannerLayerCategory } from "@/features/planner/store/workspaceStore";

/**
 * Regression guard: tldraw shape `meta` must be JSON-serializable. A previous
 * implementation wrote `layerWasLocked: undefined` when re-showing a layer,
 * which threw `ValidationError: Expected json serializable value, got undefined`
 * and crashed the planner whenever any layered shape (e.g. furniture) existed.
 */
function assertJsonSerializable(meta: Record<string, unknown>) {
  for (const [key, value] of Object.entries(meta)) {
    expect(value, `meta.${key} must not be undefined`).not.toBe(undefined);
  }
  // Round-trips without dropping keys (undefined values would be stripped).
  expect(JSON.parse(JSON.stringify(meta))).toEqual(meta);
}

type FakeShape = {
  id: string;
  type: string;
  isLocked: boolean;
  meta?: Record<string, unknown>;
};

type CapturedUpdate = {
  id: string;
  type: string;
  isLocked: boolean;
  meta: Record<string, unknown>;
};

/**
 * Minimal stand-in for the tldraw Editor. It mirrors the real editor closely
 * enough for `applyLayerVisibility`: `run` executes synchronously, shapes are
 * returned by `getCurrentPageShapes`, and `updateShape` merges the partial back
 * into the shape (as tldraw does) while recording every call for assertions.
 */
function createFakeEditor(shapes: FakeShape[]) {
  const updates: CapturedUpdate[] = [];
  const editor = {
    run: (fn: () => void) => fn(),
    getCurrentPageShapes: () => shapes,
    updateShape: (partial: CapturedUpdate) => {
      updates.push({ ...partial, meta: { ...partial.meta } });
      const target = shapes.find((s) => s.id === partial.id);
      if (target) {
        target.isLocked = partial.isLocked;
        target.meta = partial.meta;
      }
    },
  } as unknown as Editor;
  return { editor, updates };
}

const allVisible: Record<PlannerLayerCategory, boolean> = {
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
  underlay: true,
};

function hideOnly(category: PlannerLayerCategory): Record<PlannerLayerCategory, boolean> {
  return { ...allVisible, [category]: false };
}

describe("nextLayerVisibilityUpdate", () => {
  it("never emits an undefined meta value when re-showing a shape", () => {
    const { isLocked, meta } = nextLayerVisibilityUpdate(
      { isLocked: true, meta: { layerHidden: true, layerWasLocked: false } },
      true,
    );

    assertJsonSerializable(meta);
    expect("layerWasLocked" in meta).toBe(false);
    expect(meta.layerHidden).toBe(false);
    // Restores the lock state captured when the layer was hidden.
    expect(isLocked).toBe(false);
  });

  it("captures the prior lock state when hiding a shape", () => {
    const { isLocked, meta } = nextLayerVisibilityUpdate(
      { isLocked: true, meta: { custom: "keep" } },
      false,
    );

    assertJsonSerializable(meta);
    expect(meta.layerHidden).toBe(true);
    expect(meta.layerWasLocked).toBe(true);
    // Hidden shapes are always locked so they cannot be edited.
    expect(isLocked).toBe(true);
    // Unrelated meta is preserved.
    expect(meta.custom).toBe("keep");
  });

  it("handles shapes that have no meta yet", () => {
    const { meta } = nextLayerVisibilityUpdate({ isLocked: false }, true);
    assertJsonSerializable(meta);
    expect(meta).toEqual({ layerHidden: false });
  });

  it("round-trips hide then show without leaking undefined", () => {
    const hidden = nextLayerVisibilityUpdate({ isLocked: false, meta: {} }, false);
    assertJsonSerializable(hidden.meta);
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: hidden.meta })).toBe(true);

    const shown = nextLayerVisibilityUpdate({ isLocked: hidden.isLocked, meta: hidden.meta }, true);
    assertJsonSerializable(shown.meta);
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: shown.meta })).toBe(false);
    // The shape returns to its original unlocked state after the round-trip.
    expect(shown.isLocked).toBe(false);
  });
});

describe("isShapeLayerHidden", () => {
  it("is true only when meta.layerHidden === true", () => {
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: { layerHidden: true } })).toBe(true);
  });

  it("is false when meta is missing or layerHidden is falsy", () => {
    expect(isShapeLayerHidden({ type: "planner-furniture" })).toBe(false);
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: {} })).toBe(false);
    expect(isShapeLayerHidden({ type: "planner-furniture", meta: { layerHidden: false } })).toBe(false);
  });
});

describe("applyLayerVisibility", () => {
  it("hides shapes in the toggled-off layer and records the prior lock state", () => {
    const { editor, updates } = createFakeEditor([
      { id: "f1", type: "planner-furniture", isLocked: false, meta: {} },
    ]);

    applyLayerVisibility(editor, hideOnly("furniture"));

    expect(updates).toHaveLength(1);
    expect(updates[0].isLocked).toBe(true);
    expect(updates[0].meta).toMatchObject({ layerHidden: true, layerWasLocked: false });
  });

  it("ignores shapes whose type has no layer category", () => {
    const { editor, updates } = createFakeEditor([
      { id: "x1", type: "geo", isLocked: false, meta: {} },
    ]);

    applyLayerVisibility(editor, hideOnly("furniture"));

    expect(updates).toHaveLength(0);
  });

  it("restores the original lock state when a layer becomes visible again", () => {
    const shape: FakeShape = { id: "f1", type: "planner-furniture", isLocked: false, meta: {} };
    const { editor, updates } = createFakeEditor([shape]);

    // Hide, then show.
    applyLayerVisibility(editor, hideOnly("furniture"));
    applyLayerVisibility(editor, allVisible);

    const showUpdate = updates[1];
    expect(showUpdate.meta.layerHidden).toBe(false);
    // Was unlocked before hiding, so it must be unlocked again after showing.
    expect(showUpdate.isLocked).toBe(false);
  });

  it("keeps a shape locked across a hide/show cycle if it was locked to begin with", () => {
    const shape: FakeShape = { id: "f1", type: "planner-furniture", isLocked: true, meta: {} };
    const { editor, updates } = createFakeEditor([shape]);

    applyLayerVisibility(editor, hideOnly("furniture"));
    applyLayerVisibility(editor, allVisible);

    expect(updates[1].meta.layerHidden).toBe(false);
    expect(updates[1].isLocked).toBe(true);
  });

  it("never writes an undefined value into shape meta (JSON-serializable)", () => {
    const shape: FakeShape = { id: "f1", type: "planner-furniture", isLocked: false, meta: {} };
    const { editor, updates } = createFakeEditor([shape]);

    applyLayerVisibility(editor, hideOnly("furniture"));
    applyLayerVisibility(editor, allVisible);

    for (const update of updates) {
      expect(Object.values(update.meta)).not.toContain(undefined);
      // A round-trip must preserve every key (undefined values would be dropped).
      const roundTripped = JSON.parse(JSON.stringify(update.meta));
      expect(Object.keys(roundTripped).sort()).toEqual(Object.keys(update.meta).sort());
    }

    // After becoming visible, the transient lock-tracking key is gone.
    expect("layerWasLocked" in updates[1].meta).toBe(false);
  });
});
