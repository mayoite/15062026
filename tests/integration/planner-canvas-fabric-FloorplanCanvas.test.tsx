import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const setLayerVisibility = vi.fn();
const setZoom = vi.fn();
const registerCanvasApi = vi.fn();

const layerVisible = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
};

vi.mock("@/features/planner/store/workspaceStore", () => ({
  usePlannerWorkspaceStore: (selector: (state: { layerVisible: typeof layerVisible }) => unknown) =>
    selector({ layerVisible }),
}));

const init = vi.fn();
const dispose = vi.fn();
const onKeyDown = vi.fn();
const onKeyUp = vi.fn();
const fitToStage = vi.fn(() => 96);
const recalcOffset = vi.fn();

vi.mock("@/features/planner/canvas-fabric/hooks/floorplanCanvas", () => ({
  createFloorplanCanvasApi: vi.fn(() => ({
    init,
    onKeyDown,
    onKeyUp,
    dispose,
    undo: vi.fn(),
    redo: vi.fn(),
    copy: vi.fn(),
    paste: vi.fn(),
    delete: vi.fn(),
    rotate: vi.fn(),
    group: vi.fn(),
    ungroup: vi.fn(),
    placeInCenter: vi.fn(),
    arrange: vi.fn(),
    setZoom: vi.fn(),
    setGridVisible: vi.fn(),
    exportState: vi.fn(() => null),
    importState: vi.fn(async () => undefined),
    exportSvg: vi.fn(() => null),
    exportPngBlob: vi.fn(async () => null),
    saveAs: vi.fn(),
    handleInsert: vi.fn(),
    editRoom: vi.fn(),
    cancelRoomEdition: vi.fn(),
    setDrawTool: vi.fn(),
    setDrawColor: vi.fn(),
    setDrawFillColor: vi.fn(),
    applyStrokeToSelection: vi.fn(),
    applyFillToSelection: vi.fn(),
    setContextMenuListener: vi.fn(),
    fitToStage,
    recalcOffset,
    setLayerVisibility: vi.fn(),
  })),
}));

vi.mock("@/features/planner/canvas-fabric/context/FloorplanContext", async () => {
  const actual = await vi.importActual<
    Record<string, unknown>
  >("@/features/planner/canvas-fabric/context/FloorplanContext");
  return {
    ...actual,
    useFloorplan: () => ({
      roomEdit: false,
      zoom: 100,
      gridEnabled: true,
      states: ["{}"],
      redoStates: [],
      roomEditStates: [],
      roomEditRedoStates: [],
      defaultChair: null,
      selections: [],
      ungroupable: false,
      drawTool: "select",
      drawColor: "#111111",
      drawFillColor: "transparent",
      contextMenu: null,
      setSelections: vi.fn(),
      setUngroupable: vi.fn(),
      setZoom,
      setGridEnabled: vi.fn(),
      setStates: vi.fn(),
      setRedoStates: vi.fn(),
      setRoomEditStates: vi.fn(),
      setRoomEditRedoStates: vi.fn(),
      pushState: vi.fn(),
      insertObject: vi.fn(),
      exportDraft: vi.fn(() => null),
      importDraft: vi.fn(async () => undefined),
      exportSvg: vi.fn(() => null),
      exportPngBlob: vi.fn(async () => null),
      performOperation: vi.fn(),
      editRoom: vi.fn(),
      endEditRoom: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      clone: vi.fn(),
      copy: vi.fn(),
      paste: vi.fn(),
      deleteSelection: vi.fn(),
      rotateClockWise: vi.fn(),
      rotateAntiClockWise: vi.fn(),
      group: vi.fn(),
      ungroup: vi.fn(),
      placeInCenter: vi.fn(),
      arrange: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleGrid: vi.fn(),
      setDrawTool: vi.fn(),
      setDrawColor: vi.fn(),
      setDrawFillColor: vi.fn(),
      closeContextMenu: vi.fn(),
      registerCanvasApi,
      refitCanvas: vi.fn(),
      setLayerVisibility,
      setDefaultChair: vi.fn(),
    }),
  };
});

import { FloorplanCanvas } from "@/features/planner/canvas-fabric/FloorplanCanvas";

describe("FloorplanCanvas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("initializes the canvas api and registers it on mount, then fits the stage", () => {
    vi.useFakeTimers();
    const { container } = render(<FloorplanCanvas />);

    expect(init).toHaveBeenCalledTimes(1);
    expect(registerCanvasApi).toHaveBeenCalledTimes(1);
    expect(registerCanvasApi.mock.calls[0]?.[0]).toBeTruthy();

    // The component renders its own .canvas-wrap; happy-dom reports clientWidth 0,
    // so override it on the rendered element so applyFit proceeds past the guard.
    const renderedWrap = container.querySelector(".canvas-wrap") as HTMLElement;
    Object.defineProperty(renderedWrap, "clientWidth", { value: 900, configurable: true });
    Object.defineProperty(renderedWrap, "clientHeight", { value: 700, configurable: true });

    // Flush the requestAnimationFrame that schedules applyFit.
    act(() => {
      vi.runAllTimers();
    });
    expect(fitToStage).toHaveBeenCalled();
    expect(setZoom).toHaveBeenCalledWith(96);
    expect(recalcOffset).toHaveBeenCalled();
  });

  it("binds global keydown/keyup listeners that delegate to the api", () => {
    const { unmount } = render(<FloorplanCanvas />);

    fireEvent.keyDown(document, { key: "Delete" });
    expect(onKeyDown).toHaveBeenCalled();

    fireEvent.keyUp(document, { key: "Control" });
    expect(onKeyUp).toHaveBeenCalled();

    unmount();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(registerCanvasApi).toHaveBeenLastCalledWith(null);
  });

  it("syncs layer visibility from the workspace store on mount", () => {
    render(<FloorplanCanvas />);
    expect(setLayerVisibility).toHaveBeenCalledWith(layerVisible);
  });

  it("renders a canvas element inside the canvas-wrap host", () => {
    const { container } = render(<FloorplanCanvas />);
    expect(container.querySelector(".canvas-wrap")).not.toBeNull();
    expect(container.querySelector("canvas#main")).not.toBeNull();
  });

  it("does not crash when fitToStage cannot find a wrap (returns early)", () => {
    expect(() => render(<FloorplanCanvas />)).not.toThrow();
  });
});
