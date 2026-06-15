import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
    constructor(_d?: string) {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    rect() {}
  } as typeof Path2D;
}

const updateShape = vi.fn();
let mockUnitSystem: "metric" | "imperial" = "metric";

vi.mock("tldraw", () => ({
  useEditor: () => ({
    getCurrentPageShapes: () => [],
    updateShape,
  }),
  useValue: (_key: string, fn: () => unknown) => fn(),
}));

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/workspaceStore", () => ({
  usePlannerWorkspaceStore: (selector: (s: { unitSystem: string; blueprint: { mmPerUnit: number } }) => unknown) =>
    selector({ unitSystem: mockUnitSystem, blueprint: { mmPerUnit: 10 } }),
}));

import { PlannerWallShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerWallShapeUtil";
import { PlannerRoomShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerRoomShapeUtil";
import { PlannerMeasurementShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerMeasurementShapeUtil";
import { createMockEditor } from "./planner-tldraw-mockEditor";

describe("editable dimension label interactions", () => {
  const editor = createMockEditor();
  let promptMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUnitSystem = "metric";
    updateShape.mockClear();
    promptMock = vi.fn();
    vi.stubGlobal("prompt", promptMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PlannerWallShapeUtil label accepts valid meter input", () => {
    const util = new PlannerWallShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), endX: 1200, showDimensions: true };
    const shape = { id: "w-edit", type: "planner-wall", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);

    promptMock.mockReturnValueOnce("12.00");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit wall length"]')!);
    expect(updateShape).toHaveBeenCalledWith(
      expect.objectContaining({ id: "w-edit", type: "planner-wall" }),
    );

    updateShape.mockClear();
    promptMock.mockReturnValueOnce(null);
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit wall length"]')!);
    expect(updateShape).not.toHaveBeenCalled();

    promptMock.mockReturnValueOnce("not-a-number");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit wall length"]')!);
    expect(updateShape).not.toHaveBeenCalled();

    promptMock.mockReturnValueOnce("-2");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit wall length"]')!);
    expect(updateShape).not.toHaveBeenCalled();
  });

  it("PlannerRoomShapeUtil label handles cancel and invalid dimension input", () => {
    const util = new PlannerRoomShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), showArea: true, areaSqm: 12 };
    const shape = { id: "r-edit", type: "planner-room", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);

    promptMock.mockReturnValueOnce("garbage input");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit room dimensions"]')!);
    expect(updateShape).not.toHaveBeenCalled();

    promptMock.mockReturnValueOnce(null);
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit room dimensions"]')!);
    expect(updateShape).not.toHaveBeenCalled();

    mockUnitSystem = "imperial";
    const { container: imperialEl } = render(<svg>{util.component(shape)}</svg>);
    expect(imperialEl.textContent).toContain("ft²");
  });

  it("PlannerMeasurementShapeUtil label accepts valid meter input", () => {
    const util = new PlannerMeasurementShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), endX: 500, endY: 0, showValue: true };
    const shape = { id: "m-edit", type: "planner-measurement", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);

    promptMock.mockReturnValueOnce("6.00");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit measurement length"]')!);
    expect(updateShape).toHaveBeenCalled();

    updateShape.mockClear();
    promptMock.mockReturnValueOnce("");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit measurement length"]')!);
    expect(updateShape).not.toHaveBeenCalled();

    promptMock.mockReturnValueOnce("0");
    fireEvent.doubleClick(container.querySelector('[aria-label="Edit measurement length"]')!);
    expect(updateShape).not.toHaveBeenCalled();
  });
});