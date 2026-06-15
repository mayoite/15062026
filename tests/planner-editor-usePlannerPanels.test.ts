import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getStepLeftOpenDefault,
  usePlannerPanels,
} from "@/features/planner/editor/usePlannerPanels";

describe("getStepLeftOpenDefault", () => {
  it("opens the catalog on place and collapses the left panel on draw and review", () => {
    expect(getStepLeftOpenDefault("place", false)).toBe(true);
    expect(getStepLeftOpenDefault("place", true)).toBe(true);
    expect(getStepLeftOpenDefault("draw", false)).toBe(false);
    expect(getStepLeftOpenDefault("draw", true)).toBe(false);
    expect(getStepLeftOpenDefault("review", false)).toBe(false);
  });
});

describe("usePlannerPanels", () => {
  let matchMediaListeners: Array<() => void> = [];
  const matchMedia = {
    matches: false,
    addEventListener: (_: string, listener: () => void) => {
      matchMediaListeners.push(listener);
    },
    removeEventListener: (_: string, listener: () => void) => {
      matchMediaListeners = matchMediaListeners.filter((entry) => entry !== listener);
    },
  };

  beforeEach(() => {
    matchMediaListeners = [];
    matchMedia.matches = false;
    vi.stubGlobal("matchMedia", vi.fn(() => matchMedia));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens both panels on desktop and toggles exclusively on compact", () => {
    const { result } = renderHook(() => usePlannerPanels());
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.rightOpen).toBe(true);

    act(() => {
      result.current.setRightOpen(false);
      result.current.toggleRight();
    });
    expect(result.current.rightOpen).toBe(true);
    expect(result.current.leftOpenRaw).toBe(false);

    matchMedia.matches = true;
    act(() => {
      for (const listener of matchMediaListeners) listener();
    });
    expect(result.current.isCompact).toBe(true);
    expect(result.current.leftOpen).toBe(false);

    act(() => {
      result.current.toggleLeft();
    });
    expect(result.current.leftOpen).toBe(true);
    expect(result.current.rightOpenRaw).toBe(false);

    act(() => {
      result.current.closeAll();
    });
    expect(result.current.leftOpenRaw).toBe(false);
    expect(result.current.rightOpenRaw).toBe(false);
  });

  it("keeps manual left panel overrides across step changes", () => {
    const { result } = renderHook(() => usePlannerPanels());

    act(() => {
      result.current.applyStepLayout("place");
    });
    expect(result.current.leftOpen).toBe(true);

    act(() => {
      result.current.toggleLeft();
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.leftManualOverride).toBe(true);

    act(() => {
      result.current.applyStepLayout("draw");
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.leftManualOverride).toBe(true);

    act(() => {
      result.current.applyStepLayout("place");
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.leftManualOverride).toBe(true);
  });

  it("applies step-based left panel defaults until the user overrides", () => {
    const { result } = renderHook(() => usePlannerPanels());

    act(() => {
      result.current.applyStepLayout("draw");
    });
    expect(result.current.leftOpen).toBe(false);

    act(() => {
      result.current.applyStepLayout("place");
    });
    expect(result.current.leftOpen).toBe(true);

    act(() => {
      result.current.toggleLeft();
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.leftManualOverride).toBe(true);

    act(() => {
      result.current.setLeftOpen(true);
    });
    expect(result.current.leftOpen).toBe(true);
    expect(result.current.leftManualOverride).toBe(true);

    act(() => {
      result.current.applyStepLayout("draw");
    });
    expect(result.current.leftOpen).toBe(true);
    expect(result.current.leftManualOverride).toBe(true);

    matchMedia.matches = true;
    act(() => {
      for (const listener of matchMediaListeners) listener();
    });

    act(() => {
      result.current.applyStepLayout("draw");
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.rightOpenRaw).toBe(false);

    act(() => {
      result.current.applyStepLayout("place");
    });
    expect(result.current.leftOpen).toBe(true);
    expect(result.current.rightOpenRaw).toBe(false);

    act(() => {
      result.current.applyStepLayout("review");
    });
    expect(result.current.leftOpen).toBe(false);
    expect(result.current.rightOpen).toBe(true);
  });
});