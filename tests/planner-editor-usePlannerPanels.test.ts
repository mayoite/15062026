import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlannerPanels } from "@/features/planner/editor/usePlannerPanels";

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
    expect(result.current.leftOpen).toBe(true);
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
});