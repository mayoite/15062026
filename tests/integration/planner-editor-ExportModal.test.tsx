import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExportModal } from "@/features/planner/editor/ExportModal";
import { resetFabricRuntimeState, seedFabricRuntime } from "./planner-fabric-mockRuntime";

import * as exportActionsMod from "@/features/planner/editor/exportActions";

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
    vi.spyOn(exportActionsMod, "downloadPlannerJson").mockImplementation(vi.fn());
    vi.spyOn(exportActionsMod, "downloadPlannerBoqPdf").mockResolvedValue(undefined);
    vi.spyOn(exportActionsMod, "downloadPlannerSvg").mockResolvedValue(undefined);
    vi.spyOn(exportActionsMod, "downloadPlannerPng").mockResolvedValue(undefined);
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
    render(<ExportModal isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /JSON Full session data/i }));
    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));
    await waitFor(() => expect(exportActionsMod.downloadPlannerJson).toHaveBeenCalledWith(null));

    fireEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
