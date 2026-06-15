import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getPrimBounds,
  RenderBlockPrims,
} from "@/features/planner/tldraw/shapes/shapeUtils/renderBlockPrims";
import type { Prim } from "@/lib/catalog/blocks2d";

const samplePrims: Prim[] = [
  { kind: "rect", x: 0, y: 0, w: 100, h: 50, fill: "#ccc" },
  { kind: "circle", cx: 50, cy: 25, r: 10, fill: "#000" },
  {
    kind: "line",
    points: [0, 0, 100, 50],
    stroke: "#333",
    strokeWidth: 2,
  },
  {
    kind: "path",
    data: "M 0 0 L 20 0 L 20 20 Z",
    stroke: "#111",
    strokeWidth: 1,
  },
  {
    kind: "arc",
    cx: 10,
    cy: 10,
    r: 5,
    startAngle: 0,
    endAngle: Math.PI,
    stroke: "#222",
    strokeWidth: 1,
  },
];

describe("renderBlockPrims", () => {
  it("getPrimBounds computes bounds for mixed primitives", () => {
    const bounds = getPrimBounds(samplePrims);
    expect(bounds).not.toBeNull();
    expect(bounds!.minX).toBeLessThanOrEqual(0);
    expect(bounds!.maxX).toBeGreaterThanOrEqual(100);
  });

  it("getPrimBounds returns null for empty list", () => {
    expect(getPrimBounds([])).toBeNull();
  });

  it("RenderBlockPrims renders scaled SVG group", () => {
    const { container } = render(
      <svg>
        <RenderBlockPrims prims={samplePrims} width={200} height={100} idPrefix="test" />
      </svg>,
    );
    const group = container.querySelector("g[transform]");
    expect(group).toBeTruthy();
    expect(container.querySelector("rect")).toBeTruthy();
    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("RenderBlockPrims returns null when bounds cannot be computed", () => {
    const { container } = render(
      <svg>
        <RenderBlockPrims prims={[]} width={100} height={100} />
      </svg>,
    );
    expect(container.querySelector("g[transform]")).toBeNull();
  });

  it("getPrimBounds handles invalid path data gracefully", () => {
    const badPath: Prim[] = [{ kind: "path", data: "Z", stroke: "#000", strokeWidth: 1 }];
    expect(getPrimBounds(badPath)).toBeNull();
  });

  it("RenderBlockPrims renders rect with linear gradient stops", () => {
    const gradientRect: Prim[] = [
      {
        kind: "rect",
        x: 0,
        y: 0,
        w: 40,
        h: 20,
        fill: "#aaa",
        fillLinearGradientColorStops: [0, "#111111", 1, "#eeeeee"],
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: 40, y: 0 },
      },
    ];
    const { container } = render(
      <svg>
        <RenderBlockPrims prims={gradientRect} width={80} height={40} idPrefix="grad" />
      </svg>,
    );
    expect(container.querySelector("linearGradient")).toBeTruthy();
  });
});