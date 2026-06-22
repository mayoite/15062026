import { vi } from "vitest";

function fabricShape() {
  return class FabricShape {
    constructor(props: Record<string, unknown> = {}) {
      Object.assign(this, props);
    }

    set() {
      return this;
    }

    scale() {
      return this;
    }

    rotate() {
      return this;
    }
  };
}

export function createPlannerFabricModuleMock() {
  return {
    Canvas: class MockCanvas {
      on() {}
      off() {}
      dispose() {}
      add() {}
      remove() {}
      setDimensions() {}
      requestRenderAll() {}
      getObjects() { return []; }
      clear() {}
      calcOffset() {}
      toDatalessJSON() { return { objects: [] }; }
      setActiveObject() {}
      getActiveObject() { return null; }
      discardActiveObject() {}
      getZoom() { return 1; }
      setZoom() {}
      viewportTransform = [1, 0, 0, 1, 0, 0];
      setViewportTransform() {}
      relativePan() {}
      getElement() { return document.createElement("canvas"); }
    },
    Rect: fabricShape(),
    Line: fabricShape(),
    Circle: fabricShape(),
    Ellipse: fabricShape(),
    Path: fabricShape(),
    Polygon: fabricShape(),
    Polyline: fabricShape(),
    Triangle: fabricShape(),
    IText: fabricShape(),
    FabricText: fabricShape(),
    Group: fabricShape(),
    Point: class Point {
      x: number;
      y: number;
      constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
      }
    },
    ActiveSelection: fabricShape(),
    Pattern: fabricShape(),
    util: {
      enlivenObjects: vi.fn(async (_objects: unknown[], callback: (objects: unknown[]) => void) => {
        callback([]);
      }),
    },
    loadSVGFromString: vi.fn(async () => ({ objects: [], options: {} })),
  };
}
