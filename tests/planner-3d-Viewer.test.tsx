import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  computePlanner3DSceneMetrics,
  Planner3DViewer,
} from "@/features/planner/3d/Planner3DViewer";
import type { Planner3DSceneDocument } from "@/features/planner/3d/types";
import { createPlannerDocument } from "@/features/planner/model";

function createSceneDocument(overrides: Partial<Planner3DSceneDocument> = {}): Planner3DSceneDocument {
  return {
    id: "planner-preview",
    title: "Planner preview",
    room: {
      widthMm: 4000,
      depthMm: 4000,
      wallHeightMm: 2400,
      wallThicknessMm: 120,
      floorThicknessMm: 40,
    },
    items: [],
    ...overrides,
  };
}

describe("planner 3d viewer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("expands framing when mapped items extend beyond the room shell", () => {
    const metrics = computePlanner3DSceneMetrics(
      createSceneDocument({
        items: [
          {
            id: "bench-1",
            name: "Bench 1",
            category: "Desk",
            centerMm: { xMm: 5200, yMm: 2000 },
            sizeMm: { widthMm: 2400, depthMm: 1200, heightMm: 900 },
            rotationDeg: 0,
          },
        ],
      }),
    );

    expect(metrics.target[0]).toBeGreaterThan(1);
    expect(metrics.maxSpanWorld).toBeGreaterThan(6);
    expect(metrics.defaultOrbitPosition[0]).toBeGreaterThan(metrics.target[0]);
    expect(metrics.orbitMaxDistance).toBeGreaterThan(metrics.orbitMinDistance);
  });

  it("renders the WebGL fallback without dropping empty-scene messaging", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const document = createPlannerDocument({
      name: "Fallback plan",
      sceneJson: {
        plannerScene: {
          type: "cad-suite-planner-scene",
          version: 1,
          measurement: {
            canonicalUnit: "mm",
            displayUnit: "mm",
            sourceUnit: "mm",
          },
          room: {
            widthMm: 4000,
            depthMm: 4000,
            wallHeightMm: 2400,
            wallThicknessMm: 120,
            floorThicknessMm: 40,
            originMm: { xMm: 0, yMm: 0 },
          },
          items: [],
        },
      },
    });

    render(<Planner3DViewer document={document} />);

    expect(screen.getByTestId("planner-3d-viewer")).toHaveAttribute("data-webgl-status", "fallback");
    expect(screen.getByTestId("planner-3d-fallback")).toBeInTheDocument();
    expect(screen.getByTestId("planner-3d-renderer")).toHaveTextContent("Fallback mode");
    expect(screen.getByText("Empty mapped scene")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No planner items are mapped yet. The room shell is using the document dimensions.",
      ),
    ).toBeInTheDocument();
  });
});
