import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAutoSaver,
  loadProject,
  migrateGuestProjectToMember,
  buildSessionEnvelope,
  parseSessionSnapshot,
  applySessionWorkspace,
} = vi.hoisted(() => ({
  createAutoSaver: vi.fn(),
  loadProject: vi.fn(),
  migrateGuestProjectToMember: vi.fn(),
  buildSessionEnvelope: vi.fn((store: unknown) => ({
    version: "2.0.0",
    store,
    updatedAt: "2026-06-15T00:00:00.000Z",
  })),
  parseSessionSnapshot: vi.fn(),
  applySessionWorkspace: vi.fn(),
}));

vi.mock("@/features/planner/persistence/persistence", () => ({
  createAutoSaver,
  getPlannerProjectId: (guestMode: boolean, planId?: string) =>
    guestMode ? "planner-guest-local" : planId?.trim() ? `planner-member-local:${planId.trim()}` : "planner-member-local",
  loadProject,
  migrateGuestProjectToMember,
}));

vi.mock("@/features/planner/persistence/plannerSession", () => ({
  buildSessionEnvelope,
  parseSessionSnapshot,
  applySessionWorkspace,
}));

import { usePlannerFabricAutosave } from "@/features/planner/hooks/usePlannerFabricAutosave";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

function resetWorkspaceStore() {
  usePlannerWorkspaceStore.setState({
      dataUrl: null,
      sourceKind: null,
      sourcePage: null,
      sourcePageCount: null,
      interactionMode: "idle",
      x: 0,
      y: 0,
      scale: 1,
      widthPx: 0,
      heightPx: 0,
      opacity: 0.45,
      mmPerUnit: null,
    },
    layerVisible: {
      underlay: true,
      walls: true,
      rooms: true,
      zones: true,
      furniture: true,
      measurements: true,
    },
    unitSystem: "metric",
    plannerStep: "draw",
    projectMetadata: null,
  });
}

describe("usePlannerFabricAutosave", () => {
  const exportDraft = vi.fn(() => JSON.stringify({ objects: [] }));
  const importDraft = vi.fn(async () => undefined);
  let scheduleSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetWorkspaceStore();
    scheduleSave = vi.fn();
    createAutoSaver.mockReturnValue({
      scheduleSave,
      cancel: vi.fn(),
    });
    loadProject.mockResolvedValue(undefined);
    migrateGuestProjectToMember.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("schedules saves when the fabric revision changes", () => {
    const { rerender } = renderHook(
      ({ revision }) => usePlannerFabricAutosave(exportDraft, false, undefined, revision),
      { initialProps: { revision: "0" } },
    );

    rerender({ revision: "1" });
    expect(scheduleSave).toHaveBeenCalled();
  });

  it("restores a saved snapshot for members", async () => {
    parseSessionSnapshot.mockReturnValue({
      store: { objects: [] },
      updatedAt: "2026-06-15T00:00:00.000Z",
    });
    loadProject.mockResolvedValue({
      snapshot: JSON.stringify({ version: "2.0.0", store: { objects: [] } }),
      updatedAt: "2026-06-15T00:00:00.000Z",
    });

    const { result } = renderHook(() => usePlannerFabricAutosave(exportDraft, false));
    let restored = false;
    await act(async () => {
      restored = await result.current.restoreSnapshot(importDraft);
    });

    expect(restored).toBe(true);
    expect(importDraft).toHaveBeenCalled();
    expect(applySessionWorkspace).toHaveBeenCalled();
  });

  it("retries save through retrySave", () => {
    const { result, rerender } = renderHook(
      ({ revision }) => usePlannerFabricAutosave(exportDraft, false, undefined, revision),
      { initialProps: { revision: "0" } },
    );

    rerender({ revision: "1" });
    scheduleSave.mockClear();
    act(() => {
      result.current.retrySave();
    });
    expect(scheduleSave).toHaveBeenCalled();
  });
});
