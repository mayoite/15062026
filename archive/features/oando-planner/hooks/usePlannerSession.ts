"use client";
/**
 * usePlannerSession - Handles planner session management with online/offline persistence
 * Prefers online save, falls back gracefully, surfaces sync state in UI
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { PlannerDocument } from "../model/plannerDocument";
import { createEmptyPlannerDocument } from "../model/plannerDocument";
import {
  savePlannerDocument,
  loadPlannerDocument,
  listPlannerDocuments,
  deletePlannerDocument,
  type PlannerPersistenceError,
} from "../data/plannerPersistence";

// Sync state types
export type SyncStatus = 
  | "idle" 
  | "saving" 
  | "saved" 
  | "syncing" 
  | "offline" 
  | "error";

export type SaveSource = "manual" | "auto" | "recovery";

interface SessionState {
  document: PlannerDocument;
  documentId: string | null;
  userId: string | null;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  hasUnsavedChanges: boolean;
  isOnline: boolean;
  error: string | null;
  saveSource: SaveSource | null;
}

interface UsePlannerSessionOptions {
  /**
   * Owner of the planner documents. Persistence now runs through Drizzle
   * (server-side), so the caller supplies the authenticated user id instead
   * of a Supabase client.
   */
  userId: string | null;
  autoSaveInterval?: number; // milliseconds, default 30000 (30s)
  enableOffline?: boolean;
}

