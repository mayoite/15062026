import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { FloorplanCanvas } from "@/features/planner/canvas-fabric/FloorplanCanvas";
import { FloorplanProvider } from "@/features/planner/canvas-fabric/context/FloorplanContext";

describe("FloorplanCanvas", () => {
  let origGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class ResizeObserver {
        observe() {}
        disconnect() {}
      }
    );

    origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === "2d") {
        return new Proxy({}, {
          get: (target, prop) => {
            if (prop === "canvas") return this;
            return () => {};
          }
        }) as unknown as CanvasRenderingContext2D;
      }
      return origGetContext.apply(this, [type, ...args]);
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    HTMLCanvasElement.prototype.getContext = origGetContext;
  });

  it("renders a canvas element inside the canvas-wrap host", () => {
    const { container } = render(
      <FloorplanProvider>
        <FloorplanCanvas />
      </FloorplanProvider>
    );
    expect(container.querySelector(".canvas-wrap")).not.toBeNull();
    expect(container.querySelector("canvas#main")).not.toBeNull();
  });
});
