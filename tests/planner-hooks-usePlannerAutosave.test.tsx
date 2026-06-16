import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSnapshot,
  loadSnapshot,
  createAutoSaver,
  loadProject,
  migrateGuestProjectToMember,
  buildSessionEnvelope,
  parseSessionSnapshot,
  applySessionWorkspace,
} = vi.hoisted(() => ({
  getSnapshot: vi.fn(() => ({ records: [] })),
  loadSnapshot: vi.fn(),
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

vi.mock("tldraw", () => ({
  getSnapshot,
  loadSnapshot,
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

import { usePlannerAutosave } from "@/features/planner/hooks/usePlannerAutosave";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

function createEditor() {
  const docListener = vi.fn();
  const store = {
    listen: vi.fn((callback: () => void, options?: { scope?: string; source?: string }) => {
      if (options?.scope === "document") {
        docListener.mockImplementation(callback);
      }
      return vi.fn();
    }),
  };

  return {
    store,
    triggerDocumentChange: () => docListener(),
  };
}

function resetWorkspaceStore() {
  usePlannerWorkspaceStore.setState({
    blueprint: {
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
      calibrating: false,
      calibrationPoints: [],
      knownDistanceMm: 3000,
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
    projectMetadata: null,
    plannerStep: "draw",
  });
}

describe("usePlannerAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetWorkspaceStore();
    createAutoSaver.mockReturnValue({
      scheduleSave: vi.fn(),
      cancel: vi.fn(),
    });
    loadProject.mockResolvedValue(undefined);
    migrateGuestProjectToMember.mockResolvedValue("skipped");
    parseSessionSnapshot.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("does nothing until an editor is mounted", () => {
    const { result } = renderHook(() => usePlannerAutosave(null, false));

    expect(result.current.status).toBe("idle");
    expect(createAutoSaver).not.toHaveBeenCalled();
  });

  it("schedules saves on document and workspace changes", async () => {
    const editor = createEditor();
    const scheduleSave = vi.fn();
    createAutoSaver.mockReturnValue({ scheduleSave, cancel: vi.fn() });

    const { result } = renderHook(() => usePlannerAutosave(editor as never, false, "plan-a"));

    expect(createAutoSaver).toHaveBeenCalledWith("planner-member-local:plan-a");

    act(() => {
      editor.triggerDocumentChange();
    });

    expect(result.current.status).toBe("saving");
    expect(getSnapshot).toHaveBeenCalledWith(editor.store);
    expect(buildSessionEnvelope).toHaveBeenCalled();
    expect(scheduleSave).toHaveBeenCalledWith(expect.any(String));

    act(() => {
      usePlannerWorkspaceStore.getState().setUnitSystem("imperial");
    });

    expect(scheduleSave).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    expect(result.current.status).toBe("saved");
    expect(result.current.lastSavedAt).toMatch(/2026/);
  });

  it("restores a saved snapshot for members and skips migration for guests", async () => {
    const editor = createEditor();
    loadProject.mockResolvedValue({
      snapshot: '{"version":"2.0.0","store":{"records":[]}}',
      updatedAt: "2026-06-14T12:00:00.000Z",
    });
    parseSessionSnapshot.mockReturnValue({
      version: "2.0.0",
      store: { records: [] },
    });

    const { result: memberResult } = renderHook(() => usePlannerAutosave(editor as never, false, "plan-a"));

    await act(async () => {
      const restored = await memberResult.current.restoreSnapshot(editor as never);
      expect(restored).toBe(true);
    });

    expect(migrateGuestProjectToMember).toHaveBeenCalledTimes(1);
    expect(loadSnapshot).toHaveBeenCalled();
    expect(applySessionWorkspace).toHaveBeenCalled();
    expect(memberResult.current.status).toBe("saved");
    expect(memberResult.current.lastSavedAt).toBe("2026-06-14T12:00:00.000Z");

    migrateGuestProjectToMember.mockClear();
    const { result: guestResult } = renderHook(() => usePlannerAutosave(editor as never, true));

    await act(async () => {
      const restored = await guestResult.current.restoreSnapshot(editor as never);
      expect(restored).toBe(true);
    });

    expect(migrateGuestProjectToMember).not.toHaveBeenCalled();
  });

  it("returns false when restore fails or snapshot is missing", async () => {
    const editor = createEditor();
    const { result } = renderHook(() => usePlannerAutosave(editor as never, false));

    await act(async () => {
      expect(await result.current.restoreSnapshot(editor as never)).toBe(false);
    });

    loadProject.mockRejectedValue(new Error("db unavailable"));

    await act(async () => {
      expect(await result.current.restoreSnapshot(editor as never)).toBe(false);
    });

    loadProject.mockResolvedValue({ snapshot: "{}", updatedAt: "2026-06-14T12:00:00.000Z" });
    parseSessionSnapshot.mockReturnValue({ version: "2.0.0", store: null });

    await act(async () => {
      expect(await result.current.restoreSnapshot(editor as never)).toBe(false);
    });
  });

  it("retries save through retrySave and cleans up on unmount", async () => {
    const editor = createEditor();
    const cancel = vi.fn();
    const scheduleSave = vi.fn();
    createAutoSaver.mockReturnValue({ scheduleSave, cancel });

    const { result, unmount } = renderHook(() => usePlannerAutosave(editor as never, false));

    act(() => {
      result.current.retrySave();
    });

    expect(scheduleSave).toHaveBeenCalledTimes(1);

    act(() => {
      editor.triggerDocumentChange();
      vi.advanceTimersByTime(1000);
    });

    unmount();
    expect(cancel).toHaveBeenCalled();
  });

  it("does not retry save without an editor", () => {
    const { result } = renderHook(() => usePlannerAutosave(null, false));

    act(() => {
      result.current.retrySave();
    });

    expect(getSnapshot).not.toHaveBeenCalled();
  });

  it("preserves non-saving status when the debounce timer fires after status changed", async () => {
    const editor = createEditor();
    createAutoSaver.mockReturnValue({
      scheduleSave: vi.fn(),
      cancel: vi.fn(),
    });
    loadProject.mockResolvedValue({
      snapshot: '{"version":"2.0.0","store":{"records":[]}}',
      updatedAt: "2026-06-14T12:00:00.000Z",
    });
    parseSessionSnapshot.mockReturnValue({
      version: "2.0.0",
      store: { records: [] },
    });

    const { result } = renderHook(() => usePlannerAutosave(editor as never, false));

    act(() => {
      editor.triggerDocumentChange();
    });

    expect(result.current.status).toBe("saving");

    await act(async () => {
      await result.current.restoreSnapshot(editor as never);
    });

    act(() => {
      vi.advanceTimersByTime(5200);
    });

    expect(result.current.status).toBe("saved");
  });
});
