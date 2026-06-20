import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportModal } from "@/features/planner/editor/ExportModal";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

vi.mock("@/features/planner/editor/exportActions", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    downloadPlannerJson: vi.fn(),
    downloadPlannerBoqPdf: vi.fn(async () => undefined),
    downloadPlannerSvg: vi.fn(async () => undefined),
    downloadPlannerPng: vi.fn(async () => undefined),
  };
});

describe("ExportModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedFabricRuntime({
      objects: [{ name: "GENERIC:Desk", left: 0, top: 0, width: 120, height: 60 }],
    });
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
  });

  afterEach(() => {
    resetFabricRuntimeState();
    vi.unstubAllGlobals();
  });

  it("returns null when closed", () => {
    const { container } = render(<ExportModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("downloads json and copies share link", async () => {
    const { downloadPlannerJson } = await import("@/features/planner/editor/exportActions");
    render(<ExportModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /JSON Full session data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    await waitFor(() => expect(downloadPlannerJson).toHaveBeenCalledWith(null));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
