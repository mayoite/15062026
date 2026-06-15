import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

if (typeof globalThis.Path2D === "undefined") {
  globalThis.Path2D = class Path2D {
    constructor(_d?: string) {}
    moveTo() {}
    lineTo() {}
    closePath() {}
    rect() {}
  } as typeof Path2D;
}

let mockPageShapes: unknown[] = [];
let mockUnitSystem: "metric" | "imperial" = "metric";

vi.mock("tldraw", () => ({
  useEditor: () => ({
    getCurrentPageShapes: () => mockPageShapes,
    updateShape: vi.fn(),
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
import { PlannerDoorShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerDoorShapeUtil";
import { PlannerWindowShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerWindowShapeUtil";
import { PlannerZoneShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerZoneShapeUtil";
import { PlannerFurnitureShapeUtil } from "@/features/planner/tldraw/shapes/shapeUtils/PlannerFurnitureShapeUtil";
import { createMockEditor } from "./planner-tldraw-mockEditor";

describe("shape util branch coverage", () => {
  const editor = createMockEditor();

  beforeEach(() => {
    mockPageShapes = [];
    mockUnitSystem = "metric";
    vi.restoreAllMocks();
  });

  it("PlannerWallShapeUtil renders interior non-load-bearing wall without dimensions", () => {
    const util = new PlannerWallShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      isLoadBearing: false,
      isExterior: false,
      showDimensions: false,
      strokeColor: "var(--custom-stroke)",
    };
    const shape = { id: "w-int", type: "planner-wall", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("text")).toBeNull();
    expect(container.querySelector("line[stroke-dasharray]")).toBeNull();
  });

  it("PlannerWallShapeUtil renders load-bearing exterior wall with dimension label in meters", () => {
    const util = new PlannerWallShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      endX: 15000,
      isLoadBearing: true,
      isExterior: true,
      showDimensions: true,
      strokeColor: "",
    };
    const shape = { id: "w-long", type: "planner-wall", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.textContent).toContain("m");
    expect(container.querySelector("line[stroke-dasharray]")).toBeTruthy();
  });

  it("PlannerWallShapeUtil splits body around door and window openings", () => {
    mockPageShapes = [
      {
        id: "door:1",
        type: "planner-door",
        x: 60,
        y: 0,
        rotation: 0,
        props: { widthMm: 900, thicknessMm: 40, swingDirection: "right" },
      },
      {
        id: "win:1",
        type: "planner-window",
        x: 180,
        y: 0,
        rotation: 0,
        props: { widthMm: 1200, frameThicknessMm: 50 },
      },
    ];
    const util = new PlannerWallShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), endX: 300, showDimensions: false };
    const shape = { id: "w-open", type: "planner-wall", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    const paths = container.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it("PlannerWallShapeUtil falls back to solid span when wall is rotated", () => {
    const util = new PlannerWallShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), endX: 200, showDimensions: false };
    const shape = { id: "w-rot", type: "planner-wall", x: 0, y: 0, rotation: 45, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelectorAll("path").length).toBe(1);
  });

  it("PlannerRoomShapeUtil computes shoelace area and imperial label", () => {
    mockUnitSystem = "imperial";
    const util = new PlannerRoomShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      areaSqm: 0,
      showLabel: true,
      showArea: true,
      label: "",
      fillColor: undefined,
      strokeColor: undefined,
      color: undefined,
      strokeWidth: undefined,
    };
    const shape = { id: "r1", type: "planner-room", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.textContent).toContain("ft²");
    expect(container.textContent).toContain("Room");
  });

  it("PlannerRoomShapeUtil falls back to default rectangle when points are insufficient", () => {
    const util = new PlannerRoomShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] };
    const shape = { id: "r2", type: "planner-room", x: 0, y: 0, rotation: 0, props } as never;
    expect(util.getGeometry(shape).points.length).toBe(4);
  });

  it("PlannerRoomShapeUtil hides label when showLabel is false", () => {
    const util = new PlannerRoomShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), showLabel: false, showArea: false };
    const shape = { id: "r3", type: "planner-room", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("text")).toBeNull();
  });

  it("PlannerMeasurementShapeUtil renders short mm and skips zero-length body", () => {
    const util = new PlannerMeasurementShapeUtil(editor as never);
    const short = { ...util.getDefaultProps(), endX: 50, endY: 0, showValue: true };
    const { container: shortEl } = render(
      <svg>
        {util.component({ id: "m-short", type: "planner-measurement", x: 0, y: 0, rotation: 0, props: short } as never)}
      </svg>,
    );
    expect(shortEl.textContent).toContain("mm");

    const zero = { ...util.getDefaultProps(), endX: 0, endY: 0, showValue: false };
    const { container: zeroEl } = render(
      <svg>
        {util.component({ id: "m-zero", type: "planner-measurement", x: 0, y: 0, rotation: 0, props: zero } as never)}
      </svg>,
    );
    expect(zeroEl.querySelector("line")).toBeNull();
  });

  it("PlannerMeasurementShapeUtil hides value label when showValue is false", () => {
    const util = new PlannerMeasurementShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), endX: 200, showValue: false };
    const shape = { id: "m1", type: "planner-measurement", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("text")).toBeNull();
  });

  it("PlannerDoorShapeUtil renders left swing without panel or arc", () => {
    const util = new PlannerDoorShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      swingDirection: "left" as const,
      showDoorPanel: false,
      showSwingArc: false,
      frameColor: "",
      panelColor: "",
    };
    const shape = { id: "d1", type: "planner-door", x: 0, y: 0, rotation: 0, props } as never;
    const geometry = util.getGeometry(shape);
    expect(geometry.width).toBeGreaterThan(0);
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("path")).toBeNull();
    const panelLines = container.querySelectorAll("line:not([stroke-dasharray])");
    expect(panelLines.length).toBe(0);
  });

  it("PlannerWindowShapeUtil renders with default glass and frame colors", () => {
    const util = new PlannerWindowShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), glassColor: "", frameColor: "" };
    const shape = { id: "win1", type: "planner-window", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelectorAll("rect").length).toBeGreaterThanOrEqual(2);
    expect(util.getIndicatorPath(shape)).toBeTruthy();
  });

  it("PlannerZoneShapeUtil renders label with zone type and handles missing points", () => {
    const util = new PlannerZoneShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      label: "",
      fillColor: undefined,
      strokeColor: undefined,
      color: undefined,
      strokeWidth: undefined,
    };
    const shape = { id: "z1", type: "planner-zone", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.textContent).toContain("Zone");
    expect(container.textContent).toContain("focus");

    const degenerate = { ...props, points: [{ x: 0, y: 0 }] };
    const degenerateShape = { id: "z2", type: "planner-zone", x: 0, y: 0, rotation: 0, props: degenerate } as never;
    expect(util.getGeometry(degenerateShape).points.length).toBe(4);
  });

  it("PlannerFurnitureShapeUtil renders fallback rect without catalog block", () => {
    const util = new PlannerFurnitureShapeUtil(editor as never);
    const props = {
      ...util.getDefaultProps(),
      catalogId: "",
      productName: "",
      showLabel: false,
      widthMm: 0,
      heightMm: 0,
    };
    const shape = { id: "f-empty", type: "planner-furniture", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("rect")).toBeTruthy();
    expect(container.querySelector("text")).toBeNull();
  });

  it("PlannerZoneShapeUtil hides label when showLabel is false", () => {
    const util = new PlannerZoneShapeUtil(editor as never);
    const props = { ...util.getDefaultProps(), showLabel: false };
    const shape = { id: "z3", type: "planner-zone", x: 0, y: 0, rotation: 0, props } as never;
    const { container } = render(<svg>{util.component(shape)}</svg>);
    expect(container.querySelector("text")).toBeNull();
  });
});