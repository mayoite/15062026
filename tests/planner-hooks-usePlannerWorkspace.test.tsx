import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPlannerDocument } from "@/features/planner/model";
import type { CatalogProduct, RoomPreset } from "@/features/planner/shared/types/planner";

const {
  configureWallTool,
  configureBasicShapeTool,
  createPlannerWallSegment,
  createPlannerDoorOpening,
  resolvePlannerWallJoins,
  alignPlannerSelection,
  distributePlannerSelection,
  readPlannerSelectionDimensions,
  updatePlannerSelectionDimensions,
  runPlannerComplianceCheck,
  buildPlannerDocumentFromEditor,
  loadPlannerDocumentIntoEditor,
} = vi.hoisted(() => ({
  configureWallTool: vi.fn(),
  configureBasicShapeTool: vi.fn(),
  createPlannerWallSegment: vi.fn(),
  createPlannerDoorOpening: vi.fn(),
  resolvePlannerWallJoins: vi.fn(),
  alignPlannerSelection: vi.fn(),
  distributePlannerSelection: vi.fn(),
  readPlannerSelectionDimensions: vi.fn(),
  updatePlannerSelectionDimensions: vi.fn(),
  runPlannerComplianceCheck: vi.fn(() => []),
  buildPlannerDocumentFromEditor: vi.fn(),
  loadPlannerDocumentIntoEditor: vi.fn(),
}));

vi.mock("@/features/planner/lib/editorTools", () => ({
  alignPlannerSelection,
  configureBasicShapeTool,
  configureWallTool,
  createPlannerDoorOpening,
  createPlannerWallSegment,
  distributePlannerSelection,
  readPlannerSelectionDimensions,
  resolvePlannerWallJoins,
  updatePlannerSelectionDimensions,
}));

vi.mock("@/features/planner/lib/compliance", () => ({
  runPlannerComplianceCheck,
}));

vi.mock("@/features/planner/lib/documentBridge", () => ({
  buildPlannerDocumentFromEditor,
  loadPlannerDocumentIntoEditor,
}));

import { createShapeId } from "tldraw";

import { usePlannerWorkspace } from "@/features/planner/hooks/usePlannerWorkspace";

const ROOM_BOUNDARY_ID = createShapeId("room-boundary");

type MockShape = {
  id: string;
  type: string;
  x?: number;
  y?: number;
  meta?: Record<string, unknown>;
  props?: Record<string, unknown>;
};

function createMockEditor(initialShapes: MockShape[] = []) {
  const shapes = [...initialShapes];
  let selectedIds: string[] = [];
  const listeners: Array<{ callback: (history?: { changes: { added: object; updated: object; removed: object } }) => void; options?: { scope?: string } }> = [];
  const camera = { x: 0, y: 0, z: 1 };

  const notifyListeners = (change?: { added?: object; updated?: object; removed?: object }) => {
    listeners.forEach(({ callback, options }) => {
      if (options?.scope === "document") {
        callback({
          changes: {
            added: change?.added ?? {},
            updated: change?.updated ?? {},
            removed: change?.removed ?? {},
          },
        });
      } else {
        callback();
      }
    });
  };

  const editor = {
    getSelectedShapeIds: () => selectedIds,
    getShape: (id: string) => shapes.find((shape) => shape.id === id) ?? null,
    getCurrentPageShapes: () => shapes,
    getViewportPageBounds: vi.fn(() => ({ center: { x: 500, y: 400 } })),
    getCamera: vi.fn(() => ({ ...camera })),
    setCamera: vi.fn((next: typeof camera) => {
      camera.x = next.x;
      camera.y = next.y;
      camera.z = next.z;
    }),
    canUndo: vi.fn(() => true),
    canRedo: vi.fn(() => true),
    undo: vi.fn(),
    redo: vi.fn(),
    setCurrentTool: vi.fn(),
    updateInstanceState: vi.fn(),
    user: { updateUserPreferences: vi.fn() },
    pageToViewport: vi.fn((point: { x: number; y: number }) => point),
    getShapePageBounds: vi.fn(() => ({ minX: 0, minY: 0, maxX: 900, maxY: 650, w: 900, h: 650 })),
    getSelectionPageBounds: vi.fn(() => ({ minX: 10, minY: 20, w: 120, h: 80, x: 10, y: 20 })),
    createShape: vi.fn((shape: MockShape) => {
      shapes.push(shape);
      notifyListeners({ added: { [shape.id]: shape } });
    }),
    createAssets: vi.fn(),
    deleteShapes: vi.fn((ids: string[]) => {
      ids.forEach((id) => {
        const index = shapes.findIndex((shape) => shape.id === id);
        if (index >= 0) shapes.splice(index, 1);
      });
      notifyListeners({ removed: Object.fromEntries(ids.map((id) => [id, true])) });
    }),
    select: vi.fn((id: string) => {
      selectedIds = [id];
      notifyListeners();
    }),
    selectNone: vi.fn(() => {
      selectedIds = [];
      notifyListeners();
    }),
    duplicateShapes: vi.fn(),
    zoomToSelection: vi.fn(),
    zoomToFit: vi.fn(),
    store: {
      listen: vi.fn((callback: (history?: { changes: { added: object; updated: object; removed: object } }) => void, options?: { scope?: string }) => {
        listeners.push({ callback, options });
        return vi.fn();
      }),
    },
    setSelectedIds: (ids: string[]) => {
      selectedIds = ids;
    },
    getShapes: () => shapes,
    triggerViewportSync: () => {
      const viewportListener = listeners.find(({ options }) => !options)?.callback;
      viewportListener?.();
    },
  };

  return editor;
}

