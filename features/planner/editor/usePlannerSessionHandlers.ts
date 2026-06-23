/**
 * usePlannerSessionHandlers
 *
 * Extracted from PlannerWorkspace to keep that file under 1 000 lines.
 * Owns all save / load / rename / delete / import / export / open-3D callbacks.
 * Integrates IndexedDB offlineStorage and SyncQueueProcessor for offline-first capabilities.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LOCAL_CURRENT_DRAFT_ID,
  createPlannerExportPayload,
  formatPlannerSavedPlanTimestamp,
  sanitizePlannerPlanName,
} from "@/features/planner/lib/sessionState";
import { formatDimensionPair, plannerUnitSystemToMeasurementUnit } from "@/features/planner/lib/measurements";
import { isFeatureEnabled } from "@/features/planner/lib/featureFlags";
import { parsePlannerDocumentImportFile } from "@/features/planner/persistence/plannerImport";
import { normalizePlannerDocument } from "@/features/planner/model";
import type { PlannerSaveSummary } from "@/features/planner/model";
import type { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { loadPlannerDocumentIntoFabric } from "@/features/planner/lib/fabricDocumentBridge";
import type { PlannerSavedEntry } from "@/features/planner/ui/PlannerSessionDialog";
import type { ChangeEvent } from "react";
import {
  deletePlannerDocumentFromSupabase,
  listPlannerDocumentsFromSupabase,
  loadPlannerDocumentFromSupabase,
  savePlannerDocumentToSupabase,
} from "@/features/planner/persistence/plannerSaves";

import {
  offlineStorage,
  updateOfflinePlan,
  deleteOfflinePlan,
  computeContentHash,
  CANONICAL_SCHEMA_VERSION,
  type OfflinePlan,
} from "@/features/planner/store/offlineStorage";
import { SyncQueueProcessor } from "@/features/planner/store/syncQueueProcessor";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";
import { createClient, getBrowserSessionUser } from "@/lib/supabase/client";
import {
  deletePlannerManagedProduct,
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct,
} from "@/features/planner/catalog/plannerManagedProducts.client";
import type { PlannerManagedProductRow, PlannerManagedProductWrite } from "@/features/planner/model";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import {
  deleteProject,
  getPlannerProjectId,
} from "@/features/planner/persistence/persistence";

const EMPTY_FABRIC_SNAPSHOT = JSON.stringify({ objects: [] });

function describeOfflinePlanStatus(plan: OfflinePlan): string {
  if (plan.syncState === "conflict") {
    return "Conflict needs review";
  }
  if (plan.syncState === "sync_failed") {
    return plan.syncErrorCode ? `Sync failed (${plan.syncErrorCode})` : "Sync failed";
  }
  if (plan.syncState === "syncing") {
    return "Syncing to cloud";
  }
  if (plan.syncState === "queued") {
    return "Queued for sync";
  }
  if (plan.localSaveState === "local_save_failed") {
    return "Local save failed";
  }
  if (plan.localSaveState === "saving_local") {
    return "Saving locally";
  }
  if (plan.localSaveState === "dirty") {
    return "Unsaved changes";
  }
  if (plan.syncState === "synced") {
    return "Saved locally and synced";
  }
  return "Saved locally";
}

type UseSessionHandlersOptions = {
  /** Memoised current planner document (already built — do not re-serialise). */
  getCurrentPlannerDocument: () => ReturnType<typeof buildPlannerDocumentFromEditor>;
  importDraft: (json: string) => Promise<void>;
  planId?: string;
  guestMode?: boolean;
  shapeCount: number;
  saveStatus: string;
  fitToContent?: () => number;
  bootstrapEnabled?: boolean;
};

