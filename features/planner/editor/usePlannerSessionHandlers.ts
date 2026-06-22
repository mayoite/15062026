/**
 * usePlannerSessionHandlers
 *
 * Extracted from PlannerWorkspace to keep that file under 1 000 lines.
 * Owns all save / load / rename / delete / import / export / open-3D callbacks.
 * Integrates IndexedDB offlineStorage and SyncQueueProcessor for offline-first capabilities.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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

type UseSessionHandlersOptions = {
  /** Memoised current planner document (already built — do not re-serialise). */
  getCurrentPlannerDocument: () => ReturnType<typeof buildPlannerDocumentFromEditor>;
  importDraft: (json: string) => Promise<void>;
  planId?: string;
  guestMode?: boolean;
  shapeCount: number;
  saveStatus: string;
  fitToContent?: () => number;
};

export function usePlannerSessionHandlers({
  getCurrentPlannerDocument,
  importDraft,
  planId,
  guestMode = false,
  shapeCount,
  saveStatus,
  fitToContent,
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

  const isOnline = useOnlineStatus();

  // Load user session on mount
  useEffect(() => {
    const supabase = createClient();
    void (async () => {
      try {
        const user = await getBrowserSessionUser(supabase);
        if (!user?.id) {
          setAuthUserId(null);
          setAuthRole(null);
          setPlannerManagedProducts([]);
          return;
        }
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
        setAuthRole(role);
        if (role === "admin") {
          const managed = await listPlannerManagedProductsFromSupabase(supabase);
          setPlannerManagedProducts(managed);
        } else {
          setPlannerManagedProducts([]);
        }
      } catch (err) {
        console.error("Failed to retrieve browser session user:", err);
      }
    })();
  }, []);

  const syncCloudInventory = useCallback(async () => {
    if (!authUserId || !isFeatureEnabled("supabaseSync")) {
      setCloudPlans([]);
      return;
    }
    try {
      const supabase = createClient();
      const plans = await listPlannerDocumentsFromSupabase(supabase, {
        userId: authUserId,
        accessMode: "owner",
      });
      setCloudPlans(plans);
    } catch (err) {
      console.error("Failed to load cloud planner documents:", err);
    }
  }, [authUserId]);

  useEffect(() => {
    void syncCloudInventory();
  }, [syncCloudInventory, cloudInventoryVersion]);

  // Synchronize IndexedDB plans when localDraftVersion changes
  useEffect(() => {
    let active = true;
    const loadOfflineData = async () => {
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
    loadOfflineData();
    return () => {
      active = false;
    };
  }, [localDraftVersion]);

  // Sync Queue processing helper
  const handleSyncQueue = useCallback(async () => {
    if (!authUserId || !isOnline) return;
    try {
      const processor = new SyncQueueProcessor({
        userId: authUserId,
        onSyncComplete: (result) => {
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
    if (isOnline && authUserId) {
      handleSyncQueue();
    }
  }, [isOnline, authUserId, handleSyncQueue]);

  const draftNameKey = useMemo(
    () => `${LOCAL_CURRENT_DRAFT_ID}:${localDraftVersion}`,
    [localDraftVersion],
  );

  const applyPlannerDocument = useCallback(
    (document: ReturnType<typeof normalizePlannerDocument>) => {
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
          await offlineStorage.savePlan({
            id: LOCAL_CURRENT_DRAFT_ID,
            document: currentDraftDoc,
            localId: null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
            syncStatus: "pending",
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
            syncStatus: "pending",
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

        setActiveDocumentId(namedDocumentId);
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(
          `Local session saved ${formatPlannerSavedPlanTimestamp(savedNamed.updatedAt)}`,
        );

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to save draft to IndexedDB:", err);
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

        setActiveDocumentId(saved.id ?? namedDocumentId);
        setPlanNameOverride(saved.title ?? saved.name);
        setSessionErrorMessage(null);
        setSessionStatusMessage(`Cloud save updated: ${saved.name}`);
        setCloudInventoryVersion((v) => v + 1);
      } catch (err) {
        setSessionErrorMessage(
          err instanceof Error ? err.message : "Unable to save planner document to cloud.",
        );
      } finally {
        setSessionBusy(false);
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
          await offlineStorage.savePlan({
            id: LOCAL_CURRENT_DRAFT_ID,
            document: currentDraftDoc,
            localId: null,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: null,
            syncStatus: "pending",
          });
        }

        // 2. Save named draft as new plan
        const now = new Date().toISOString();
        const plan: OfflinePlan = {
          id: newDocumentId,
          document: normalizedDraft,
          localId: null,
          createdAt: now,
          updatedAt: now,
          lastSyncedAt: null,
          syncStatus: "pending",
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
          setSessionStatusMessage(`Loaded cloud plan: ${cloudDocument.name}`);
        } catch (err) {
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Unable to load cloud plan.",
          );
        } finally {
          setSessionBusy(false);
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
          if (activeDocumentId === plan.id) setActiveDocumentId(null);
          setSessionErrorMessage(null);
          setSessionStatusMessage(deleted ? "Cloud plan removed." : "Cloud plan was not found.");
          setCloudInventoryVersion((v) => v + 1);
        } catch (err) {
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Unable to delete cloud plan.",
          );
        } finally {
          setSessionBusy(false);
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
        if (activeDocumentId === plan.id) setActiveDocumentId(null);
        setLocalDraftVersion((v) => v + 1);
        setSessionErrorMessage(null);
        setSessionStatusMessage(`Deleted local session: ${plan.name}`);

        handleSyncQueue();
      } catch (err) {
        console.error("Failed to delete plan from IndexedDB:", err);
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
          if (activeDocumentId === plan.id) {
            setPlanNameOverride(nextName);
          }
          setSessionErrorMessage(null);
          setSessionStatusMessage(`Renamed cloud plan to ${nextName}`);
          setCloudInventoryVersion((v) => v + 1);
        } catch (err) {
          setSessionErrorMessage(
            err instanceof Error ? err.message : "Cloud plan could not be renamed.",
          );
        } finally {
          setSessionBusy(false);
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
        setSessionErrorMessage("Local session could not be renamed.");
      }
    },
    [activeDocumentId, handleSyncQueue],
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
            await offlineStorage.savePlan({
              id: LOCAL_CURRENT_DRAFT_ID,
              document: currentDraftDoc,
              localId: null,
              createdAt: now,
              updatedAt: now,
              lastSyncedAt: null,
              syncStatus: "pending",
            });
          }

          // Save named plan
          const plan: OfflinePlan = {
            id: documentId,
            document: normalizedDocument,
            localId: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncedAt: null,
            syncStatus: "pending",
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
        statusLabel:
          entry.document.unitSystem === "imperial" ? "Imperial units" : "Metric units",
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
              statusLabel:
                currentOfflinePlan.document.unitSystem === "imperial"
                  ? "Imperial units"
                  : "Metric units",
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
        setPlannerManagedProducts((current) =>
          [...current.filter((entry) => entry.id !== saved.id), saved].sort((a, b) =>
            b.updated_at.localeCompare(a.updated_at),
          ),
        );
        await usePlannerCatalogStore.getState().hydrateCatalog();
        setSessionStatusMessage(`Catalog product saved: ${saved.name}`);
        setSessionErrorMessage(null);
      } catch (error) {
        setSessionErrorMessage(
          error instanceof Error ? error.message : "Unable to save planner-managed product.",
        );
      } finally {
        setSessionBusy(false);
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
          setPlannerManagedProducts((current) => current.filter((entry) => entry.id !== id));
          await usePlannerCatalogStore.getState().hydrateCatalog();
        }
        setSessionStatusMessage(deleted ? "Catalog product removed." : "Product was not found.");
        setSessionErrorMessage(null);
      } catch (error) {
        setSessionErrorMessage(
          error instanceof Error ? error.message : "Unable to delete planner-managed product.",
        );
      } finally {
        setSessionBusy(false);
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
      setPlanNameOverride("Workspace Plan");
      setActiveDocumentId(null);
      setSessionStatusMessage("Started a new blank layout.");
      setSessionErrorMessage(null);
      setLocalDraftVersion((v) => v + 1);
    } catch (error) {
      setSessionErrorMessage(
        error instanceof Error ? error.message : "Unable to start a fresh layout.",
      );
    } finally {
      setSessionBusy(false);
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
