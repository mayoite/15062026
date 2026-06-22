import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("uuid", () => ({ v4: () => "notification-uuid-1" }));

import { useToastStore } from "@/features/planner/store/toastStore";
import {
  usePlannerWorkspaceStore,
  serializeWorkspaceState,
  hydrateWorkspaceState,
  PLANNER_LAYER_CATEGORIES,
} from "@/features/planner/store/workspaceStore";
import { useAIStore } from "@/features/planner/store/aiStore";
import { useFavoritesStore } from "@/features/planner/store/favoritesStore";
import {
  useNotificationStore,
  notifyInfo,
  notifySuccess,
  notifyWarning,
  notifyError,
  notifyAutoSaved,
} from "@/features/planner/store/notificationStore";
import { usePlannerHistoryStore } from "@/features/planner/store/plannerHistoryStore";
import type { HistorySnapshot } from "@/features/planner/store/plannerStoreSupport";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      const value = store.get(key);
      return value === undefined ? null : value;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

const emptySnap = (): HistorySnapshot => ({
  walls: [],
  rooms: [],
  furniture: [],
  doors: [],
  windows: [],
  measurements: [],
  zones: [],
  textLabels: [],
  structuralElements: [],
});

describe("planner small stores", () => {
  describe("toastStore", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      useToastStore.setState({ toasts: [] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("adds and removes toasts", () => {
      useToastStore.getState().addToast("success", "Saved");
      expect(useToastStore.getState().toasts).toHaveLength(1);
      const id = useToastStore.getState().toasts[0].id;
      useToastStore.getState().removeToast(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it("auto-dismisses toasts after timeout", () => {
      useToastStore.getState().addToast("info", "Hello");
      vi.advanceTimersByTime(3000);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe("workspaceStore", () => {
    beforeEach(() => {
      usePlannerWorkspaceStore.setState({
        layerVisible: {
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
    });

    it("exposes layer categories and mutates workspace state", () => {
      expect(PLANNER_LAYER_CATEGORIES).toContain("walls");
      usePlannerWorkspaceStore.getState().setPlannerStep("draw");
      usePlannerWorkspaceStore.getState().toggleLayer("furniture");
      usePlannerWorkspaceStore.getState().setLayerVisible("zones", false);
      usePlannerWorkspaceStore.getState().setUnitSystem("imperial");
      usePlannerWorkspaceStore.getState().setProjectMetadata({
        projectName: "HQ",
        city: "Patna",
        floorAreaSqFt: 1000,
        primaryPurpose: "workstations",
        seatTarget: 20,
        completedAt: "2026-06-21T00:00:00.000Z",
      });
      expect(usePlannerWorkspaceStore.getState().plannerStep).toBe("draw");
      expect(usePlannerWorkspaceStore.getState().layerVisible.furniture).toBe(false);
      expect(usePlannerWorkspaceStore.getState().unitSystem).toBe("imperial");
    });

    it("hydrates partial workspace snapshots with defaults", () => {
      hydrateWorkspaceState({
        layerVisible: { furniture: false },
        unitSystem: "imperial",
      });
      expect(usePlannerWorkspaceStore.getState().layerVisible.furniture).toBe(false);
      expect(usePlannerWorkspaceStore.getState().layerVisible.walls).toBe(true);
      expect(usePlannerWorkspaceStore.getState().unitSystem).toBe("imperial");

      hydrateWorkspaceState({ unitSystem: "metric" });
      expect(serializeWorkspaceState().projectMetadata).toBeNull();
    });

    it("serializes and hydrates persisted workspace slices", () => {
      const serialized = serializeWorkspaceState();
      hydrateWorkspaceState(serialized);
      expect(serializeWorkspaceState()).toEqual(serialized);
    });
  });

  describe("aiStore", () => {
    beforeEach(() => {
      useAIStore.setState({
        isOpen: true,
        style: "Modern",
        messages: [],
        ghostItems: [],
        isLoading: false,
      });
    });

    it("manages chat and ghost item lifecycle", () => {
      const id = useAIStore.getState().addMessage({ role: "user", content: "Plan my office" });
      useAIStore.getState().updateMessage(id, { content: "Updated" });
      expect(useAIStore.getState().messages[0].content).toBe("Updated");

      useAIStore.getState().setOpen(false);
      useAIStore.getState().setStyle("Industrial");
      useAIStore.getState().setLoading(true);
      useAIStore.getState().setGhostItems([
        { id: "g1", catalogId: "task-chair", name: "Chair", x: 0, y: 0, width: 0, height: 0, rotation: 0, color: "", shape: "" },
        { id: "g2", catalogId: "missing-catalog", name: "Ghost", x: 1, y: 1, width: 0, height: 0, rotation: 0, color: "", shape: "" },
      ]);
      expect(useAIStore.getState().ghostItems[0].shape).toBe("task-chair");
      expect(useAIStore.getState().ghostItems[1].width).toBe(50);
      useAIStore.getState().removeGhostItem("g1");
      useAIStore.getState().clearGhostItems();
      useAIStore.getState().clearMessages();
      expect(useAIStore.getState().messages).toHaveLength(0);
    });
  });

  describe("favoritesStore", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
      useFavoritesStore.setState({ favorites: [] });
    });

    it("hydrates empty favorites when storage is blank", () => {
      useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });

    it("hydrates, toggles, and persists favorites", () => {
      window.localStorage.setItem("planner.favorites", JSON.stringify(["chair-1"]));
      useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().isFavorite("chair-1")).toBe(true);

      useFavoritesStore.getState().addFavorite("desk-1");
      useFavoritesStore.getState().addFavorite("desk-1");
      expect(useFavoritesStore.getState().getFavorites()).toEqual(["chair-1", "desk-1"]);

      useFavoritesStore.getState().toggleFavorite("chair-1");
      useFavoritesStore.getState().removeFavorite("missing");
      useFavoritesStore.getState().clearFavorites();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });

    it("returns empty favorites for malformed storage", () => {
      window.localStorage.setItem("planner.favorites", "{");
      useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);

      window.localStorage.setItem("planner.favorites", JSON.stringify([1, "chair-1"]));
      useFavoritesStore.getState().hydrate();
      expect(useFavoritesStore.getState().favorites).toEqual([]);
    });

    it("no-ops duplicate adds and missing removals", () => {
      useFavoritesStore.getState().addFavorite("chair-1");
      useFavoritesStore.getState().addFavorite("chair-1");
      useFavoritesStore.getState().removeFavorite("missing");
      expect(useFavoritesStore.getState().getFavorites()).toEqual(["chair-1"]);
    });

    it("swallows favorite persistence failures", () => {
      vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
        throw new Error("quota");
      });
      useFavoritesStore.getState().addFavorite("desk-2");
      expect(useFavoritesStore.getState().isFavorite("desk-2")).toBe(true);
    });
  });

  describe("notificationStore", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      useNotificationStore.setState({ notifications: [], unreadCount: 0 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("tracks unread counts and dismissal", () => {
      const id = useNotificationStore.getState().addNotification({
        severity: "warning",
        category: "quota",
        title: "Quota",
        message: "Near limit",
      });
      expect(useNotificationStore.getState().unreadCount).toBe(1);
      useNotificationStore.getState().markRead(id);
      useNotificationStore.getState().markAllRead();
      useNotificationStore.getState().dismiss(id);
      useNotificationStore.getState().clearDismissed();
      useNotificationStore.getState().clearAll();
      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it("auto-dismisses timed notifications and exposes helpers", () => {
      notifyInfo("Info", "Details", 1000);
      notifySuccess("Saved");
      notifyWarning("Heads up");
      notifyError("Failed");
      notifyAutoSaved();
      vi.advanceTimersByTime(4000);
      expect(useNotificationStore.getState().notifications.some((n) => n.dismissed)).toBe(true);
    });
  });

  describe("plannerHistoryStore", () => {
    beforeEach(() => {
      usePlannerHistoryStore.setState({ undoStack: [], redoStack: [], clipboard: null });
    });

    it("reports undo/redo availability", () => {
      expect(usePlannerHistoryStore.getState().canUndo()).toBe(false);
      expect(usePlannerHistoryStore.getState().canRedo()).toBe(false);
      expect(usePlannerHistoryStore.getState().undo(emptySnap())).toBeNull();
      expect(usePlannerHistoryStore.getState().redo(emptySnap())).toBeNull();
    });

    it("pushes, undoes, redoes, and manages clipboard", () => {
      const a = emptySnap();
      const b = { ...emptySnap(), furniture: [{ id: "f1", catalogId: "x", name: "X", x: 0, y: 0, width: 1, height: 1, rotation: 0, color: "#000", shape: "x", zIndex: 0 }] };
      usePlannerHistoryStore.getState().pushSnapshot(a);
      const undone = usePlannerHistoryStore.getState().undo(b);
      expect(undone).toEqual(a);
      expect(usePlannerHistoryStore.getState().canRedo()).toBe(true);
      const redone = usePlannerHistoryStore.getState().redo(a);
      expect(redone).toEqual(b);
      usePlannerHistoryStore.getState().setClipboard({ type: "furniture", data: b.furniture[0] });
      usePlannerHistoryStore.getState().clearClipboard();
      expect(usePlannerHistoryStore.getState().clipboard).toBeNull();
    });
  });
});
