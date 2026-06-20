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

  it("reports ready status and a WEBGL2 renderer label when WebGL is available", () => {
    mockWebGLContext();
    const document = createPlannerDocument({
      name: "WebGL plan",
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

    const viewer = screen.getByTestId("planner-3d-viewer");
    expect(viewer).toHaveAttribute("data-webgl-status", "ready");
    // The renderer label surfaces the probed context name and GPU string.
    expect(screen.getByTestId("planner-3d-renderer")).toHaveTextContent(/WEBGL/i);
    expect(screen.getByTestId("planner-3d-renderer")).toHaveTextContent(/Mock GPU/i);
    // No fallback surface is rendered when WebGL is available.
    expect(screen.queryByTestId("planner-3d-fallback")).not.toBeInTheDocument();
  });

  it("toggles between Orbit and Walk camera modes and shows the walk controls panel", () => {
    mockWebGLContext();
    const document = createPlannerDocument({
      name: "Camera plan",
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

    // Orbit is the default mode.
    const orbitButton = screen.getByRole("button", { name: /Orbit/i });
    const walkButton = screen.getByRole("button", { name: /Walk/i });
    expect(orbitButton).toHaveAttribute("aria-pressed", "true");
    expect(walkButton).toHaveAttribute("aria-pressed", "false");
    // Orbit-mode description copy is shown.
    expect(screen.getByText("Orbit camera")).toBeInTheDocument();
    expect(screen.queryByText("Walk camera")).not.toBeInTheDocument();

    fireEvent.click(walkButton);
    expect(walkButton).toHaveAttribute("aria-pressed", "true");
    expect(orbitButton).toHaveAttribute("aria-pressed", "false");
    // Walk-mode description + controls panel now visible.
    expect(screen.getByText("Walk camera")).toBeInTheDocument();
    expect(screen.getByText(/WASD or arrow keys/i)).toBeInTheDocument();
  });

  it("hides the empty-scene notice when mapped items exist", () => {
    mockWebGLContext();
    const document = createPlannerDocument({
      name: "Furnished plan",
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
          items: [
            {
              id: "desk-1",
              name: "Desk 1",
              category: "Desk",
              centerMm: { xMm: 1000, yMm: 1000 },
              sizeMm: { widthMm: 1200, depthMm: 600, heightMm: 750 },
              rotationDeg: 0,
            },
          ],
        },
      },
    });

    render(<Planner3DViewer document={document} />);
    expect(screen.queryByText("Empty mapped scene")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from "@testing-library/react";
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

function mockWebGLContext() {
  // Minimal mock so probeWebGL() reports ok:true and names a renderer.
  const gl = {
    getExtension: vi.fn(() => ({
      UNMASKED_RENDERER_WEBGL: 37446,
    })),
    getParameter: vi.fn(() => "Mock GPU"),
    getContextAttributes: vi.fn(() => ({})),
    isContextLost: vi.fn(() => false),
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    RGBA: 6408,
    UNSIGNED_BYTE: 5121,
    readPixels: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as unknown as WebGLRenderingContext);
  return gl;
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
