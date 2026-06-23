import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as persistenceMod from "@/features/planner/persistence/persistence";
import * as plannerSessionMod from "@/features/planner/persistence/plannerSession";

import { usePlannerFabricAutosave } from "@/features/planner/hooks/usePlannerFabricAutosave";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

function resetWorkspaceStore() {
  usePlannerWorkspaceStore.setState({
    layerVisible: {
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
    vi.spyOn(persistenceMod, "createAutoSaver").mockReturnValue({ scheduleSave, cancel: vi.fn() } as unknown as ReturnType<typeof persistenceMod.createAutoSaver>);
    vi.spyOn(persistenceMod, "getPlannerProjectId").mockImplementation(((guestMode: boolean, planId?: string) => guestMode ? "planner-guest-local" : planId?.trim() ? `planner-member-local:${planId.trim()}` : "planner-member-local") as unknown as typeof persistenceMod.getPlannerProjectId);
    vi.spyOn(persistenceMod, "loadProject").mockResolvedValue(undefined);
    vi.spyOn(persistenceMod, "migrateGuestProjectToMember").mockResolvedValue(undefined);

    vi.spyOn(plannerSessionMod, "buildSessionEnvelope").mockImplementation(((store: unknown) => ({ version: "2.0.0", store, updatedAt: "2026-06-15T00:00:00.000Z" })) as unknown as typeof plannerSessionMod.buildSessionEnvelope);
    vi.spyOn(plannerSessionMod, "parseSessionSnapshot").mockReturnValue(undefined as unknown as ReturnType<typeof plannerSessionMod.parseSessionSnapshot>);
    vi.spyOn(plannerSessionMod, "applySessionWorkspace").mockImplementation(vi.fn());
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
    vi.spyOn(plannerSessionMod, "parseSessionSnapshot").mockReturnValue({
      store: { objects: [] },
      updatedAt: "2026-06-15T00:00:00.000Z",
    } as unknown as ReturnType<typeof plannerSessionMod.parseSessionSnapshot>);
    vi.spyOn(persistenceMod, "loadProject").mockResolvedValue({
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
    expect(plannerSessionMod.applySessionWorkspace).toHaveBeenCalled();
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

  it("ignores a stale restore after unmount", async () => {
    let resolveLoad: ((value: Awaited<ReturnType<typeof persistenceMod.loadProject>>) => void) | null = null;
    const loadProjectPromise = new Promise<Awaited<ReturnType<typeof persistenceMod.loadProject>>>((resolve) => {
      resolveLoad = resolve;
    });
    vi.spyOn(persistenceMod, "loadProject").mockReturnValue(loadProjectPromise);
    vi.spyOn(plannerSessionMod, "parseSessionSnapshot").mockReturnValue({
      store: { objects: [] },
      updatedAt: "2026-06-15T00:00:00.000Z",
    } as unknown as ReturnType<typeof plannerSessionMod.parseSessionSnapshot>);

    const { result, unmount } = renderHook(() => usePlannerFabricAutosave(exportDraft, false));
    const restorePromise = result.current.restoreSnapshot(importDraft);
    unmount();

    await act(async () => {
      resolveLoad?.({
        snapshot: JSON.stringify({ version: "2.0.0", store: { objects: [] } }),
        updatedAt: "2026-06-15T00:00:00.000Z",
      });
      await restorePromise;
    });

    expect(await restorePromise).toBe(false);
    expect(importDraft).not.toHaveBeenCalled();
    expect(plannerSessionMod.applySessionWorkspace).not.toHaveBeenCalled();
  });
});
