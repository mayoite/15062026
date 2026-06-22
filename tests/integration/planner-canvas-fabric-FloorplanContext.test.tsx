import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React, { type ReactNode } from "react";

import {
  FloorplanProvider,
  useFloorplan,
  type FloorplanCanvasApi,
  type FloorplanOperation,
} from "@/features/planner/canvas-fabric/context/FloorplanContext";

const DEFAULT_LAYERS = {
  underlay: true,
  walls: true,
  rooms: true,
  zones: true,
  furniture: true,
  measurements: true,
} as const;

function makeMockApi(overrides: Partial<FloorplanCanvasApi> = {}): FloorplanCanvasApi {
  return {
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
    fitToStage: vi.fn(() => 100),
    fitToContent: vi.fn(() => 100),
    recalcOffset: vi.fn(),
    setLayerVisibility: vi.fn(),
    resizeObject: vi.fn(),
    clientToSceneUnits: vi.fn(() => null),
    ...overrides,
  };
}

function setupHook(_initialApi: FloorplanCanvasApi | null = null) {
  const apiRef = React.createRef<FloorplanCanvasApi>();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <FloorplanProvider>{children}</FloorplanProvider>
  );
  const result = renderHook(() => useFloorplan(), { wrapper });
  return { ...result, apiRef };
}

