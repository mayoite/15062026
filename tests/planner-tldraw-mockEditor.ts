import { vi } from "vitest";
import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";

let shapeIdCounter = 0;

export class MockVec {
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new MockVec(this.x, this.y);
  }

  sub(v: MockVec) {
    return new MockVec(this.x - v.x, this.y - v.y);
  }

  add(v: MockVec) {
    return new MockVec(this.x + v.x, this.y + v.y);
  }

  mul(s: number) {
    return new MockVec(this.x * s, this.y * s);
  }

  len() {
    return Math.hypot(this.x, this.y);
  }

  dist(v: MockVec) {
    return Math.hypot(this.x - v.x, this.y - v.y);
  }
}

export class MockBox {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  }
}

export function resetShapeIdCounter() {
  shapeIdCounter = 0;
}

export function createShapeId(prefix = "shape") {
  shapeIdCounter += 1;
  return `${prefix}:${shapeIdCounter}` as TLShapeId;
}

type StateCtor = {
  id: string;
  initial?: string;
  children?: () => StateCtor[];
  new (ctx: { editor: MockEditor; parent?: MockStateNode }): MockStateNode;
};

export class MockStateNode {
  static id = "base";
  static initial = "idle";
  static children(): StateCtor[] {
    return [];
  }

  editor: MockEditor;
  parent: MockStateNode | null;
  _activeChild: MockStateNode | null = null;

  constructor(ctx: { editor: MockEditor; parent?: MockStateNode }) {
    this.editor = ctx.editor;
    this.parent = ctx.parent ?? null;
  }

  transition(id: string, _info?: unknown) {
    const ctor = this.constructor as unknown as StateCtor;
    const children = ctor.children?.() ?? [];
    const ChildClass = children.find((c) => c.id === id);
    if (!ChildClass) return;
    this._activeChild = new ChildClass({ editor: this.editor, parent: this });
    this._activeChild.onEnter?.();
  }

  activate() {
    const ctor = this.constructor as unknown as StateCtor;
    const initial = ctor.initial ?? "idle";
    const children = ctor.children?.() ?? [];
    const ChildClass = children.find((c) => c.id === initial);
    if (!ChildClass) return;
    this._activeChild = new ChildClass({ editor: this.editor, parent: this });
    this._activeChild.onEnter?.();
  }

  onEnter() {}
  onPointerDown(_info?: unknown) {
    this._activeChild?.onPointerDown?.(_info);
  }
  onPointerMove() {
    this._activeChild?.onPointerMove?.();
  }
  onPointerUp() {
    this._activeChild?.onPointerUp?.();
  }
  onCancel() {
    this._activeChild?.onCancel?.();
  }
}

export type MockEditor = Editor & {
  _shapes: TLShape[];
  _setPagePoint: (x: number, y: number) => void;
  _setShiftKey: (value: boolean) => void;
  _created: unknown[];
  _updated: unknown[];
  _deleted: TLShapeId[];
};

export interface MockEditorOptions {
  shapes?: TLShape[];
  pagePoint?: { x: number; y: number };
  shiftKey?: boolean;
}

export function createMockEditor(options: MockEditorOptions = {}): MockEditor {
  const shapes: TLShape[] = [...(options.shapes ?? [])];
  let pagePoint = { ...(options.pagePoint ?? { x: 0, y: 0 }) };
  let shiftKey = options.shiftKey ?? false;
  const created: unknown[] = [];
  const updated: unknown[] = [];
  const deleted: TLShapeId[] = [];

  const editor = {
    _shapes: shapes,
    _created: created,
    _updated: updated,
    _deleted: deleted,
    _setPagePoint(x: number, y: number) {
      pagePoint = { x, y };
    },
    _setShiftKey(value: boolean) {
      shiftKey = value;
    },
    getCurrentPageShapes: vi.fn(() => shapes),
    createShape: vi.fn((shape: TLShape) => {
      created.push(shape);
      shapes.push(shape);
    }),
    updateShape: vi.fn((partial: Partial<TLShape> & { id: TLShapeId }) => {
      updated.push(partial);
      const idx = shapes.findIndex((s) => s.id === partial.id);
      if (idx >= 0) {
        const existing = shapes[idx];
        shapes[idx] = {
          ...existing,
          ...partial,
          props: partial.props
            ? { ...(existing as { props?: Record<string, unknown> }).props, ...partial.props }
            : (existing as { props?: Record<string, unknown> }).props,
        } as TLShape;
      }
    }),
    deleteShape: vi.fn((id: TLShapeId) => {
      deleted.push(id);
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx >= 0) shapes.splice(idx, 1);
    }),
    getShape: vi.fn((id: TLShapeId) => shapes.find((s) => s.id === id)),
    select: vi.fn(),
    setCursor: vi.fn(),
    setCurrentTool: vi.fn(),
    getSelectedShapeIds: vi.fn(() => [] as TLShapeId[]),
    inputs: {
      getCurrentPagePoint: vi.fn(() => new MockVec(pagePoint.x, pagePoint.y)),
      get shiftKey() {
        return shiftKey;
      },
    },
  } as unknown as MockEditor;

  return editor;
}

