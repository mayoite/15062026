import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { 
  useNotificationStore, 
  notifyInfo, 
  notifySuccess, 
  notifyWarning, 
  notifyError, 
  notifyAutoSaved 
} from "@/features/planner/store/notificationStore";

describe("notificationStore", () => {
  beforeEach(() => {
    const store = useNotificationStore.getState();
    store.clearAll();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should add a notification and return an id", () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({
      severity: "info",
      category: "system",
      title: "Test Title"
    });
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]?.id).toBe(id);
    expect(state.notifications[0]?.title).toBe("Test Title");
    expect(state.unreadCount).toBe(1);
  });

  it("should cap notifications at 100", () => {
    const { addNotification } = useNotificationStore.getState();
    for (let i = 0; i < 105; i++) {
      addNotification({ severity: "info", category: "system", title: `Msg ${i}` });
    }
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(100);
    expect(state.unreadCount).toBe(105);
  });

  it("should auto-dismiss notifications if autoDismissMs is provided", () => {
    const { addNotification } = useNotificationStore.getState();
    const id = addNotification({
      severity: "info",
      category: "system",
      title: "Test Title",
      autoDismissMs: 1000
    });
    
    let state = useNotificationStore.getState();
    expect(state.notifications[0]?.dismissed).toBe(false);
    expect(state.unreadCount).toBe(1);
    
    vi.advanceTimersByTime(1000);
    
    state = useNotificationStore.getState();
    const notification = state.notifications.find(n => n.id === id);
    expect(notification?.dismissed).toBe(true);
    expect(state.unreadCount).toBe(0); // Dismissed messages don't count towards unread
  });

  it("should mark a notification as read", () => {
    const { addNotification, markRead } = useNotificationStore.getState();
    const id = addNotification({ severity: "info", category: "system", title: "Test" });
    
    markRead(id);
    
    const state = useNotificationStore.getState();
    expect(state.notifications[0]?.read).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should mark all notifications as read", () => {
    const { addNotification, markAllRead } = useNotificationStore.getState();
    addNotification({ severity: "info", category: "system", title: "Test 1" });
    addNotification({ severity: "info", category: "system", title: "Test 2" });
    
    expect(useNotificationStore.getState().unreadCount).toBe(2);
    
    markAllRead();
    
    const state = useNotificationStore.getState();
    expect(state.notifications.every(n => n.read)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it("should clear dismissed notifications", () => {
    const { addNotification, dismiss, clearDismissed } = useNotificationStore.getState();
    const id1 = addNotification({ severity: "info", category: "system", title: "Test 1" });
    const id2 = addNotification({ severity: "info", category: "system", title: "Test 2" });
    
    dismiss(id1);
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    
    clearDismissed();
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]?.id).toBe(id2);
  });

  it("should clear all notifications", () => {
    const { addNotification, clearAll } = useNotificationStore.getState();
    addNotification({ severity: "info", category: "system", title: "Test 1" });
    
    clearAll();
    
    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  describe("convenience helpers", () => {
    it("should call notifyInfo properly", () => {
      const id = notifyInfo("Info Title", "Info Msg");
      const state = useNotificationStore.getState();
      const n = state.notifications.find(x => x.id === id);
      expect(n?.severity).toBe("info");
      expect(n?.category).toBe("system");
      expect(n?.title).toBe("Info Title");
      expect(n?.message).toBe("Info Msg");
    });

    it("should call notifySuccess properly", () => {
      const id = notifySuccess("Success Title");
      const state = useNotificationStore.getState();
      const n = state.notifications.find(x => x.id === id);
      expect(n?.severity).toBe("success");
    });

    it("should call notifyWarning properly", () => {
      const id = notifyWarning("Warning Title");
      const state = useNotificationStore.getState();
      const n = state.notifications.find(x => x.id === id);
      expect(n?.severity).toBe("warning");
    });

    it("should call notifyError properly", () => {
      const id = notifyError("Error Title");
      const state = useNotificationStore.getState();
      const n = state.notifications.find(x => x.id === id);
      expect(n?.severity).toBe("error");
    });

    it("should call notifyAutoSaved properly", () => {
      const id = notifyAutoSaved();
      const state = useNotificationStore.getState();
      const n = state.notifications.find(x => x.id === id);
      expect(n?.severity).toBe("success");
      expect(n?.category).toBe("autosave");
      expect(n?.title).toBe("Auto-saved");
    });
  });
});

