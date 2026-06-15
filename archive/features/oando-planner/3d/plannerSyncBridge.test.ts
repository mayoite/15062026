import { activatePlannerTool, ZUSTAND_TOOL_TO_TLDRAW } from "./plannerSyncBridge";

describe("plannerSyncBridge", () => {
  const makeEditor = (currentToolId = "select") => ({
    getCurrentToolId: jest.fn(() => currentToolId),
    setCurrentTool: jest.fn(),
    updateInstanceState: jest.fn(),
  });

  it("maps only live planner tools to tldraw tool ids", () => {
    expect(ZUSTAND_TOOL_TO_TLDRAW).toEqual({
      select: "select",
      pan: "hand",
      eraser: "eraser",
      wall: "planner-wall",
      room: "planner-room",
      door: "planner-door-window",
      window: "planner-door-window",
      furniture: "planner-furniture",
      measure: "planner-measurement",
      zone: "planner-zone",
    });
  });

  it("falls back to select for dead or unknown tools", () => {
    const editor = makeEditor("planner-wall");

    activatePlannerTool(editor as never, "text");
    activatePlannerTool(editor as never, "column");
    activatePlannerTool(editor as never, "stair");
    activatePlannerTool(editor as never, "electrical");
    activatePlannerTool(editor as never, "made-up-tool");

    expect(editor.setCurrentTool).toHaveBeenNthCalledWith(1, "select");
    expect(editor.setCurrentTool).toHaveBeenNthCalledWith(2, "select");
    expect(editor.setCurrentTool).toHaveBeenNthCalledWith(3, "select");
    expect(editor.setCurrentTool).toHaveBeenNthCalledWith(4, "select");
    expect(editor.setCurrentTool).toHaveBeenNthCalledWith(5, "select");
  });

  it("does not re-set the same active tool", () => {
    const editor = makeEditor("hand");

    activatePlannerTool(editor as never, "pan");

    expect(editor.setCurrentTool).not.toHaveBeenCalled();
  });
});