export function usePlannerSession(options: UsePlannerSessionOptions) {
  const {
    userId,
    autoSaveInterval = 30000,
    enableOffline = true,
  } = options;

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>({
    document: createEmptyPlannerDocument(),
    documentId: null,
    userId: userId ?? null,
    syncStatus: "idle",
    lastSyncedAt: null,
    hasUnsavedChanges: false,
    isOnline: navigator.onLine,
    error: null,
    saveSource: null,
  });

  // Refs for timers and state
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<PlannerDocument | null>(null);
  const prevUserIdRef = useRef<string | null>(userId ?? null);

  // Keep session userId in sync with the authenticated user from options.
  // Adjust state during render when the prop changes (React-recommended) rather
  // than in an effect, which would trigger an extra cascading render.
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const normalizedUserId = userId ?? null;
  if (prevUserIdRef.current !== normalizedUserId) {
    prevUserIdRef.current = normalizedUserId;
    setSessionState(prev => ({ ...prev, userId: normalizedUserId }));
  }


  // LocalStorage fallback
  const saveToLocalStorage = useCallback((document: PlannerDocument, source: SaveSource) => {
    try {
      const draftKey = "planner-draft";
      const draftData = {
        document,
        savedAt: new Date().toISOString(),
        source,
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (error) {
      console.error("LocalStorage save failed:", error);
    }
  }, []);

  // Save document with online/offline handling
  const saveDocument = useCallback(async (
    document: PlannerDocument,
    source: SaveSource = "manual"
  ): Promise<void> => {
    if (!sessionState.userId) {
      console.error("Cannot save planner document without an authenticated user");
      return;
    }

    setSessionState(prev => ({
      ...prev,
      syncStatus: prev.isOnline ? "saving" : "offline",
      error: null,
    }));

    try {
      if (sessionState.isOnline) {
        // Online save via Drizzle persistence
        const result = await savePlannerDocument(
          sessionState.userId,
          document,
          sessionState.documentId ?? undefined
        );

        if (!result.success) {
          throw result.error;
        }

        setSessionState(prev => ({
          ...prev,
          document: result.document,
          documentId: result.id,
          syncStatus: "saved",
          lastSyncedAt: new Date().toISOString(),
          hasUnsavedChanges: false,
          error: null,
          saveSource: source,
        }));

        pendingSaveRef.current = null;

        // Clear success status after 2 seconds
        setTimeout(() => {
          setSessionState(prev => ({
            ...prev,
            syncStatus: "idle",
          }));
        }, 2000);
      } else if (enableOffline) {
        // Offline save to localStorage
        saveToLocalStorage(document, source);
        pendingSaveRef.current = document;
        
        setSessionState(prev => ({
          ...prev,
          document,
          syncStatus: "offline",
          hasUnsavedChanges: false,
          saveSource: source,
        }));
      }
    } catch (error) {
      const persistenceError = error as PlannerPersistenceError;
      console.error("Save failed:", persistenceError);
      
      // Fallback to localStorage on error
      if (enableOffline) {
        saveToLocalStorage(document, source);
        pendingSaveRef.current = document;
      }
      
      setSessionState(prev => ({
        ...prev,
        syncStatus: "error",
        error: persistenceError.message || "Save failed",
        saveSource: source,
      }));
    }
  }, [sessionState.isOnline, sessionState.userId, sessionState.documentId, enableOffline, saveToLocalStorage]);

  // Monitor online/offline status

  useEffect(() => {
    const handleOnline = () => {
      setSessionState(prev => ({
        ...prev,
        isOnline: true,
        syncStatus: prev.hasUnsavedChanges ? "syncing" : "idle",
      }));
      
      // Try to sync pending changes
      if (pendingSaveRef.current) {
        saveDocument(pendingSaveRef.current, "recovery");
      }
    };

    const handleOffline = () => {
      setSessionState(prev => ({
        ...prev,
        isOnline: false,
        syncStatus: "offline",
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [saveDocument]);

  // Auto-save with debouncing
  useEffect(() => {
    if (autoSaveInterval > 0 && sessionState.hasUnsavedChanges && sessionState.isOnline) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      autoSaveTimerRef.current = setTimeout(() => {
        if (sessionState.hasUnsavedChanges) {
          saveDocument(sessionState.document, "auto");
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [sessionState.hasUnsavedChanges, sessionState.document, sessionState.isOnline, autoSaveInterval, saveDocument]);


  // Load from localStorage
  const loadFromLocalStorage = useCallback((): PlannerDocument | null => {
    try {
      const draftKey = "planner-draft";
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        return parsed.document;
      }
    } catch (error) {
      console.error("LocalStorage load failed:", error);
    }
    return null;
  }, []);

  // Load document by ID
  const loadDocument = useCallback(async (documentId: string): Promise<void> => {
    setSessionState(prev => ({
      ...prev,
      syncStatus: "saving",
      error: null,
    }));

    try {
      const result = await loadPlannerDocument(documentId);

      if (!result.success) {
        throw result.error;
      }

      setSessionState(prev => ({
        ...prev,
        document: result.document,
        documentId,
        syncStatus: "saved",
        lastSyncedAt: new Date().toISOString(),
        hasUnsavedChanges: false,
        error: null,
      }));
    } catch (error) {
      const persistenceError = error as PlannerPersistenceError;
      console.error("Load failed:", persistenceError);
      
      setSessionState(prev => ({
        ...prev,
        syncStatus: "error",
        error: persistenceError.message || "Load failed",
      }));
    }
  }, []);

  // Update document locally (triggers auto-save)
  const updateDocument = useCallback((updates: Partial<PlannerDocument>) => {
    setSessionState(prev => {
      const updated = {
        ...prev.document,
        ...updates,
      };
      return {
        ...prev,
        document: updated,
        hasUnsavedChanges: true,
      };
    });
  }, []);

  // Create new document
  const newDocument = useCallback((overrides: Partial<PlannerDocument> = {}) => {
    const newDoc = createEmptyPlannerDocument(overrides);
    setSessionState(prev => ({
      ...prev,
      document: newDoc,
      documentId: null,
      hasUnsavedChanges: true,
      syncStatus: "idle",
      lastSyncedAt: null,
    }));
  }, []);

  // List user documents
  const listDocuments = useCallback(async (): Promise<Array<{ id: string; document: PlannerDocument }>> => {
    if (!sessionState.userId) {
      return [];
    }

    const result = await listPlannerDocuments(sessionState.userId);
    return result.success ? result.documents : [];
  }, [sessionState.userId]);

  // Delete document
  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    const result = await deletePlannerDocument(documentId);
    return result.success;
  }, []);

  // Check for recovery draft
  const checkForRecovery = useCallback((): boolean => {
    const draft = loadFromLocalStorage();
    return draft !== null;
  }, [loadFromLocalStorage]);

  // Restore from draft
  const restoreFromDraft = useCallback((): boolean => {
    const draft = loadFromLocalStorage();
    if (draft) {
      setSessionState(prev => ({
        ...prev,
        document: draft,
        documentId: null,
        hasUnsavedChanges: true,
        syncStatus: "idle",
        saveSource: "recovery",
      }));
      return true;
    }
    return false;
  }, [loadFromLocalStorage]);

  // Clear draft
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem("planner-draft");
    } catch (error) {
      console.error("Failed to clear draft:", error);
    }
  }, []);

  return {
    // State
    document: sessionState.document,
    documentId: sessionState.documentId,
    userId: sessionState.userId,
    syncStatus: sessionState.syncStatus,
    lastSyncedAt: sessionState.lastSyncedAt,
    hasUnsavedChanges: sessionState.hasUnsavedChanges,
    isOnline: sessionState.isOnline,
    error: sessionState.error,
    saveSource: sessionState.saveSource,
    
    // Actions
    saveDocument,
    loadDocument,
    updateDocument,
    newDocument,
    listDocuments,
    deleteDocument,
    
    // Recovery
    checkForRecovery,
    restoreFromDraft,
    clearDraft,
  };
}