/** Minimal @tldraw/editor mock factory for vi.mock(). */
export function createTldrawEditorModule() {
  return {
    Box: MockBox,
    Vec: MockVec,
    createShapeId,
    StateNode: MockStateNode,
    ShapeUtil: class ShapeUtil {
      constructor(_editor: unknown) {}
    },
    Polygon2d: class Polygon2d {
      points: unknown[];
      isFilled: boolean;
      constructor(opts: { points: unknown[]; isFilled: boolean }) {
        this.points = opts.points;
        this.isFilled = opts.isFilled;
      }
    },
    Rectangle2d: class Rectangle2d {
      width: number;
      height: number;
      isFilled: boolean;
      constructor(opts: { width: number; height: number; isFilled: boolean }) {
        this.width = opts.width;
        this.height = opts.height;
        this.isFilled = opts.isFilled;
      }
    },
    SVGContainer: ({ children }: { children: unknown }) => children,
    Path2D: class Path2D {
      constructor(_d: string) {}
    },
  };
}

export const WALL_UUID = "550e8400-e29b-41d4-a716-446655440000";
export const ROOM_UUID = "550e8400-e29b-41d4-a716-446655440001";
export const FURNITURE_UUID = "550e8400-e29b-41d4-a716-446655440002";
export const DOOR_UUID = "550e8400-e29b-41d4-a716-446655440003";
export const WINDOW_UUID = "550e8400-e29b-41d4-a716-446655440004";

/** Zod-valid wall payload for ShapeRegistrationSystem. */
export function validWallPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: WALL_UUID,
    type: "planner-wall",
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    startX: 0,
    startY: 0,
    endX: 200,
    endY: 0,
    thickness: 10,
    lengthMm: 2000,
    material: "drywall",
    isLoadBearing: false,
    isExterior: false,
    hasJunctionStart: false,
    hasJunctionEnd: false,
    showDimensions: true,
    showMaterial: false,
    color: "#336699",
    ...overrides,
  };
}

export function validRoomPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: ROOM_UUID,
    type: "planner-room",
    x: 0,
    y: 0,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    roomType: "office",
    floorMaterial: "carpet",
    areaMm2: 10000,
    perimeterMm: 400,
    widthMm: 100,
    heightMm: 100,
    label: "Office",
    showLabel: true,
    showArea: true,
    showCapacity: false,
    color: "#336699",
    ...overrides,
  };
}

export function validFurniturePayload(overrides: Record<string, unknown> = {}) {
  return {
    id: FURNITURE_UUID,
    type: "planner-furniture",
    x: 50,
    y: 50,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    category: "workstation",
    widthMm: 1200,
    heightMm: 750,
    catalogId: "ws-linear-120",
    label: "Desk",
    showLabel: true,
    isRotatable: true,
    isResizable: true,
    color: "#336699",
    ...overrides,
  };
}

export function validDoorPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: DOOR_UUID,
    type: "planner-door",
    x: 100,
    y: 0,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    doorType: "single",
    swingDirection: "right",
    widthMm: 900,
    heightMm: 2100,
    isOpen: false,
    showSwingArc: true,
    startX: 0,
    startY: 0,
    endX: 90,
    endY: 0,
    color: "#336699",
    ...overrides,
  };
}

export function validWindowPayload(overrides: Record<string, unknown> = {}) {
  return {
    id: WINDOW_UUID,
    type: "planner-window",
    x: 200,
    y: 0,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    windowType: "single",
    widthMm: 1200,
    heightMm: 1000,
    sillHeightMm: 900,
    isOperable: true,
    showSillHeight: true,
    startX: 0,
    startY: 0,
    endX: 120,
    endY: 0,
    color: "#336699",
    ...overrides,
  };
}

export function makePlannerWallShape(
  id: string,
  x: number,
  y: number,
  endX: number,
  endY: number,
  extra: Record<string, unknown> = {},
): TLShape {
  return {
    id: id as TLShapeId,
    type: "planner-wall",
    x,
    y,
    rotation: 0,
    opacity: 1,
    isLocked: false,
    props: {
      startX: 0,
      startY: 0,
      endX,
      endY,
      thickness: 10,
      lengthMm: Math.hypot(endX, endY) * 10,
      material: "drywall",
      isLoadBearing: false,
      isExterior: false,
      hasJunctionStart: false,
      hasJunctionEnd: false,
      showDimensions: true,
      showMaterial: false,
      color: "var(--color-primary)",
      ...extra,
    },
  } as unknown as TLShape;
}