import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePlannerUiState } from "@/features/planner/hooks/usePlannerUiState";

describe("usePlannerUiState", () => {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("innerWidth", 1280);
    Object.defineProperty(window, "addEventListener", {
      value: addEventListener,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, "removeEventListener", {
      value: removeEventListener,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("defaults to desktop mode and exposes initial panel state", () => {
    const { result } = renderHook(() => usePlannerUiState({ mode: "desktop" }));

    expect(result.current.isMobileMode).toBe(false);
    expect(result.current.currentStep).toBe("room");
    expect(result.current.activeDrawingTool).toBe("line");
    expect(result.current.showCatalog).toBe(true);
    expect(result.current.showLayers).toBe(false);
    expect(result.current.showInspector).toBe(true);
    expect(result.current.catalogPinned).toBe(true);
    expect(result.current.layersPinned).toBe(false);
    expect(result.current.inspectorPinned).toBe(true);
    expect(result.current.isSnapMode).toBe(true);
    expect(result.current.isGridVisible).toBe(true);
    expect(result.current.unitSystem).toBe("mm");
    expect(result.current.activePanel).toBe(null);
    expect(result.current.showAi).toBe(true);
    expect(result.current.mobileCatalogOpen).toBe(false);
    expect(result.current.mobileLayersOpen).toBe(false);
    expect(result.current.mobileInspectorOpen).toBe(false);
  });

  it("forces mobile mode when mode is mobile", () => {
    const { result } = renderHook(() => usePlannerUiState({ mode: "mobile" }));

    expect(result.current.isMobileMode).toBe(true);
    expect(addEventListener).not.toHaveBeenCalled();
  });

  it("syncs auto mode from viewport width and resize events", () => {
    vi.stubGlobal("innerWidth", 800);

    const { result, unmount } = renderHook(() => usePlannerUiState({ mode: "auto" }));

    expect(result.current.isMobileMode).toBe(true);
    expect(addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));

    const resizeHandler = addEventListener.mock.calls.find(([event]) => event === "resize")?.[1] as () => void;

    act(() => {
      vi.stubGlobal("innerWidth", 1400);
      resizeHandler();
    });

    expect(result.current.isMobileMode).toBe(false);

    act(() => {
      result.current.setCurrentStep("catalog");
      result.current.setActiveDrawingTool("geo");
      result.current.setShowCatalog(false);
      result.current.setShowLayers(true);
      result.current.setShowInspector(false);
      result.current.setCatalogPinned(false);
      result.current.setLayersPinned(true);
      result.current.setInspectorPinned(false);
      result.current.setIsSnapMode(false);
      result.current.setIsGridVisible(false);
      result.current.setUnitSystem("ft-in");
      result.current.setActivePanel("layers");
      result.current.setShowAi(false);
      result.current.setMobileCatalogOpen(true);
      result.current.setMobileLayersOpen(true);
      result.current.setMobileInspectorOpen(true);
    });

    expect(result.current.currentStep).toBe("catalog");
    expect(result.current.activeDrawingTool).toBe("geo");
    expect(result.current.showCatalog).toBe(false);
    expect(result.current.showLayers).toBe(true);
    expect(result.current.showInspector).toBe(false);
    expect(result.current.catalogPinned).toBe(false);
    expect(result.current.layersPinned).toBe(true);
    expect(result.current.inspectorPinned).toBe(false);
    expect(result.current.isSnapMode).toBe(false);
    expect(result.current.isGridVisible).toBe(false);
    expect(result.current.unitSystem).toBe("ft-in");
    expect(result.current.activePanel).toBe("layers");
    expect(result.current.showAi).toBe(false);
    expect(result.current.mobileCatalogOpen).toBe(true);
    expect(result.current.mobileLayersOpen).toBe(true);
    expect(result.current.mobileInspectorOpen).toBe(true);

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("resize", resizeHandler);
  });

  it("treats wide auto mode viewports as desktop", () => {
    vi.stubGlobal("innerWidth", 1600);

    const { result } = renderHook(() => usePlannerUiState({ mode: "auto" }));

    expect(result.current.isMobileMode).toBe(false);
  });

});