export function usePlannerSessionHandlers({
  getCurrentPlannerDocument,
  importDraft,
  planId,
  guestMode = false,
  shapeCount,
  saveStatus,
  fitToContent,
  bootstrapEnabled = true,
}: UseSessionHandlersOptions) {
  const [planNameOverride, setPlanNameOverride] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(planId ?? null);
  const [sessionStatusMessage, setSessionStatusMessage] = useState<string | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [localDraftVersion, setLocalDraftVersion] = useState(0);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<"customer" | "admin" | null>(null);
  const [plannerManagedProducts, setPlannerManagedProducts] = useState<PlannerManagedProductRow[]>([]);
  const [cloudPlans, setCloudPlans] = useState<PlannerSaveSummary[]>([]);
  const [cloudInventoryVersion, setCloudInventoryVersion] = useState(0);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [draftPlanName, setDraftPlanName] = useState("Workspace Plan");
  const [localDraftSessions, setLocalDraftSessions] = useState<OfflinePlan[]>([]);
  const [currentOfflinePlan, setCurrentOfflinePlan] = useState<OfflinePlan | null>(null);
  const mountedRef = useRef(false);
  const authLoadGenerationRef = useRef(0);
  const cloudInventoryRequestRef = useRef(0);

  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (!bootstrapEnabled) return;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, [bootstrapEnabled]);

  // Load user session on mount
  useEffect(() => {
    if (!bootstrapEnabled) return;
    const generation = ++authLoadGenerationRef.current;
    if (guestMode) {
      if (mountedRef.current) {
        setAuthUserId(null);
        setAuthRole(null);
        setPlannerManagedProducts([]);
      }
      return () => {
        if (authLoadGenerationRef.current === generation) {
          authLoadGenerationRef.current += 1;
        }
      };
    }
    const supabase = createClient();
    void (async () => {
      try {
        const user = await getBrowserSessionUser(supabase);
        if (!mountedRef.current || authLoadGenerationRef.current !== generation) return;
        if (!user?.id) {
          setAuthUserId(null);
          setAuthRole(null);
          setPlannerManagedProducts([]);
          return;
        }
        if (!mountedRef.current || authLoadGenerationRef.current !== generation) return;
        setAuthUserId(user.id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const profileRole =
          profileData && typeof profileData === "object" && "role" in profileData
            ? String((profileData as { role?: string }).role ?? "")
            : "";
        const role = profileRole === "admin" ? "admin" : "customer";
        if (!mountedRef.current || authLoadGenerationRef.current !== generation) return;
        setAuthRole(role);
        if (role === "admin") {
          const managed = await listPlannerManagedProductsFromSupabase(supabase);
          if (!mountedRef.current || authLoadGenerationRef.current !== generation) return;
          setPlannerManagedProducts(managed);
        } else {
          setPlannerManagedProducts([]);
        }
      } catch (err) {
        if (!mountedRef.current || authLoadGenerationRef.current !== generation) return;
        console.error("Failed to retrieve browser session user:", err);
      }
    })();
    return () => {
      if (authLoadGenerationRef.current === generation) {
        authLoadGenerationRef.current += 1;
      }
    };
  }, [bootstrapEnabled, guestMode]);

  const syncCloudInventory = useCallback(async () => {
    const requestId = ++cloudInventoryRequestRef.current;
    if (!authUserId || !isFeatureEnabled("supabaseSync")) {
      if (mountedRef.current && requestId === cloudInventoryRequestRef.current) {
        setCloudPlans([]);
      }
      return;
    }
    try {
      const supabase = createClient();
      const plans = await listPlannerDocumentsFromSupabase(supabase, {
        userId: authUserId,
        accessMode: "owner",
      });
      if (!mountedRef.current || requestId !== cloudInventoryRequestRef.current) return;
      setCloudPlans(plans);
    } catch (err) {
      if (!mountedRef.current || requestId !== cloudInventoryRequestRef.current) return;
      console.error("Failed to load cloud planner documents:", err);
    }
  }, [authUserId]);

  useEffect(() => {
    if (!bootstrapEnabled) return;
    const loadCloudInventory = async () => {
      await syncCloudInventory();
    };
    void loadCloudInventory();
  }, [bootstrapEnabled, cloudInventoryVersion, syncCloudInventory]);

  // Synchronize IndexedDB plans when localDraftVersion changes
  useEffect(() => {
    let active = true;
    const loadOfflineData = async () => {
      if (guestMode || typeof indexedDB === "undefined") {
        if (!active) return;
        setLocalDraftSessions([]);
        setCurrentOfflinePlan(null);
        setDraftPlanName("Workspace Plan");
        return;
      }

      try {
        await offlineStorage.init();
        const allPlans = await offlineStorage.listPlans();
        const current = await offlineStorage.getPlan(LOCAL_CURRENT_DRAFT_ID);
        if (!active) return;
        setLocalDraftSessions(allPlans.filter((p) => p.id !== LOCAL_CURRENT_DRAFT_ID));
        setCurrentOfflinePlan(current);
        if (current) {
          setDraftPlanName(current.document.title ?? current.document.name ?? "Workspace Plan");
        }
      } catch (err) {
        console.error("Failed to load plans from IndexedDB:", err);
      }
    };
    void loadOfflineData();
    return () => {
      active = false;
    };
  }, [guestMode, localDraftVersion]);

  // Sync Queue processing helper
  const handleSyncQueue = useCallback(async () => {
    if (!authUserId || !isOnline) return;
    try {
      const processor = new SyncQueueProcessor({
        userId: authUserId,
        onSyncComplete: (result) => {
          if (!mountedRef.current) return;
          if (result.processed > 0) {
            setLocalDraftVersion((v) => v + 1);
            setSessionStatusMessage(`Synced ${result.processed} plans to cloud.`);
          }
        },
      });
      await processor.processSyncQueue();
    } catch (err) {
      console.error("Failed to process sync queue:", err);
    }
  }, [authUserId, isOnline]);

  // Process sync queue when online status changes to true
  useEffect(() => {
    if (!bootstrapEnabled) return;
    if (isOnline && authUserId) {
      handleSyncQueue();
    }
  }, [authUserId, bootstrapEnabled, handleSyncQueue, isOnline]);

  const draftNameKey = useMemo(
    () => `${LOCAL_CURRENT_DRAFT_ID}:${localDraftVersion}`,
    [localDraftVersion],
  );

  const applyPlannerDocument = useCallback(
    (document: ReturnType<typeof normalizePlannerDocument>) => {
      if (!mountedRef.current) return false;
      const normalized = normalizePlannerDocument(document);
      const loaded = loadPlannerDocumentIntoFabric(importDraft, normalized);
      if (!loaded) {
        setSessionErrorMessage(
          "This planner document could not be loaded into the current workspace.",
        );
        return false;
      }
      setPlanNameOverride(normalized.title ?? normalized.name);
      setActiveDocumentId(normalized.id ?? null);
      setSessionErrorMessage(null);
      setSessionStatusMessage(`Loaded ${normalized.title ?? normalized.name}`);
      setLocalDraftVersion((v) => v + 1);
      return true;
    },
    [importDraft],
  );

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSaveDraft = useCallback(
    async (planName: string) => {
      const draftDocument = getCurrentPlannerDocument();
      const namedDocumentId = activeDocumentId ?? draftDocument.id ?? crypto.randomUUID();
      const normalizedName = sanitizePlannerPlanName(planName);
      const normalizedDraft = normalizePlannerDocument({
        ...draftDocument,
        id: namedDocumentId,
        name: normalizedName,
        title: normalizedName,
      });

      try {
        await offlineStorage.init();

        // 1. Save rolling current draft (LOCAL_CURRENT_DRAFT_ID)
        const currentDraftDoc = normalizePlannerDocument({
          ...normalizedDraft,
          id: LOCAL_CURRENT_DRAFT_ID,
        });
        const existingCurrent = await offlineStorage.getPlan(LOCAL_CURRENT_DRAFT_ID);
        if (existingCurrent) {
          await updateOfflinePlan(LOCAL_CURRENT_DRAFT_ID, currentDraftDoc);
        } else {
          const now = new Date().toISOString();
          const contentHash = await computeContentHash(currentDraftDoc);
          await offlineStorage.savePlan({
            id: LOCAL_CURRENT_DRAFT_ID,
            document: currentDraftDoc,
            localId: null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
            schemaVersion: CANONICAL_SCHEMA_VERSION,
            source: "local",
            contentHash,
            remoteRevision: null,
            localSaveState: "saved_local",
            syncState: "queued",
            syncErrorCode: null,
          });
        }

        // 2. Save named draft
        const existingNamed = await offlineStorage.getPlan(namedDocumentId);
        let savedNamed: OfflinePlan;
        if (existingNamed) {
          savedNamed = await updateOfflinePlan(namedDocumentId, normalizedDraft);
        } else {
          const now = new Date().toISOString();
          const plan: OfflinePlan = {
            id: namedDocumentId,
            document: normalizedDraft,
            localId: null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
            schemaVersion: CANONICAL_SCHEMA_VERSION,
            source: "local",
            contentHash: await computeContentHash(normalizedDraft),
            remoteRevision: null,
            localSaveState: "saved_local",
            syncState: "queued",
            syncErrorCode: null,
          };
          await offlineStorage.savePlan(plan);
          await offlineStorage.addToSyncQueue({
            id: crypto.randomUUID(),
            operation: "create",
            planId: namedDocumentId,
            remoteId: null,
            document: normalizedDraft,
            createdAt: now,
            retryCount: 0,
            lastAttempt: null,
            error: null,
          });
          savedNamed = plan;
        }

        if (!mountedRef.current) return;
        setActiveDocumentId(namedDocumentId);
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(
          `Local session saved ${formatPlannerSavedPlanTimestamp(savedNamed.updatedAt)}`,
        );

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to save draft to IndexedDB:", err);
        if (!mountedRef.current) return;
        setSessionErrorMessage("Local draft save is unavailable in this environment.");
      }
    },
    [activeDocumentId, getCurrentPlannerDocument, handleSyncQueue],
  );

  const handleSaveCloud = useCallback(
    async (planName: string) => {
      if (!isOnline) {
        setSessionErrorMessage("Cloud save is unavailable while offline.");
        return;
      }
      if (!authUserId) {
        setSessionErrorMessage("Sign in is required for cloud save.");
        return;
      }
      if (!isFeatureEnabled("supabaseSync")) {
        setSessionErrorMessage("Cloud save is not enabled in this environment.");
        return;
      }

      setSessionBusy(true);
      try {
        const supabase = createClient();
        const draftDocument = getCurrentPlannerDocument();
        const namedDocumentId = activeDocumentId ?? draftDocument.id ?? crypto.randomUUID();
        const normalizedName = sanitizePlannerPlanName(planName);
        const normalizedDraft = normalizePlannerDocument({
          ...draftDocument,
          id: namedDocumentId,
          name: normalizedName,
          title: normalizedName,
        });

        const saved = await savePlannerDocumentToSupabase(supabase, normalizedDraft, {
          userId: authUserId,
          saveId: namedDocumentId,
        });

        if (!mountedRef.current) return;
        setActiveDocumentId(saved.id ?? namedDocumentId);
        setPlanNameOverride(saved.title ?? saved.name);
        setSessionErrorMessage(null);
        setSessionStatusMessage(`Cloud save updated: ${saved.name}`);
        setCloudInventoryVersion((v) => v + 1);
      } catch (err) {
        if (!mountedRef.current) return;
        setSessionErrorMessage(
          err instanceof Error ? err.message : "Unable to save planner document to cloud.",
        );
      } finally {
        if (mountedRef.current) {
          setSessionBusy(false);
        }
      }
    },
    [activeDocumentId, authUserId, getCurrentPlannerDocument, isOnline],
  );

  const handleSaveAsNewSession = useCallback(
    async (planName: string) => {
      const draftDocument = getCurrentPlannerDocument();
      const newDocumentId = crypto.randomUUID();
      const normalizedName = sanitizePlannerPlanName(
        activeDocumentId ? `${planName} Copy` : planName,
      );
      const normalizedDraft = normalizePlannerDocument({
        ...draftDocument,
        id: newDocumentId,
        name: normalizedName,
        title: normalizedName,
      });

      try {
        await offlineStorage.init();

        // 1. Save rolling current draft (LOCAL_CURRENT_DRAFT_ID)
        const currentDraftDoc = normalizePlannerDocument({
          ...normalizedDraft,
          id: LOCAL_CURRENT_DRAFT_ID,
        });
        const existingCurrent = await offlineStorage.getPlan(LOCAL_CURRENT_DRAFT_ID);
        if (existingCurrent) {
          await updateOfflinePlan(LOCAL_CURRENT_DRAFT_ID, currentDraftDoc);
        } else {
          const now = new Date().toISOString();
          const contentHash = await computeContentHash(currentDraftDoc);
          await offlineStorage.savePlan({
            id: LOCAL_CURRENT_DRAFT_ID,
            document: currentDraftDoc,
            localId: null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
            schemaVersion: CANONICAL_SCHEMA_VERSION,
            source: "local",
            contentHash,
            remoteRevision: null,
            localSaveState: "saved_local",
            syncState: "queued",
            syncErrorCode: null,
          });
        }

        // 2. Save named draft as new plan
        const now = new Date().toISOString();
        const contentHash = await computeContentHash(normalizedDraft);
        const plan: OfflinePlan = {
          id: newDocumentId,
          document: normalizedDraft,
          localId: null,
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: null,
          schemaVersion: CANONICAL_SCHEMA_VERSION,
          source: "local",
          contentHash,
          remoteRevision: null,
          localSaveState: "saved_local",
          syncState: "queued",
          syncErrorCode: null,
        };
        await offlineStorage.savePlan(plan);
        await offlineStorage.addToSyncQueue({
          id: crypto.randomUUID(),
          operation: "create",
          planId: newDocumentId,
          remoteId: null,
          document: normalizedDraft,
          createdAt: now,
          retryCount: 0,
          lastAttempt: null,
          error: null,
        });

        if (!mountedRef.current) return;
        setActiveDocumentId(newDocumentId);
        setPlanNameOverride(normalizedName);
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(
          `New local session created ${formatPlannerSavedPlanTimestamp(plan.updatedAt)}`,
        );

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to save as new session to IndexedDB:", err);
        if (!mountedRef.current) return;
        setSessionErrorMessage("New local session could not be created.");
      }
    },
    [activeDocumentId, getCurrentPlannerDocument, handleSyncQueue],
  );

  // ── Load ──────────────────────────────────────────────────────────────────

  const handleLoadPlan = useCallback(
    async (plan: PlannerSavedEntry) => {
      if (shapeCount > 0 && saveStatus !== "saved") {
        const confirmed = window.confirm(
          `You have unsaved changes (${shapeCount} object${shapeCount !== 1 ? "s" : ""}). Load "${plan.name}" and discard?`,
        );
        if (!confirmed) return;
      }

      if (plan.source === "cloud") {
        if (!authUserId) {
          setSessionErrorMessage("Sign in is required to load cloud plans.");
          return;
        }
        if (!isFeatureEnabled("supabaseSync")) {
          setSessionErrorMessage("Cloud plan loading is not enabled.");
          return;
        }

        setSessionBusy(true);
        try {
          const supabase = createClient();
          const cloudDocument = await loadPlannerDocumentFromSupabase(supabase, plan.id, {
            userId: authUserId,
            ownerUserId: plan.ownerUserId,
            accessMode: plan.accessMode,
          });
          if (!cloudDocument) {
            setSessionErrorMessage("Cloud plan not found.");
            return;
          }
          applyPlannerDocument(cloudDocument);
          if (!mountedRef.current) return;
          setSessionStatusMessage(`Loaded cloud plan: ${cloudDocument.name}`);
        } catch (err) {
          if (!mountedRef.current) return;
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Unable to load cloud plan.",
          );
        } finally {
          if (mountedRef.current) {
            setSessionBusy(false);
          }
        }
        return;
      }

      try {
        await offlineStorage.init();
        const targetId = plan.id === LOCAL_CURRENT_DRAFT_ID ? LOCAL_CURRENT_DRAFT_ID : plan.id;
        const offlinePlan = await offlineStorage.getPlan(targetId);
        if (!offlinePlan) {
          setSessionErrorMessage("Local draft not found.");
          return;
        }
        applyPlannerDocument(offlinePlan.document);
      } catch (err) {
        console.error("Failed to load plan from IndexedDB:", err);
        if (!mountedRef.current) return;
        setSessionErrorMessage("Local draft not found.");
      }
    },
    [applyPlannerDocument, authUserId, saveStatus, shapeCount],
  );

  // ── Delete / rename ───────────────────────────────────────────────────────

  const handleDeletePlan = useCallback(
    async (plan: PlannerSavedEntry) => {
      if (plan.source === "cloud") {
        if (!authUserId) {
          setSessionErrorMessage("Sign in is required to delete cloud plans.");
          return;
        }
        if (plan.accessMode === "admin") {
          setSessionErrorMessage("Admin oversight does not allow browser-side delete for other users' plans.");
          return;
        }

        setSessionBusy(true);
        try {
          const supabase = createClient();
          const deleted = await deletePlannerDocumentFromSupabase(supabase, plan.id, {
            userId: authUserId,
          });
          if (!mountedRef.current) return;
          if (activeDocumentId === plan.id) setActiveDocumentId(null);
          setSessionErrorMessage(null);
          setSessionStatusMessage(deleted ? "Cloud plan removed." : "Cloud plan was not found.");
          setCloudInventoryVersion((v) => v + 1);
        } catch (err) {
          if (!mountedRef.current) return;
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Unable to delete cloud plan.",
          );
        } finally {
          if (mountedRef.current) {
            setSessionBusy(false);
          }
        }
        return;
      }

      if (plan.id === LOCAL_CURRENT_DRAFT_ID) {
        setSessionErrorMessage("Only named local sessions can be deleted here.");
        return;
      }
      try {
        await offlineStorage.init();
        await deleteOfflinePlan(plan.id);
        if (!mountedRef.current) return;
        if (activeDocumentId === plan.id) setActiveDocumentId(null);
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(`Deleted local session: ${plan.name}`);

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to delete plan from IndexedDB:", err);
        if (!mountedRef.current) return;
        setSessionErrorMessage("Local session could not be deleted.");
      }
    },
    [activeDocumentId, authUserId, handleSyncQueue],
  );

  const handleRenamePlan = useCallback(
    async (plan: PlannerSavedEntry, nextNameInput: string) => {
      const nextName = sanitizePlannerPlanName(nextNameInput);

      if (plan.source === "cloud") {
        if (!authUserId) {
          setSessionErrorMessage("Sign in is required to rename cloud plans.");
          return;
        }

        setSessionBusy(true);
        try {
          const supabase = createClient();
          const existing = await loadPlannerDocumentFromSupabase(supabase, plan.id, {
            userId: authUserId,
          });
          if (!existing) {
            setSessionErrorMessage("Cloud plan not found.");
            return;
          }
          const renamed = normalizePlannerDocument({
            ...existing,
            name: nextName,
            title: nextName,
          });
          await savePlannerDocumentToSupabase(supabase, renamed, {
            userId: authUserId,
            saveId: plan.id,
          });
          if (!mountedRef.current) return;
          if (activeDocumentId === plan.id) {
            setPlanNameOverride(nextName);
          }
          setSessionErrorMessage(null);
          setSessionStatusMessage(`Renamed cloud plan to ${nextName}`);
          setCloudInventoryVersion((v) => v + 1);
        } catch (err) {
          if (!mountedRef.current) return;
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Cloud plan could not be renamed.",
          );
        } finally {
          if (mountedRef.current) {
            setSessionBusy(false);
          }
        }
        return;
      }

      if (plan.id === LOCAL_CURRENT_DRAFT_ID) {
        setSessionErrorMessage("Only named local sessions can be renamed here.");
        return;
      }
      try {
        await offlineStorage.init();
        const existing = await offlineStorage.getPlan(plan.id);
        if (!existing) {
          setSessionErrorMessage("Local session not found.");
          return;
        }
        const nextName = sanitizePlannerPlanName(nextNameInput);
        const renamed = normalizePlannerDocument({
          ...existing.document,
          name: nextName,
          title: nextName,
        });

        await updateOfflinePlan(plan.id, renamed);

        if (!mountedRef.current) return;
        if (activeDocumentId === plan.id) {
          const currentDraftDoc = normalizePlannerDocument({
            ...renamed,
            id: LOCAL_CURRENT_DRAFT_ID,
          });
          await updateOfflinePlan(LOCAL_CURRENT_DRAFT_ID, currentDraftDoc);
          setPlanNameOverride(nextName);
        }
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(`Renamed local session to ${nextName}`);

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to rename plan in IndexedDB:", err);
        if (!mountedRef.current) return;
        setSessionErrorMessage("Local session could not be renamed.");
      }
    },
    [activeDocumentId, authUserId, handleSyncQueue],
  );

  // ── Import / Export ───────────────────────────────────────────────────────

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, _planName: string) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (shapeCount > 0 && saveStatus !== "saved") {
        const confirmed = window.confirm(
          `You have unsaved changes (${shapeCount} object${shapeCount !== 1 ? "s" : ""}). Import this file and discard?`,
        );
        if (!confirmed) {
          event.currentTarget.value = "";
          return;
        }
      }
      const parsed = await parsePlannerDocumentImportFile(file);
      if (!parsed.ok || !parsed.document) {
        setSessionErrorMessage(parsed.errors.join(" | "));
        event.currentTarget.value = "";
        return;
      }
      const loaded = applyPlannerDocument(parsed.document);
      if (loaded) {
        const documentId = parsed.document.id ?? crypto.randomUUID();
        const normalizedName = sanitizePlannerPlanName(
          parsed.document.title ?? parsed.document.name,
        );
        const normalizedDocument = normalizePlannerDocument({
          ...parsed.document,
          id: documentId,
          name: normalizedName,
          title: normalizedName,
        });

        try {
          await offlineStorage.init();

          // Save current draft
          const currentDraftDoc = normalizePlannerDocument({
            ...normalizedDocument,
            id: LOCAL_CURRENT_DRAFT_ID,
          });
          const existingCurrent = await offlineStorage.getPlan(LOCAL_CURRENT_DRAFT_ID);
          if (existingCurrent) {
            await updateOfflinePlan(LOCAL_CURRENT_DRAFT_ID, currentDraftDoc);
          } else {
            const now = new Date().toISOString();
            const contentHash = await computeContentHash(currentDraftDoc);
            await offlineStorage.savePlan({
              id: LOCAL_CURRENT_DRAFT_ID,
              document: currentDraftDoc,
              localId: null,
              createdAt: now,
              updatedAt: now,
              lastSyncedAt: null,
              schemaVersion: CANONICAL_SCHEMA_VERSION,
              source: "local",
              contentHash,
              remoteRevision: null,
              localSaveState: "saved_local",
              syncState: "queued",
              syncErrorCode: null,
            });
          }

          // Save named plan
          const namedContentHash = await computeContentHash(normalizedDocument);
          const plan: OfflinePlan = {
            id: documentId,
            document: normalizedDocument,
            localId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncedAt: null,
            schemaVersion: CANONICAL_SCHEMA_VERSION,
            source: "local",
            contentHash: namedContentHash,
            remoteRevision: null,
            localSaveState: "saved_local",
            syncState: "queued",
            syncErrorCode: null,
          };
          await offlineStorage.savePlan(plan);
          await offlineStorage.addToSyncQueue({
            id: crypto.randomUUID(),
            operation: "create",
            planId: documentId,
            remoteId: null,
            document: normalizedDocument,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            lastAttempt: null,
            error: null,
          });

          if (!mountedRef.current) return;
          setActiveDocumentId(documentId);
          setLocalDraftVersion((v) => v + 1);
          setSessionStatusMessage(`Imported planner JSON: ${normalizedName}`);

          handleSyncQueue();
        } catch (err) {
          console.error("Failed to save imported plan to IndexedDB:", err);
        }
      }
      event.currentTarget.value = "";
    },
    [applyPlannerDocument, handleSyncQueue, saveStatus, shapeCount],
  );

  const handleExportJson = useCallback(
    (buildDocument: () => ReturnType<typeof buildPlannerDocumentFromEditor>, planName: string) => {
      const plannerDocument = buildDocument();
      const payload = JSON.stringify(createPlannerExportPayload(plannerDocument), null, 2);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${sanitizePlannerPlanName(planName).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "planner-document"}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setSessionStatusMessage("Planner JSON exported.");
    },
    [],
  );

  // ── Session list ──────────────────────────────────────────────────────────

  const buildSavedEntries = useCallback(
    (activeDocId: string | null): PlannerSavedEntry[] => {
      const namedEntries = localDraftSessions.map((entry) => ({
        id: entry.id,
        name: entry.document.title ?? entry.document.name,
        source: "local" as const,
        isActive: activeDocId === entry.id,
        canDelete: true,
        canRename: true,
        updatedAtLabel: formatPlannerSavedPlanTimestamp(
          entry.updatedAt ?? entry.createdAt,
        ),
        itemCount: entry.document.itemCount,
        detail: `${entry.document.roomWidthMm}mm x ${entry.document.roomDepthMm}mm`,
        subtitle: entry.document.projectName ?? "Named local session",
        statusLabel: describeOfflinePlanStatus(entry),
      }));

      const cloudEntries: PlannerSavedEntry[] = isFeatureEnabled("supabaseSync")
        ? cloudPlans.map((plan) => ({
            id: plan.id,
            name: plan.name,
            source: "cloud" as const,
            isActive: activeDocId === plan.id,
            canDelete: true,
            canRename: true,
            updatedAtLabel: formatPlannerSavedPlanTimestamp(plan.updated_at),
            itemCount: plan.item_count,
            detail: formatDimensionPair(
              plan.room_width_mm,
              plan.room_depth_mm,
              plannerUnitSystemToMeasurementUnit(plan.unit_system),
            ),
            subtitle: plan.project_name ?? "Cloud saved plan",
          }))
        : [];

      const localEntries = !currentOfflinePlan
        ? namedEntries
        : [
            {
              id: LOCAL_CURRENT_DRAFT_ID,
              name: `${currentOfflinePlan.document.title ?? currentOfflinePlan.document.name} (Current Draft)`,
              source: "local" as const,
              isActive: !activeDocId || activeDocId === LOCAL_CURRENT_DRAFT_ID,
              canDelete: false,
              canRename: false,
              updatedAtLabel: formatPlannerSavedPlanTimestamp(
                currentOfflinePlan.updatedAt ?? currentOfflinePlan.createdAt,
              ),
              itemCount: currentOfflinePlan.document.itemCount,
              detail: `${currentOfflinePlan.document.roomWidthMm}mm x ${currentOfflinePlan.document.roomDepthMm}mm`,
              subtitle: currentOfflinePlan.document.projectName ?? "Rolling browser draft",
              statusLabel: describeOfflinePlanStatus(currentOfflinePlan),
            },
            ...namedEntries,
          ];

      return [...localEntries, ...cloudEntries];
    },
    [cloudPlans, currentOfflinePlan, localDraftSessions],
  );

  const handleUpsertManagedProduct = useCallback(
    async (product: PlannerManagedProductWrite) => {
      if (authRole !== "admin") {
        setSessionErrorMessage("Admin role is required to manage planner products.");
        return;
      }
      const supabase = createClient();
      setSessionBusy(true);
      try {
        const saved = await upsertPlannerManagedProduct(supabase, product);
        if (!mountedRef.current) return;
        setPlannerManagedProducts((current) =>
          [...current.filter((entry) => entry.id !== saved.id), saved].sort((a, b) =>
            b.updated_at.localeCompare(a.updated_at),
          ),
        );
        await usePlannerCatalogStore.getState().hydrateCatalog();
        setSessionStatusMessage(`Catalog product saved: ${saved.name}`);
        setSessionErrorMessage(null);
      } catch (error) {
        if (!mountedRef.current) return;
        setSessionErrorMessage(
          error instanceof Error ? error.message : "Unable to save planner-managed product.",
        );
      } finally {
        if (mountedRef.current) {
          setSessionBusy(false);
        }
      }
    },
    [authRole],
  );

  const handleDeleteManagedProduct = useCallback(
    async (id: string) => {
      if (authRole !== "admin") {
        setSessionErrorMessage("Admin role is required to manage planner products.");
        return;
      }
      const supabase = createClient();
      setSessionBusy(true);
      try {
        const deleted = await deletePlannerManagedProduct(supabase, id);
        if (deleted) {
          if (!mountedRef.current) return;
          setPlannerManagedProducts((current) => current.filter((entry) => entry.id !== id));
          await usePlannerCatalogStore.getState().hydrateCatalog();
        }
        setSessionStatusMessage(deleted ? "Catalog product removed." : "Product was not found.");
        setSessionErrorMessage(null);
      } catch (error) {
        if (!mountedRef.current) return;
        setSessionErrorMessage(
          error instanceof Error ? error.message : "Unable to delete planner-managed product.",
        );
      } finally {
        if (mountedRef.current) {
          setSessionBusy(false);
        }
      }
    },
    [authRole],
  );

  const handleStartFreshLayout = useCallback(async () => {
    const projectId = getPlannerProjectId(guestMode, planId);
    setSessionBusy(true);
    try {
      await deleteProject(projectId);
      await importDraft(EMPTY_FABRIC_SNAPSHOT);
      fitToContent?.();
      if (!mountedRef.current) return;
      setPlanNameOverride("Workspace Plan");
      setActiveDocumentId(null);
      setSessionStatusMessage("Started a new blank layout.");
      setSessionErrorMessage(null);
      setLocalDraftVersion((v) => v + 1);
    } catch (error) {
      if (!mountedRef.current) return;
      setSessionErrorMessage(
        error instanceof Error ? error.message : "Unable to start a fresh layout.",
      );
    } finally {
      if (mountedRef.current) {
        setSessionBusy(false);
      }
    }
  }, [fitToContent, guestMode, importDraft, planId]);

  return {
    // state
    planNameOverride,
    setPlanNameOverride,
    activeDocumentId,
    setActiveDocumentId,
    sessionStatusMessage,
    setSessionStatusMessage,
    sessionErrorMessage,
    setSessionErrorMessage,
    sessionBusy,
    localDraftVersion,
    currentDraftScope: { documentId: LOCAL_CURRENT_DRAFT_ID },
    draftPlanName,
    draftNameKey,
    authUserId,
    authRole,
    isAdmin: authRole === "admin",
    plannerManagedProducts,
    // actions
    applyPlannerDocument,
    handleSaveCloud,
    handleSaveDraft,
    handleSaveAsNewSession,
    handleLoadPlan,
    handleDeletePlan,
    handleRenamePlan,
    handleImportFileChange,
    handleExportJson,
    buildSavedEntries,
    handleUpsertManagedProduct,
    handleDeleteManagedProduct,
    handleStartFreshLayout,
  };
}