function createHookOptions(overrides: Partial<Parameters<typeof usePlannerWorkspace>[0]> = {}) {
  const setPlanName = vi.fn();
  const setActiveDocumentId = vi.fn();
  const navigate = vi.fn();
  const addBoqItem = vi.fn();
  const clearBoqCart = vi.fn();

  return {
    options: {
      mode: "desktop" as const,
      planName: "North Bay",
      setPlanName,
      activeDocumentId: "550e8400-e29b-41d4-a716-446655440001",
      setActiveDocumentId,
      navigate,
      addBoqItem,
      clearBoqCart,
      ...overrides,
    },
    setPlanName,
    setActiveDocumentId,
    navigate,
    addBoqItem,
    clearBoqCart,
  };
}

describe("usePlannerWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readPlannerSelectionDimensions.mockReturnValue(null);
    buildPlannerDocumentFromEditor.mockReturnValue(createPlannerDocument({ name: "From Editor" }));
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  it("exposes defaults, room presets, and mounts the editor", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor();

    expect(result.current.roomPresets.length).toBeGreaterThan(0);
    expect(result.current.currentStep).toBe("room");
    expect(result.current.canEnterCatalog).toBe(false);

    act(() => {
      result.current.handleMount(editor as never);
    });

    expect(result.current.editor).toBe(editor);
    expect(editor.updateInstanceState).toHaveBeenCalledWith({ isGridMode: false });
    expect(editor.user.updateUserPreferences).toHaveBeenCalledWith({ isSnapMode: true });
    expect(configureWallTool).toHaveBeenCalledWith(editor);
    expect(result.current.activeDrawingTool).toBe("line");
  });

  it("selects drawing tools and blocks gated steps until a room shell exists", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor();

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.selectDrawingTool("geo");
      result.current.selectDrawingTool("text");
      result.current.selectDrawingTool("arrow");
      result.current.applyStepMode("catalog");
      result.current.applyStepMode("measure");
      result.current.applyStepMode("review");
    });

    expect(configureBasicShapeTool).toHaveBeenCalledWith(editor);
    expect(editor.setCurrentTool).toHaveBeenCalledWith("text");
    expect(editor.setCurrentTool).toHaveBeenCalledWith("arrow");
    expect(result.current.currentStep).toBe("room");

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
      result.current.applyStepMode("measure", { force: true });
      result.current.applyStepMode("review", { force: true });
    });

    expect(result.current.currentStep).toBe("review");
    expect(result.current.showLayers).toBe(true);
    expect(result.current.showCatalog).toBe(false);
  });

  it("applies mobile step panel behavior and syncs snap/grid preferences", () => {
    const { options } = createHookOptions({ mode: "mobile" });
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([{ id: "shape:room", type: "geo", meta: { structureType: "wall-segment" } }]);

    act(() => {
      result.current.handleMount(editor as never);
      result.current.applyStepMode("measure", { force: true });
      result.current.setIsSnapMode(false);
      result.current.setIsGridVisible(false);
    });

    expect(result.current.isMobileMode).toBe(true);
    expect(result.current.mobileInspectorOpen).toBe(true);
    expect(editor.user.updateUserPreferences).toHaveBeenCalledWith({ isSnapMode: false });
    expect(editor.updateInstanceState).toHaveBeenCalledWith({ isGridMode: false });
  });

  it("applies planner documents and builds documents with or without an editor", () => {
    const { options, setPlanName, setActiveDocumentId } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([{ id: "shape:room", type: "geo", meta: { isRoomShell: true } }]);
    const document = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-446655440000",
      name: "  Executive Floor  ",
      unitSystem: "imperial",
      itemCount: 3,
    });

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyPlannerDocument(document);
    });

    expect(setPlanName).toHaveBeenCalledWith("Executive Floor");
    expect(setActiveDocumentId).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
    expect(result.current.unitSystem).toBe("ft-in");
    expect(loadPlannerDocumentIntoEditor).toHaveBeenCalledWith(editor, expect.any(Object));
    expect(result.current.currentStep).toBe("catalog");
    expect(result.current.canEnterCatalog).toBe(true);

    const withoutEditor = renderHook(() => usePlannerWorkspace(createHookOptions().options)).result;
    const bareDocument = withoutEditor.current.buildCurrentPlannerDocument();
    expect(bareDocument.name).toBe("North Bay");

    const fromEditor = result.current.buildCurrentPlannerDocument();
    expect(buildPlannerDocumentFromEditor).toHaveBeenCalled();
    expect(fromEditor.name).toBe("From Editor");
  });

  it("warns when dropping furniture before catalog step and places geo/image modules in catalog", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.handleDropFurniture({ name: "Early Chair", category: "Seating" });
    });

    expect(result.current.aiSuggestions).toEqual([
      expect.objectContaining({
        type: "warning",
        text: expect.stringContaining("Step 2"),
      }),
    ]);
    expect((editor.createShape as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
    });

    const geoProduct: CatalogProduct = {
      id: "prod-1",
      slug: "task-chair",
      name: "Task Chair",
      category: "Seating",
      specs: { dimensions: "120 x 60 cm" },
      metadata: { plannerSourceSlug: "chair-source", category: "Chairs" },
    };

    act(() => {
      result.current.handleDropFurniture(geoProduct);
    });

    expect(editor.createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "geo",
        props: expect.objectContaining({ w: 120, h: 60 }),
        meta: expect.objectContaining({
          productId: "prod-1",
          plannerSourceSlug: "chair-source",
          category: "Seating",
        }),
      }),
    );

    const imageProduct: CatalogProduct = {
      name: "Image Desk",
      category: "Workstations",
      flagship_image: "https://cdn.example.com/desk.png",
      specs: { dimensions: "1600 mm x 800 mm" },
      plannerSourceSlug: "desk-source",
    };

    act(() => {
      result.current.handleDropFurniture(imageProduct);
    });

    expect(editor.createAssets).toHaveBeenCalled();
    expect(editor.createShape).toHaveBeenCalledWith(expect.objectContaining({ type: "image" }));
  });

  it("parses dimension units via furniture drop metadata paths", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
    });

    const products: CatalogProduct[] = [
      { name: "Meters", category: "Workstations", specs: { dimensions: "2 m x 1.5 m" } },
      { name: "Inches", category: "Workstations", specs: { dimensions: '48" x 30"' } },
      { name: "Feet", category: "Workstations", specs: { dimensions: "4ft x 3ft" } },
      { name: "Invalid", category: "Workstations", specs: { dimensions: "abc" } },
      {
        name: "Metadata",
        metadata: { sourceSlug: "legacy-source", category: "Pods" },
      },
    ];

    act(() => {
      products.forEach((product) => result.current.handleDropFurniture(product));
    });

    const createdShapes = (editor.createShape as ReturnType<typeof vi.fn>).mock.calls.map(([shape]) => shape);
    expect(createdShapes[0]?.props).toMatchObject({ w: 200, h: 150 });
    expect(createdShapes[1]?.props?.w).toBeCloseTo(122, 0);
    expect(createdShapes[1]?.props?.h).toBeCloseTo(76, 0);
    expect(createdShapes[2]?.props).toMatchObject({ w: 30, h: 30 });
    expect(createdShapes[3]?.props).toMatchObject({ w: 120, h: 120 });
    expect(createdShapes[4]?.meta).toMatchObject({
      plannerSourceSlug: "legacy-source",
      category: "Pods",
    });
  });

  it("clears the canvas and applies single-zone and multi-zone presets", () => {
    const { options, setPlanName, setActiveDocumentId } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:existing", type: "geo", meta: { structureType: "wall-segment" } },
      { id: "shape:item", type: "geo", meta: { isPlannerItem: true, text: "Desk" } },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.handleClearAll();
    });

    expect(editor.deleteShapes).toHaveBeenCalled();
    expect(setActiveDocumentId).toHaveBeenCalledWith(null);
    expect(setPlanName).toHaveBeenCalledWith("Untitled plan");
    expect(result.current.currentStep).toBe("room");

    const singleZonePreset = result.current.roomPresets.find((preset) => preset.id === "cabin") as RoomPreset;

    act(() => {
      result.current.handleApplyRoomPreset(singleZonePreset);
    });

    expect(editor.createShape).toHaveBeenCalledWith(expect.objectContaining({ type: "line" }));
    expect(editor.zoomToSelection).toHaveBeenCalled();

    const multiZonePreset = result.current.roomPresets.find((preset) => preset.id === "cabin-workspace") as RoomPreset;

    act(() => {
      result.current.handleApplyRoomPreset(multiZonePreset);
    });

    const shapeTypes = (editor.createShape as ReturnType<typeof vi.fn>).mock.calls.map(([shape]) => shape.type);
    expect(shapeTypes).toContain("note");
    expect(shapeTypes.filter((type) => type === "geo").length).toBeGreaterThan(2);
  });

  it("runs structural tool handlers and advances the BOQ flow", () => {
    const { options, navigate, addBoqItem, clearBoqCart } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      {
        id: "shape:room",
        type: "geo",
        meta: { structureType: "room-shell" },
        props: { w: 90, h: 65 },
      },
      {
        id: "shape:desk",
        type: "geo",
        meta: { isPlannerItem: true, text: "Desk", productId: "desk-1" },
        props: { w: 16, h: 8 },
      },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.handleActivateWallTool();
      result.current.handleActivateBasicShapeTool();
      result.current.handleAddWallSegment();
      result.current.handleAddDoorOpening();
      editor.setSelectedIds(["shape:desk"]);
      result.current.handleResolveWallJoins();
    });

    expect(createPlannerWallSegment).toHaveBeenCalledWith(editor);
    expect(createPlannerDoorOpening).toHaveBeenCalledWith(editor);
    expect(resolvePlannerWallJoins).toHaveBeenCalled();

    act(() => {
      result.current.handleAdvanceBoqFlow();
    });
    expect(result.current.currentStep).toBe("catalog");

    act(() => {
      result.current.handleAdvanceBoqFlow();
    });
    expect(result.current.currentStep).toBe("measure");

    act(() => {
      result.current.handleAdvanceBoqFlow();
    });
    expect(result.current.currentStep).toBe("review");

    act(() => {
      result.current.handleAdvanceBoqFlow();
    });
    expect(clearBoqCart).toHaveBeenCalled();
    expect(addBoqItem).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/quote-cart");
  });

  it("syncs viewport, selection, zoom, and history handlers", async () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" }, props: { w: 90, h: 65 } },
      { id: "shape:desk", type: "geo", meta: { isPlannerItem: true, text: "Desk" }, props: { w: 12, h: 8 } },
    ]);

    readPlannerSelectionDimensions
      .mockReturnValueOnce({
        shapeId: "shape:desk",
        shapeName: "Desk",
        mode: "box",
        widthMm: 1200,
        heightMm: 800,
      })
      .mockReturnValueOnce({
        shapeId: "shape:desk",
        shapeName: "Desk",
        mode: "box",
        widthMm: 1200,
        heightMm: 800,
      })
      .mockReturnValue({
        shapeId: "shape:desk",
        shapeName: "Desk",
        mode: "line",
        widthMm: 1400,
        heightMm: null,
      });

    act(() => {
      result.current.handleMount(editor as never);
    });

    await waitFor(() => expect(editor.store.listen).toHaveBeenCalled());

    act(() => {
      editor.setSelectedIds(["shape:desk"]);
    });

    act(() => {
      const viewportCallback = editor.store.listen.mock.calls[0]?.[0] as (() => void) | undefined;
      viewportCallback?.();
    });

    expect(result.current.hasSelection).toBe(true);
    expect(result.current.zoomPercent).toBe(100);
    expect(result.current.selectionDimensions?.widthMm).toBe(1200);

    act(() => {
      result.current.adjustZoom(1.5);
      result.current.handleUndo();
      result.current.handleRedo();
      result.current.handleFitToDrawing();
      result.current.handleFitToSelection();
      result.current.handleDuplicateSelection();
      result.current.handleDeleteSelection();
      result.current.handleDeselectSelection();
      result.current.handleAlignSelection("left");
      result.current.handleDistributeSelection("horizontal");
    });

    readPlannerSelectionDimensions.mockReturnValue({
      shapeId: "shape:desk",
      shapeName: "Desk",
      mode: "line",
      widthMm: 1400,
      heightMm: null,
    });
    updatePlannerSelectionDimensions.mockReturnValue(true);

    act(() => {
      const viewportCallback = editor.store.listen.mock.calls[0]?.[0] as (() => void) | undefined;
      viewportCallback?.();
      result.current.handleUpdateSelectionDimensions({ widthMm: 1500 });
    });

    expect(editor.setCamera).toHaveBeenCalled();
    expect(editor.undo).toHaveBeenCalled();
    expect(editor.redo).toHaveBeenCalled();
    expect(editor.zoomToFit).toHaveBeenCalled();
    expect(editor.zoomToSelection).toHaveBeenCalled();
    expect(editor.selectNone).toHaveBeenCalled();
    expect(editor.duplicateShapes).toHaveBeenCalled();
    expect(editor.deleteShapes).toHaveBeenCalled();
    expect(alignPlannerSelection).toHaveBeenCalled();
    expect(distributePlannerSelection).toHaveBeenCalled();
    expect(updatePlannerSelectionDimensions).toHaveBeenCalled();
    expect(resolvePlannerWallJoins).toHaveBeenCalledWith(editor, ["shape:desk"]);
  });

  it("builds AI suggestions from compliance warnings, density, and review state", () => {
    runPlannerComplianceCheck.mockReturnValueOnce(["CRITICAL clearance breach", "Minor overlap"]);
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
      ...Array.from({ length: 6 }, (_, index) => ({
        id: `shape:item-${index}`,
        type: "geo",
        meta: { isPlannerItem: true, text: `Item ${index}` },
        props: { w: 12, h: 8 },
      })),
    ]);

    act(() => {
      result.current.handleMount(editor as never);
      result.current.applyStepMode("review", { force: true });
    });

    const suggestionTexts = result.current.aiSuggestions.map((entry) => entry.text);
    expect(suggestionTexts).toContain("CRITICAL clearance breach");
    expect(suggestionTexts.some((text) => text.includes("BOQ enquiry"))).toBe(true);
  });

  it("covers additional parse, document, BOQ, and handler branches", () => {
    const { options, navigate } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
      {
        id: "shape:partial",
        type: "geo",
        meta: { isPlannerItem: true, text: "Partial", dimensions: "1000 x 800 mm" },
        props: { w: 10 },
      },
    ]);

    act(() => {
      result.current.applyPlannerDocument(
        createPlannerDocument({
          id: "550e8400-e29b-41d4-a716-446655440002",
          name: "Offline Apply",
          itemCount: 0,
        }),
      );
    });

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
    });

    const products: CatalogProduct[] = [
      { name: "Bad Numbers", category: "Workstations", specs: { dimensions: "0 x 10 mm" } },
      { name: "Explicit MM", category: "Workstations", specs: { dimensions: "500 mm x 400 mm" } },
      { name: "Apostrophe Feet", category: "Workstations", specs: { dimensions: "6' x 4'" } },
      { name: "Array Metadata", category: "Workstations", metadata: ["invalid"] },
    ];

    act(() => {
      products.forEach((product) => result.current.handleDropFurniture(product));
    });

    act(() => {
      result.current.applyStepMode("measure", { force: true });
    });

    expect(result.current.mobileInspectorOpen).toBe(false);

    editor.canUndo.mockReturnValue(false);
    editor.canRedo.mockReturnValue(false);

    act(() => {
      result.current.handleUndo();
      result.current.handleRedo();
      result.current.handleFitToSelection();
      result.current.handleAdvanceBoqFlow();
      result.current.handleAdvanceBoqFlow();
      result.current.handleAdvanceBoqFlow();
    });

    expect(editor.undo).not.toHaveBeenCalled();
    expect(editor.redo).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith("/quote-cart");

    updatePlannerSelectionDimensions.mockReturnValue(false);
    readPlannerSelectionDimensions.mockReturnValue({
      shapeId: "shape:partial",
      shapeName: "Partial",
      mode: "box",
      widthMm: 1000,
      heightMm: 800,
    });

    act(() => {
      result.current.handleUpdateSelectionDimensions({ widthMm: 1100 });
    });

    expect(resolvePlannerWallJoins).not.toHaveBeenCalledWith(editor, ["shape:partial"]);
  });

  it("builds healthy-density tips and uses single-zone preset dividers", () => {
    runPlannerComplianceCheck.mockReturnValue([]);
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor(
      Array.from({ length: 6 }, (_, index) => ({
        id: `shape:item-${index}`,
        type: "geo",
        meta: { isPlannerItem: true, text: `Item ${index}` },
        props: { w: 12, h: 8 },
      })),
    );

    act(() => {
      result.current.handleMount(editor as never);
    });

    expect(result.current.aiSuggestions.some((entry) => entry.text.includes("Healthy density"))).toBe(true);

    const cabinPreset = result.current.roomPresets.find((preset) => preset.id === "cabin")!;

    act(() => {
      result.current.handleApplyRoomPreset(cabinPreset);
    });

    const dividerShapes = (editor.createShape as ReturnType<typeof vi.fn>).mock.calls.filter(
      ([shape]) => shape.meta?.structureType === "wall",
    );
    expect(dividerShapes.length).toBe(0);
  });

  it("filters room-boundary selection and resolves wall joins without a selection", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      {
        id: ROOM_BOUNDARY_ID,
        type: "line",
        meta: { isRoomShell: true },
        props: { points: {} },
      },
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
      editor.setSelectedIds([ROOM_BOUNDARY_ID]);
      result.current.handleDuplicateSelection();
      result.current.handleResolveWallJoins();
      result.current.handleActivateWallTool();
      result.current.handleActivateBasicShapeTool();
    });

    expect(editor.duplicateShapes).not.toHaveBeenCalled();
    expect(resolvePlannerWallJoins).toHaveBeenCalled();
  });

  it("keeps desktop inspector closed on measure step and blocks flow without a room shell", () => {
    const { options } = createHookOptions({ mode: "desktop" });
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor();

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("measure", { force: true });
    });

    act(() => {
      result.current.handleAdvanceBoqFlow();
      result.current.handleAddWallSegment();
      result.current.handleAddDoorOpening();
    });

    expect(result.current.mobileInspectorOpen).toBe(false);
    expect(result.current.currentStep).toBe("measure");
    expect(createPlannerWallSegment).toHaveBeenCalled();
  });

  it("covers remaining handler early returns and catalog metadata fallbacks", () => {
    const { options, navigate } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
    });

    act(() => {
      result.current.handleDropFurniture({
        name: "Direct Slug",
        category: "Workstations",
        plannerSourceSlug: "direct-slug",
        specs: { dimensions: "120 x 60 cm" },
      } as CatalogProduct);
      result.current.handleDropFurniture({
        name: "Metadata Category",
        metadata: { category: "Pods" },
      } as CatalogProduct);
      result.current.handleAlignSelection("left");
      result.current.handleDistributeSelection("horizontal");
      result.current.handleUpdateSelectionDimensions({ widthMm: 1200 });
    });

    act(() => {
      result.current.applyStepMode("review", { force: true });
      result.current.handleAdvanceBoqFlow();
    });

    expect(editor.createShape).toHaveBeenCalled();
    expect(alignPlannerSelection).toHaveBeenCalled();
    expect(distributePlannerSelection).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalledWith("/quote-cart");
  });

  it("applies documents without an editor and skips furniture drops when unmounted", () => {
    const { options, setPlanName } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const document = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "Offline",
      itemCount: 0,
    });

    act(() => {
      result.current.applyPlannerDocument(document);
      result.current.handleDropFurniture({ name: "Ghost", category: "Seating" });
    });

    expect(setPlanName).toHaveBeenCalledWith("Offline");
    expect(loadPlannerDocumentIntoEditor).not.toHaveBeenCalled();
  });

  it("syncs BOQ fallbacks and debounces duplicate viewport updates", async () => {
    let pendingFrame: FrameRequestCallback | null = null;
    const cancelAnimationFrame = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      pendingFrame = cb;
      return 42;
    });
    vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

    const { options } = createHookOptions();
    const { result, unmount } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
      {
        id: "shape:item",
        type: "geo",
        meta: { isPlannerItem: true, dimensions: "900 x 600 mm" },
        props: { w: 12 },
      },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    await waitFor(() => expect(editor.store.listen).toHaveBeenCalled());

    expect(result.current.boqItems[0]?.name).toBe("Custom Module");
    expect(result.current.boqItems[0]?.dimensions).toBe("900 x 600 mm");
    expect(pendingFrame).not.toBeNull();

    const viewportCallback = editor.store.listen.mock.calls.find(([, opts]) => !opts)?.[0] as
      | (() => void)
      | undefined;

    act(() => {
      viewportCallback?.();
    });

    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
  });

  it("covers review mobile mode, BOQ guards, and remaining workspace branches", () => {
    const { options, navigate } = createHookOptions({ mode: "mobile", activeDocumentId: null });
    const { result } = renderHook(() => usePlannerWorkspace(options));
    const editor = createMockEditor([
      { id: "shape:room", type: "geo", meta: { structureType: "room-shell" } },
      {
        id: "shape:dim",
        type: "line",
        meta: { isRoomDimension: true },
        props: { points: {} },
      },
      {
        id: "shape:partial",
        type: "geo",
        meta: { isPlannerItem: true, text: "Partial", dimensions: "800 mm" },
        props: { w: 8 },
      },
    ]);

    act(() => {
      result.current.handleMount(editor as never);
    });

    act(() => {
      result.current.applyStepMode("review", { force: true });
    });

    expect(result.current.mobileInspectorOpen).toBe(true);
    expect(result.current.boqItems[0]?.dimensions).toBe("800 mm");

    act(() => {
      result.current.applyStepMode("catalog", { force: true });
    });

    act(() => {
      result.current.handleAdvanceBoqFlow();
      result.current.handleAddDoorOpening();
      editor.setSelectedIds(["shape:dim"]);
      result.current.handleDeleteSelection();
      result.current.handleFitToSelection();
    });

    expect(result.current.currentStep).toBe("measure");
    expect(createPlannerDoorOpening).toHaveBeenCalled();
    expect(editor.deleteShapes).not.toHaveBeenCalled();
    expect(editor.zoomToSelection).not.toHaveBeenCalled();

    act(() => {
      editor.deleteShapes(["shape:partial"]);
      result.current.applyStepMode("review", { force: true });
      result.current.handleAdvanceBoqFlow();
    });

    expect(navigate).not.toHaveBeenCalledWith("/quote-cart");

    const bareHook = renderHook(() =>
      usePlannerWorkspace(createHookOptions({ activeDocumentId: null }).options),
    );
    const bareDocument = bareHook.result.current.buildCurrentPlannerDocument();
    expect(bareDocument.unitSystem).toBe("metric");
    expect(bareDocument.id).toBeUndefined();

    const sameDimensions = {
      shapeId: "shape:desk",
      shapeName: "Desk",
      mode: "box" as const,
      widthMm: 1200,
      heightMm: 800,
    };
    readPlannerSelectionDimensions.mockReturnValue(sameDimensions);
    updatePlannerSelectionDimensions.mockReturnValue(false);

    act(() => {
      editor.setSelectedIds(["shape:partial"]);
      const viewportCallback = editor.store.listen.mock.calls.find(([, opts]) => !opts)?.[0] as
        | (() => void)
        | undefined;
      viewportCallback?.();
      viewportCallback?.();
      result.current.handleUpdateSelectionDimensions({ widthMm: 1200 });
    });

    expect(resolvePlannerWallJoins).not.toHaveBeenCalled();
  });

  it("no-ops editor actions when the editor is missing or selection is empty", () => {
    const { options } = createHookOptions();
    const { result } = renderHook(() => usePlannerWorkspace(options));

    act(() => {
      result.current.selectDrawingTool("line");
      result.current.handleClearAll();
      result.current.handleApplyRoomPreset(result.current.roomPresets[0]!);
      result.current.handleAddWallSegment();
      result.current.handleAdvanceBoqFlow();
      result.current.adjustZoom(2);
      result.current.handleUndo();
      result.current.handleFitToSelection();
      result.current.handleDuplicateSelection();
      result.current.handleAlignSelection("left");
      result.current.handleUpdateSelectionDimensions({ widthMm: 1000 });
    });

    expect(configureWallTool).not.toHaveBeenCalled();
  });
});