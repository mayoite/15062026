/**
 * notificationStore.ts
 *
 * In-app notification queue for the space planner.
 * Handles session events, auto-save confirmations, collaboration alerts,
 * quota warnings, and system-level planner notices.
 *
 * Architecture: This store is planner-owned and must never be imported by configurator.
 * For shared analytics events see features/shared/analytics/types.ts.
 */
import { create } from "zustand";
import { v4 as uuid } from "uuid";

export type NotificationSeverity = "info" | "success" | "warning" | "error";
export type NotificationCategory =
  | "session"
  | "autosave"
  | "collaboration"
  | "quota"
  | "export"
  | "system"
  | "ai";

export interface PlannerNotification {
  id: string;
  severity: NotificationSeverity;
  category: NotificationCategory;
  title: string;
  message?: string;
  /** If set, the notification will auto-dismiss after this many ms */
  autoDismissMs?: number;
  /** Optional action the user can take */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** ISO timestamp when the notification was created */
  createdAt: string;
  read: boolean;
  dismissed: boolean;
}

interface NotificationState {
  notifications: PlannerNotification[];
  /** Total unread count */
  unreadCount: number;

  /** Add a new notification. Returns the notification id. */
  addNotification: (
    params: Omit<PlannerNotification, "id" | "createdAt" | "read" | "dismissed">,
  ) => string;

  /** Mark a notification as read */
  markRead: (id: string) => void;

  /** Mark all notifications as read */
  markAllRead: () => void;

  /** Dismiss (hide) a specific notification */
  dismiss: (id: string) => void;

  /** Remove all dismissed notifications */
  clearDismissed: () => void;

  /** Remove all notifications */
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification(params) {
    const id = uuid();
    const notification: PlannerNotification = {
      ...params,
      id,
      createdAt: new Date().toISOString(),
      read: false,
      dismissed: false,
    };

    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 100), // cap at 100
      unreadCount: s.unreadCount + 1,
    }));

    // Auto-dismiss after timeout if specified
    if (params.autoDismissMs && params.autoDismissMs > 0) {
      setTimeout(() => {
        get().dismiss(id);
      }, params.autoDismissMs);
    }

    return id;
  },

  markRead(id) {
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      const unreadCount = notifications.filter((n) => !n.read && !n.dismissed).length;
      return { notifications, unreadCount };
    });
  },

  markAllRead() {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  dismiss(id) {
    set((s) => {
      const notifications = s.notifications.map((n) =>
        n.id === id ? { ...n, dismissed: true } : n,
      );
      const unreadCount = notifications.filter((n) => !n.read && !n.dismissed).length;
      return { notifications, unreadCount };
    });
  },

  clearDismissed() {
    set((s) => {
      const notifications = s.notifications.filter((n) => !n.dismissed);
      return { notifications, unreadCount: notifications.filter((n) => !n.read).length };
    });
  },

  clearAll() {
    set({ notifications: [], unreadCount: 0 });
  },
}));

// ─── Convenience helpers ──────────────────────────────────────────────────────

/** Shorthand: fire an auto-dismissing info notification */
export function notifyInfo(title: string, message?: string, autoDismissMs = 4000) {
  return useNotificationStore.getState().addNotification({
    severity: "info",
    category: "system",
    title,
    message,
    autoDismissMs,
  });
}

/** Shorthand: fire a success notification */
export function notifySuccess(title: string, message?: string, autoDismissMs = 3000) {
  return useNotificationStore.getState().addNotification({
    severity: "success",
    category: "system",
    title,
    message,
    autoDismissMs,
  });
}

/** Shorthand: fire a warning that doesn't auto-dismiss */
export function notifyWarning(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    severity: "warning",
    category: "system",
    title,
    message,
  });
}

/** Shorthand: fire an error notification */
export function notifyError(title: string, message?: string) {
  return useNotificationStore.getState().addNotification({
    severity: "error",
    category: "system",
    title,
    message,
  });
}

/** Shorthand: auto-save confirmation */
export function notifyAutoSaved() {
  return useNotificationStore.getState().addNotification({
    severity: "success",
    category: "autosave",
    title: "Auto-saved",
    autoDismissMs: 2000,
  });
}