describe("FloorplanContext", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when useFloorplan is used without a provider", () => {
    // Suppress the expected error log.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useFloorplan())).toThrow(
      "useFloorplan must be used within FloorplanProvider",
    );
    spy.mockRestore();
  });

  it("exposes default state values", () => {
    const { result } = setupHook();
    expect(result.current.roomEdit).toBe(false);
    expect(result.current.zoom).toBe(100);
    expect(result.current.gridEnabled).toBe(true);
    expect(result.current.drawTool).toBe("select");
    expect(result.current.states).toEqual([]);
    expect(result.current.selections).toEqual([]);
  });

  it("registerCanvasApi pushes initial draw settings into the api and clears context menu on null", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
    });
    expect(api.setDrawTool).toHaveBeenCalledWith("select");
    expect(api.setDrawColor).toHaveBeenCalledWith(expect.any(String));
    expect(api.setDrawFillColor).toHaveBeenCalledWith("transparent");
    expect(api.setContextMenuListener).toHaveBeenCalled();

    act(() => {
      result.current.registerCanvasApi(null);
    });
    expect(result.current.contextMenu).toBeNull();
  });

  it("performOperation dispatches each operation to the api", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
    });

    const cases: Array<[FloorplanOperation, keyof FloorplanCanvasApi]> = [
      ["UNDO", "undo"],
      ["REDO", "redo"],
      ["COPY", "copy"],
      ["PASTE", "paste"],
      ["DELETE", "delete"],
      ["ROTATE", "rotate"],
      ["ROTATE_ANTI", "rotate"],
      ["GROUP", "group"],
      ["UNGROUP", "ungroup"],
      ["HORIZONTAL", "placeInCenter"],
      ["VERTICAL", "placeInCenter"],
      ["LEFT", "arrange"],
      ["CENTER", "arrange"],
      ["PNG", "saveAs"],
      ["SVG", "saveAs"],
    ];
    for (const [operation, _method] of cases) {
      act(() => result.current.performOperation(operation));
    }
    expect(api.undo).toHaveBeenCalled();
    expect(api.redo).toHaveBeenCalled();
    expect(api.copy).toHaveBeenCalled();
    expect(api.paste).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalled();
    expect(api.rotate).toHaveBeenCalledWith(true);
    expect(api.rotate).toHaveBeenCalledWith(false);
    expect(api.group).toHaveBeenCalled();
    expect(api.ungroup).toHaveBeenCalled();
    expect(api.placeInCenter).toHaveBeenCalledWith("HORIZONTAL");
    expect(api.placeInCenter).toHaveBeenCalledWith("VERTICAL");
    expect(api.arrange).toHaveBeenCalledWith("LEFT");
    expect(api.arrange).toHaveBeenCalledWith("CENTER");
    expect(api.saveAs).toHaveBeenCalledWith("PNG");
    expect(api.saveAs).toHaveBeenCalledWith("SVG");
  });

  it("performOperation is a no-op when no api is registered", () => {
    const { result } = setupHook();
    expect(() =>
      act(() => result.current.performOperation("UNDO")),
    ).not.toThrow();
  });

  it("undo guards prevent calling api when only a single state remains", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
      result.current.setStates(["only-state"]);
    });
    act(() => result.current.undo());
    expect(api.undo).not.toHaveBeenCalled();
  });

  it("redo guards prevent calling api when there are no redo states", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
    });
    act(() => result.current.redo());
    expect(api.redo).not.toHaveBeenCalled();
  });

  it("undo/redo call through to the api once multiple states exist", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
      result.current.setStates(["a", "b"]);
      result.current.setRedoStates(["r"]);
    });
    act(() => result.current.undo());
    expect(api.undo).toHaveBeenCalled();
    act(() => result.current.redo());
    expect(api.redo).toHaveBeenCalled();
  });

  it("pushState writes to room-edit stacks while in room edit mode", () => {
    const { result } = setupHook();
    act(() => result.current.editRoom());
    // Re-render so pushState captures the updated roomEdit=true closure.
    act(() => result.current.pushState("re-1"));
    act(() => result.current.pushState("re-2"));
    expect(result.current.roomEdit).toBe(true);
    expect(result.current.roomEditStates).toEqual(["re-1", "re-2"]);
    expect(result.current.roomEditRedoStates).toEqual([]);
    expect(result.current.states).toEqual([]);
  });

  it("pushState writes to the normal stacks when not in room edit", () => {
    const { result } = setupHook();
    act(() => {
      result.current.pushState("s-1");
      result.current.pushState("s-2");
    });
    expect(result.current.states).toEqual(["s-1", "s-2"]);
    expect(result.current.redoStates).toEqual([]);
  });

  it("zoomIn/zoomOut clamp within 20-150 and delegate to api.setZoom", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));

    act(() => result.current.zoomIn());
    expect(result.current.zoom).toBe(110);
    expect(api.setZoom).toHaveBeenCalledWith(110);

    act(() => result.current.zoomOut());
    expect(result.current.zoom).toBe(100);

    // Clamp high.
    act(() => {
      for (let i = 0; i < 10; i++) result.current.zoomIn();
    });
    expect(result.current.zoom).toBe(150);

    // Clamp low.
    act(() => {
      for (let i = 0; i < 20; i++) result.current.zoomOut();
    });
    expect(result.current.zoom).toBe(20);
  });

  it("setZoom updates state and delegates to the api", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.setZoom(73));
    expect(result.current.zoom).toBe(73);
    expect(api.setZoom).toHaveBeenCalledWith(73);
  });

  it("toggleGrid flips gridEnabled and schedules api.setGridVisible", () => {
    vi.useFakeTimers();
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.toggleGrid());
    expect(result.current.gridEnabled).toBe(false);
    // setGridEnabled defers the api call via setTimeout(0).
    expect(api.setGridVisible).not.toHaveBeenCalled();
    act(() => {
      vi.runAllTimers();
    });
    expect(api.setGridVisible).toHaveBeenCalledWith(false);
  });

  it("setGridEnabled updates state and schedules the api call", () => {
    vi.useFakeTimers();
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.setGridEnabled(false));
    expect(result.current.gridEnabled).toBe(false);
    act(() => vi.runAllTimers());
    expect(api.setGridVisible).toHaveBeenCalledWith(false);
  });

  it("setDrawTool/setDrawColor/setDrawFillColor update state and delegate to api", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));

    act(() => result.current.setDrawTool("line"));
    expect(result.current.drawTool).toBe("line");
    expect(api.setDrawTool).toHaveBeenCalledWith("line");

    act(() => result.current.setDrawColor("#ff0000"));
    expect(result.current.drawColor).toBe("#ff0000");
    expect(api.setDrawColor).toHaveBeenCalledWith("#ff0000");
    expect(api.applyStrokeToSelection).toHaveBeenCalledWith("#ff0000");

    act(() => result.current.setDrawFillColor("#00ff00"));
    expect(result.current.drawFillColor).toBe("#00ff00");
    expect(api.setDrawFillColor).toHaveBeenCalledWith("#00ff00");
    expect(api.applyFillToSelection).toHaveBeenCalledWith("#00ff00");
  });

  it("insertObject, exportDraft, exportSvg, exportPngBlob delegate to the api", async () => {
    const api = makeMockApi({
      exportState: vi.fn(() => "exported"),
      exportSvg: vi.fn(() => "<svg/>"),
      exportPngBlob: vi.fn(async () => new Blob(["png"], { type: "image/png" })),
    });
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));

    act(() => result.current.insertObject({ type: "ROOM", object: { width: 100 } }));
    expect(api.handleInsert).toHaveBeenCalledWith({ type: "ROOM", object: { width: 100 } });

    expect(result.current.exportDraft()).toBe("exported");
    expect(result.current.exportSvg()).toBe("<svg/>");
    await expect(result.current.exportPngBlob()).resolves.toBeInstanceOf(Blob);

    // Without an api the helpers return null.
    act(() => result.current.registerCanvasApi(null));
    expect(result.current.exportDraft()).toBeNull();
    expect(result.current.exportSvg()).toBeNull();
    await expect(result.current.exportPngBlob()).resolves.toBeNull();
  });

  it("importDraft resets selection/edit state and seeds states", async () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
      result.current.setSelections([{ id: "x" }]);
      result.current.setUngroupable(true);
      result.current.editRoom();
      result.current.setStates(["old"]);
    });
    await act(async () => {
      await result.current.importDraft("imported");
    });
    expect(api.importState).toHaveBeenCalledWith("imported");
    expect(result.current.selections).toEqual([]);
    expect(result.current.ungroupable).toBe(false);
    expect(result.current.roomEdit).toBe(false);
    expect(result.current.states).toEqual(["imported"]);
    expect(result.current.redoStates).toEqual([]);
    expect(result.current.roomEditStates).toEqual([]);
    expect(result.current.roomEditRedoStates).toEqual([]);
  });

  it("importDraft is a no-op without a registered api", async () => {
    const { result } = setupHook();
    await expect(act(async () => {
      await result.current.importDraft("ignored");
    })).resolves.toBeUndefined();
    expect(result.current.states).toEqual([]);
  });

  it("editRoom/endEditRoom toggle room edit and delegate to api", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));

    act(() => result.current.editRoom());
    expect(result.current.roomEdit).toBe(true);
    expect(result.current.drawTool).toBe("select");
    expect(api.editRoom).toHaveBeenCalled();

    act(() => result.current.endEditRoom());
    expect(result.current.roomEdit).toBe(false);
    expect(api.cancelRoomEdition).toHaveBeenCalled();
  });

  it("refitCanvas asks the api for fit + recalc and updates zoom", () => {
    const api = makeMockApi({ fitToContent: vi.fn(() => 84) });
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.refitCanvas());
    expect(api.fitToContent).toHaveBeenCalled();
    expect(api.recalcOffset).toHaveBeenCalled();
    expect(result.current.zoom).toBe(84);
  });

  it("refitCanvas is a no-op without an api", () => {
    const { result } = setupHook();
    expect(() => act(() => result.current.refitCanvas())).not.toThrow();
  });

  it("setLayerVisibility delegates to the api", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.setLayerVisibility({ ...DEFAULT_LAYERS, walls: false }));
    expect(api.setLayerVisibility).toHaveBeenCalledWith({
      ...DEFAULT_LAYERS,
      walls: false,
    });
  });

  it("clone/copy/paste/deleteSelection delegate via performOperation", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => {
      result.current.registerCanvasApi(api);
      result.current.setSelections([{ id: "sel" }]);
    });
    act(() => result.current.copy());
    expect(api.copy).toHaveBeenCalled();
    act(() => result.current.paste());
    expect(api.paste).toHaveBeenCalled();
    act(() => result.current.deleteSelection());
    expect(api.delete).toHaveBeenCalled();
    // delete is gated on having a selection — clear and re-render first.
    act(() => result.current.setSelections([]));
    act(() => result.current.deleteSelection());
    expect(api.delete).toHaveBeenCalledTimes(1);
  });

  it("rotate/group/ungroup/placeInCenter/arrange delegate via performOperation", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.rotateClockWise());
    expect(api.rotate).toHaveBeenCalledWith(true);
    act(() => result.current.rotateAntiClockWise());
    expect(api.rotate).toHaveBeenCalledWith(false);
    act(() => result.current.group());
    expect(api.group).toHaveBeenCalled();
    act(() => result.current.ungroup());
    expect(api.ungroup).toHaveBeenCalled();
    act(() => result.current.placeInCenter("HORIZONTAL"));
    expect(api.placeInCenter).toHaveBeenCalledWith("HORIZONTAL");
    act(() => result.current.arrange("TOP"));
    expect(api.arrange).toHaveBeenCalledWith("TOP");
  });

  it("closeContextMenu clears the context menu", () => {
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    // The api listener is wired on register; simulate a menu open via the listener.
    const listener = api.setContextMenuListener.mock.calls[0]?.[0] as
      | ((state: { clientX: number; clientY: number; target: unknown } | null) => void)
      | undefined;
    act(() => listener?.({ clientX: 10, clientY: 20, target: null }));
    expect(result.current.contextMenu).not.toBeNull();
    act(() => result.current.closeContextMenu());
    expect(result.current.contextMenu).toBeNull();
  });

  it("clone copies and schedules a paste", () => {
    vi.useFakeTimers();
    const api = makeMockApi();
    const { result } = setupHook();
    act(() => result.current.registerCanvasApi(api));
    act(() => result.current.clone());
    expect(api.copy).toHaveBeenCalled();
    expect(api.paste).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(100));
    expect(api.paste).toHaveBeenCalled();
  });

  it("renders children via the provider", () => {
    const Child = () => {
      const ctx = useFloorplan();
      return <div data-testid="zoom">{ctx.zoom}</div>;
    };
    render(
      <FloorplanProvider>
        <Child />
      </FloorplanProvider>,
    );
    expect(screen.getByTestId("zoom")).toHaveTextContent("100");
  });
});
