import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// happy-dom lacks Path2D — polyfill for getIndicatorPath tests
if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
    constructor(_d?: string) {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    rect() {}
  } as typeof Path2D;
}

vi.mock("tldraw", () => ({
  useEditor: () => ({
    getCurrentPageShapes: () => [],
  }),
  useValue: (_key: string, fn: () => unknown) => fn(),
}));

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

vi.mock("@/features/planner/store/workspaceStore", () => ({
  usePlannerWorkspaceStore: (selector: (s: { unitSystem: string; blueprint: { mmPerUnit: number } }) => unknown) =>
    selector({ unitSystem: "metric", blueprint: { mmPerUnit: 10 } }),
}));

import { ALL_SHAPE_UTILS } from "@/features/planner/tldraw/shapes/shapeUtils";
import { PlannerWallShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerWallShapeUtil";
import { PlannerRoomShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerRoomShapeUtil";
import { PlannerFurnitureShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerFurnitureShapeUtil";
import { PlannerDoorShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerDoorShapeUtil";
import { PlannerWindowShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerWindowShapeUtil";
import { PlannerZoneShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerZoneShapeUtil";
import { PlannerMeasurementShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerMeasurementShapeUtil";
import { createMockEditor } from "./planner-tldraw-mockEditor";

describe("shape utils registry", () => {
  it("ALL_SHAPE_UTILS contains seven shape util classes", () => {
    expect(ALL_SHAPE_UTILS).toHaveLength(7);
    expect(ALL_SHAPE_UTILS).toContain(PlannerWallShapeUtil);
    expect(ALL_SHAPE_UTILS).toContain(PlannerMeasurementShapeUtil);
  });
});

describe("PlannerWallShapeUtil", () => {
  const editor = createMockEditor();
  const util = new PlannerWallShapeUtil(editor as never);

  it("getDefaultProps returns wall defaults", () => {
    const props = util.getDefaultProps();
    expect(props.material).toBe("drywall");
    expect(props.endX).toBeGreaterThan(props.startX);
  });

  it("getGeometry returns polygon for wall segment", () => {
    const shape = {
      id: "w1",
      type: "planner-wall",
      x: 0,
      y: 0,
      rotation: 0,
      props: util.getDefaultProps(),
    } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.points.length).toBe(4);
    expect(geometry.isFilled).toBe(true);
  });

  it("getIndicatorPath returns Path2D", () => {
    const shape = {
      id: "w1",
      type: "planner-wall",
      x: 0,
      y: 0,
      rotation: 0,
      props: util.getDefaultProps(),
    } as never;
    expect(util.getIndicatorPath(shape)).toBeTruthy();
  });

  it("toSvg exports a solid wall body with concrete colors", () => {
    const shape = {
      id: "w-svg",
      type: "planner-wall",
      x: 0,
      y: 0,
      rotation: 0,
      props: { ...util.getDefaultProps(), endX: 180, thickness: 12, showDimensions: false },
    } as never;
    const { container } = render(<svg>{util.toSvg?.(shape, {} as never)}</svg>);
    const path = container.querySelector("path");
    expect(path).toBeTruthy();
    expect(path?.getAttribute("fill")).toBe("#ffffff");
    expect(path?.getAttribute("d")).toContain("6.00");
  });
});

describe("other planner shape utils", () => {
  const editor = createMockEditor();

  it("PlannerRoomShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerRoomShapeUtil(editor as never);
    const props = util.getDefaultProps();
    expect(props.roomType).toBe("office");
    const shape = { id: "r1", type: "planner-room", x: 0, y: 0, rotation: 0, props } as never;
    expect(util.getGeometry(shape).points.length).toBeGreaterThan(2);
    expect(util.getIndicatorPath(shape)).toBeTruthy();
  });

  it("PlannerFurnitureShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerFurnitureShapeUtil(editor as never);
    const props = util.getDefaultProps();
    const shape = { id: "f1", type: "planner-furniture", x: 0, y: 0, rotation: 0, props } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.width).toBeGreaterThan(0);
    expect(geometry.height).toBeGreaterThan(0);
  });

  it("PlannerFurnitureShapeUtil toSvg exports a group with concrete colors", () => {
    const util = new PlannerFurnitureShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), productName: "Desk", showLabel: true };
    const shape = { id: "f-svg", type: "planner-furniture", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.toSvg?.(shape, {} as never)}</svg>);
    expect(container.querySelector("g")).toBeTruthy();
    expect(container.querySelectorAll("svg").length).toBe(1);
    expect(container.querySelector("rect")).toBeTruthy();
    expect(container.querySelector("text")?.textContent).toContain("Desk");
    expect(container.innerHTML).not.toContain("var(--");
  });

  it("PlannerDoorShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerDoorShapeUtil(editor as never);
    const props = util.getDefaultProps();
    const shape = { id: "d1", type: "planner-door", x: 0, y: 0, rotation: 0, props } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.width).toBeGreaterThan(0);
  });

  it("PlannerWindowShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerWindowShapeUtil(editor as never);
    const props = util.getDefaultProps();
    const shape = { id: "win1", type: "planner-window", x: 0, y: 0, rotation: 0, props } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.width).toBeGreaterThan(0);
  });

  it("PlannerZoneShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerZoneShapeUtil(editor as never);
    const props = util.getDefaultProps();
    const shape = { id: "z1", type: "planner-zone", x: 0, y: 0, rotation: 0, props } as never;
    expect(util.getGeometry(shape).points.length).toBeGreaterThan(2);
    expect(util.getIndicatorPath(shape)).toBeTruthy();
  });

  it("PlannerMeasurementShapeUtil getDefaultProps and geometry", () => {
    const util = new PlannerMeasurementShapeUtil(editor as never);
    const props = util.getDefaultProps();
    const shape = { id: "m1", type: "planner-measurement", x: 0, y: 0, rotation: 0, props } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.width).toBeGreaterThan(0);
    expect(util.getIndicatorPath(shape)).toBeTruthy();
  });

  it("shape util component() renders SVG for each type", () => {
    const utils = [
      new PlannerWallShapeUtil(editor as never),
      new PlannerRoomShapeUtil(editor as never),
      new PlannerFurnitureShapeUtil(editor as never),
      new PlannerDoorShapeUtil(editor as never),
      new PlannerWindowShapeUtil(editor as never),
      new PlannerZoneShapeUtil(editor as never),
      new PlannerMeasurementShapeUtil(editor as never),
    ];

    for (const util of utils) {
      const props = util.getDefaultProps();
      const shape = { id: "s", type: "test", x: 0, y: 0, rotation: 0, props } as never;
      const { container } = render(<svg>{util.component(shape)}</svg>);
      expect(container.querySelector("svg")).toBeTruthy();
    }
  });
});
