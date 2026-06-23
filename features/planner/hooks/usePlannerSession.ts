"use client";

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  deletePlannerDocumentFromSupabase,
  listPlannerDocumentsFromSupabase,
  loadPlannerDocumentFromSupabase,
  savePlannerDocumentToSupabase,
  type PlannerRepositoryAccessMode,
} from "../persistence/plannerSaves";
import {
  deletePlannerDraftDocument,
  loadPlannerDraftDocument,
  savePlannerDraftDocument,
} from "../persistence/plannerDraft";
import {
  deletePlannerManagedProduct,
  listPlannerManagedProductsFromSupabase,
  upsertPlannerManagedProduct,
} from "../catalog/plannerManagedProducts.client";
import { parsePlannerDocumentImportFile } from "../persistence/plannerImport";
import type {
  PlannerDocument,
  PlannerManagedProductRow,
  PlannerManagedProductWrite,
  PlannerSaveSummary,
} from "../model";
import {
  buildPlannerToolbarSessionStateLabel,
  createPlannerExportPayload,
  formatPlannerSavedPlanTimestamp,
  LOCAL_CURRENT_DRAFT_ID,
  sanitizePlannerPlanName,
  VIEWER_PREVIEW_DRAFT_ID,
} from "../lib/sessionState";
import { formatDimensionPair, plannerUnitSystemToMeasurementUnit } from "../lib/measurements";
import type { PlannerSavedEntry } from "../ui/PlannerSessionDialog";
import { getBrowserSessionUser } from "@/lib/supabase/client";

interface PlannerSessionOptions {
  activeDocumentId: string | null;
  planName: string;
  setActiveDocumentId: (value: string | null) => void;
  setPlanName: (value: string) => void;
  supabase: SupabaseClient | null;
  router: { push: (href: string) => void };
  buildCurrentPlannerDocument: () => PlannerDocument;
  applyPlannerDocument: (document: PlannerDocument) => void;
  bootstrapEnabled?: boolean;
}

interface PlannerDraftScope {
  documentId: string;
  userId?: string;
}

function buildPlannerOwnerLabel(userId?: string | null) {
  if (!userId) return "Unknown owner";
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`;
}

function buildPlannerSavedEntries({
  cloudPlans,
  getDraftScope,
  accessMode = "owner",
  includeLocalDraft = true,
}: {
  cloudPlans: PlannerSaveSummary[];
  getDraftScope: (documentId: string) => PlannerDraftScope;
  accessMode?: PlannerRepositoryAccessMode;
  includeLocalDraft?: boolean;
}) {
  const entries: PlannerSavedEntry[] = [];
  const localDraft = includeLocalDraft ? loadPlannerDraftDocument(getDraftScope(LOCAL_CURRENT_DRAFT_ID)) : null;

  if (localDraft) {
    entries.push({
      id: LOCAL_CURRENT_DRAFT_ID,
      name: localDraft.name,
      source: "local",
      accessMode: "owner",
      canDelete: true,
      updatedAtLabel: formatPlannerSavedPlanTimestamp(localDraft.updatedAt ?? localDraft.createdAt),
      itemCount: localDraft.itemCount,
      detail: formatDimensionPair(
        localDraft.roomWidthMm,
        localDraft.roomDepthMm,
        plannerUnitSystemToMeasurementUnit(localDraft.unitSystem),
      ),
    });
  }

  cloudPlans.forEach((plan) => {
    entries.push({
      id: plan.id,
      name: plan.name,
      source: "cloud",
      accessMode,
      ownerUserId: plan.user_id ?? undefined,
      ownerLabel: accessMode === "admin" ? buildPlannerOwnerLabel(plan.user_id) : undefined,
      canDelete: accessMode === "owner",
      updatedAtLabel: formatPlannerSavedPlanTimestamp(plan.updated_at),
      itemCount: plan.item_count,
      detail: formatDimensionPair(
        plan.room_width_mm,
        plan.room_depth_mm,
        plannerUnitSystemToMeasurementUnit(plan.unit_system),
      ),
    });
  });

  return entries;
}

export function usePlannerSession({
  activeDocumentId,
  planName,
  setActiveDocumentId,
  setPlanName,
  supabase,
  router,
  buildCurrentPlannerDocument,
  applyPlannerDocument,
  bootstrapEnabled = true,
}: PlannerSessionOptions) {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<"customer" | "admin" | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cloudPlans, setCloudPlans] = useState<PlannerSaveSummary[]>([]);
  const [adminCloudPlans, setAdminCloudPlans] = useState<PlannerSaveSummary[]>([]);
  const [plannerManagedProducts, setPlannerManagedProducts] = useState<PlannerManagedProductRow[]>([]);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionStatusMessage, setSessionStatusMessage] = useState<string | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [localDraftVersion, setLocalDraftVersion] = useState(0);
  const [activeCloudAccessMode, setActiveCloudAccessMode] = useState<PlannerRepositoryAccessMode>("owner");
  const [activeCloudOwnerUserId, setActiveCloudOwnerUserId] = useState<string | null>(null);

  const reportSessionStatus = useCallback((message: string | null) => {
    setSessionStatusMessage(message);
  }, []);

  const reportSessionError = useCallback((message: string | null) => {
    setSessionErrorMessage(message);
  }, []);

  const clearSessionError = useCallback(() => {
    setSessionErrorMessage(null);
  }, []);

  const getDraftScope = useCallback(
    (documentId: string) => ({
      documentId,
      userId: authUserId ?? undefined,
    }),
    [authUserId],
  );

  const syncSessionInventory = useCallback(async () => {
    if (!supabase) {
      setAuthUserId(null);
      setAuthRole(null);
      setIsAuthenticated(false);
      setCloudPlans([]);
      setAdminCloudPlans([]);
      setPlannerManagedProducts([]);
      setLocalDraftVersion((value) => value + 1);
      return;
    }

    try {
      const user = await getBrowserSessionUser(supabase);

      const nextUserId = user?.id?.trim() || null;
      setAuthUserId(nextUserId);
      setIsAuthenticated(Boolean(nextUserId));

      if (!nextUserId) {
        setAuthRole(null);
        setCloudPlans([]);
        setAdminCloudPlans([]);
        setPlannerManagedProducts([]);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", nextUserId)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      const nextRole = profileData?.role === "admin" ? "admin" : "customer";
      setAuthRole(nextRole);

      const savedPlans = await listPlannerDocumentsFromSupabase(supabase, {
        userId: nextUserId,
        accessMode: "owner",
      });
      setCloudPlans(savedPlans);

      if (nextRole === "admin") {
        const [allPlans, managedProducts] = await Promise.all([
          listPlannerDocumentsFromSupabase(supabase, { userId: nextUserId, accessMode: "admin" }),
          listPlannerManagedProductsFromSupabase(supabase),
        ]);

        setAdminCloudPlans(allPlans);
        setPlannerManagedProducts(managedProducts);
      } else {
        setAdminCloudPlans([]);
        setPlannerManagedProducts([]);
      }
    } catch (error) {
      setAuthUserId(null);
      setAuthRole(null);
      setIsAuthenticated(false);
      setCloudPlans([]);
      setAdminCloudPlans([]);
      setPlannerManagedProducts([]);
      reportSessionError(
        error instanceof Error
          ? `Cloud planner workspace is unavailable right now. Staying in local draft mode. ${error.message}`
          : "Cloud planner workspace is unavailable right now. Staying in local draft mode.",
      );
    } finally {
      setLocalDraftVersion((value) => value + 1);
    }
  }, [reportSessionError, supabase]);

  useEffect(() => {
    if (!bootstrapEnabled) return;
    const timeoutId = window.setTimeout(() => {
      void syncSessionInventory();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bootstrapEnabled, syncSessionInventory]);

  const handleSaveCloud = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      reportSessionError("You are offline. Cloud save is unavailable.");
      return;
    }
    if (!isAuthenticated) {
      reportSessionError("Sign in is required for cloud save.");
      return;
    }
    if (!supabase) {
      reportSessionError("Supabase is not configured in this environment.");
      return;
    }

    setSessionBusy(true);
    try {
      const saveAccessMode =
        authRole === "admin" && activeCloudAccessMode === "admin" && activeDocumentId ? "admin" : "owner";
      const savedDocument = await savePlannerDocumentToSupabase(supabase, buildCurrentPlannerDocument(), {
        userId: authUserId ?? undefined,
        saveId: activeDocumentId ?? undefined,
        ownerUserId: saveAccessMode === "admin" ? activeCloudOwnerUserId ?? undefined : undefined,
        accessMode: saveAccessMode,
      });

      setPlanName(savedDocument.name);
      setActiveDocumentId(savedDocument.id ?? null);
      setActiveCloudAccessMode(saveAccessMode);
      setActiveCloudOwnerUserId(
        saveAccessMode === "admin" ? activeCloudOwnerUserId ?? authUserId ?? null : authUserId ?? null,
      );
      reportSessionStatus(`Cloud save updated: ${savedDocument.name}`);
      await syncSessionInventory();
    } catch (error) {
      reportSessionError(error instanceof Error ? error.message : "Unable to save planner document.");
    } finally {
      setSessionBusy(false);
    }
  }, [
    activeCloudAccessMode,
    activeCloudOwnerUserId,
    activeDocumentId,
    authRole,
    authUserId,
    buildCurrentPlannerDocument,
    isAuthenticated,
    reportSessionError,
    reportSessionStatus,
    setActiveDocumentId,
    setPlanName,
    supabase,
    syncSessionInventory,
  ]);

  const handleSaveDraft = useCallback(() => {
    const savedDraft = savePlannerDraftDocument(buildCurrentPlannerDocument(), getDraftScope(LOCAL_CURRENT_DRAFT_ID));
    setLocalDraftVersion((value) => value + 1);
    reportSessionStatus(
      savedDraft
        ? `Local draft updated: ${formatPlannerSavedPlanTimestamp(savedDraft.savedAt)}`
        : "Draft save is unavailable in this environment.",
    );
  }, [buildCurrentPlannerDocument, getDraftScope, reportSessionStatus]);

  const handleLoadPlan = useCallback(
    async (plan: PlannerSavedEntry) => {
      setSessionBusy(true);
      try {
        if (plan.source === "local") {
          const draft = loadPlannerDraftDocument(getDraftScope(plan.id));
          if (!draft) {
            reportSessionError("Local draft not found.");
            return;
          }

          applyPlannerDocument(draft);
          setActiveCloudAccessMode("owner");
          setActiveCloudOwnerUserId(authUserId ?? null);
          reportSessionStatus(`Loaded local draft: ${draft.name}`);
          return;
        }

        if (!supabase) {
          reportSessionError("Supabase is not configured in this environment.");
          return;
        }

        const cloudDocument = await loadPlannerDocumentFromSupabase(supabase, plan.id, {
          userId: authUserId ?? undefined,
          ownerUserId: plan.ownerUserId,
          accessMode: plan.accessMode,
        });

        if (!cloudDocument) {
          reportSessionError("Cloud plan not found.");
          return;
        }

        applyPlannerDocument(cloudDocument);
        setActiveCloudAccessMode(plan.accessMode === "admin" ? "admin" : "owner");
        setActiveCloudOwnerUserId(plan.ownerUserId ?? authUserId ?? null);
        reportSessionStatus(`Loaded cloud plan: ${cloudDocument.name}`);
      } catch (error) {
        reportSessionError(error instanceof Error ? error.message : "Unable to load planner document.");
      } finally {
        setSessionBusy(false);
      }
    },
    [applyPlannerDocument, authUserId, getDraftScope, reportSessionError, reportSessionStatus, supabase],
  );

  const handleDeletePlan = useCallback(
    async (plan: PlannerSavedEntry) => {
      setSessionBusy(true);
      try {
        if (plan.source === "local") {
          deletePlannerDraftDocument(getDraftScope(plan.id));
          setLocalDraftVersion((value) => value + 1);
          reportSessionStatus("Local draft removed.");
          return;
        }

        if (plan.accessMode === "admin") {
          reportSessionError("Admin oversight does not allow browser-side delete for other users' plans.");
          return;
        }

        if (!supabase) {
          reportSessionError("Supabase is not configured in this environment.");
          return;
        }

        const deleted = await deletePlannerDocumentFromSupabase(supabase, plan.id, {
          userId: authUserId ?? undefined,
        });
        reportSessionStatus(deleted ? "Cloud plan removed." : "Cloud plan was not found.");
        await syncSessionInventory();
      } catch (error) {
        reportSessionError(error instanceof Error ? error.message : "Unable to delete planner document.");
      } finally {
        setSessionBusy(false);
      }
    },
    [authUserId, getDraftScope, reportSessionError, reportSessionStatus, supabase, syncSessionInventory],
  );

  const handleImportRequest = useCallback((input: HTMLInputElement | null) => {
    input?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSessionBusy(true);
      try {
        const parsed = await parsePlannerDocumentImportFile(file);
        if (!parsed.ok || !parsed.document) {
          reportSessionError(parsed.errors.join(" | "));
          return;
        }

        applyPlannerDocument(parsed.document);
        setActiveCloudAccessMode("owner");
        setActiveCloudOwnerUserId(authUserId ?? null);
        reportSessionStatus(`Imported planner JSON: ${parsed.document.name}`);
        savePlannerDraftDocument(parsed.document, getDraftScope(LOCAL_CURRENT_DRAFT_ID));
        setLocalDraftVersion((value) => value + 1);
      } catch (error) {
        reportSessionError(error instanceof Error ? error.message : "Unable to import planner JSON.");
      } finally {
        event.currentTarget.value = "";
        setSessionBusy(false);
      }
    },
    [applyPlannerDocument, authUserId, getDraftScope, reportSessionError, reportSessionStatus],
  );

  const handleExportJson = useCallback(() => {
    const plannerDocument = buildCurrentPlannerDocument();
    const payload = JSON.stringify(createPlannerExportPayload(plannerDocument), null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${
      sanitizePlannerPlanName(planName).toLowerCase().replace(/[^a-z0-9]+/g, "-") || "planner-document"
    }.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    reportSessionStatus("Planner JSON exported.");
  }, [buildCurrentPlannerDocument, planName, reportSessionStatus]);

  const handleOpen3d = useCallback(() => {
    const plannerDocument = buildCurrentPlannerDocument();
    const savedDraft = savePlannerDraftDocument(plannerDocument, getDraftScope(VIEWER_PREVIEW_DRAFT_ID));
    if (!savedDraft) {
      reportSessionError("Unable to prepare 3D preview draft in this environment.");
      return;
    }
    reportSessionStatus("Opening 3D preview from current planner draft.");
    router.push(`/configurator?draft=${VIEWER_PREVIEW_DRAFT_ID}`);
  }, [buildCurrentPlannerDocument, getDraftScope, reportSessionError, reportSessionStatus, router]);

  const handleUpsertManagedProduct = useCallback(
    async (product: PlannerManagedProductWrite) => {
      if (authRole !== "admin") {
        reportSessionError("Admin role is required to manage planner products.");
        return;
      }
      if (!supabase) {
        reportSessionError("Supabase is not configured in this environment.");
        return;
      }

      setSessionBusy(true);
      try {
        const savedProduct = await upsertPlannerManagedProduct(supabase, product);
        setPlannerManagedProducts((current) => {
          const next = [...current.filter((entry) => entry.id !== savedProduct.id), savedProduct];
          return next.sort((left, right) => right.updated_at.localeCompare(left.updated_at));
        });
        reportSessionStatus(`Planner-managed product saved: ${savedProduct.name}`);
      } catch (error) {
        reportSessionError(error instanceof Error ? error.message : "Unable to save planner-managed product.");
      } finally {
        setSessionBusy(false);
      }
    },
    [authRole, reportSessionError, reportSessionStatus, supabase],
  );

  const handleDeleteManagedProduct = useCallback(
    async (id: string) => {
      if (authRole !== "admin") {
        reportSessionError("Admin role is required to manage planner products.");
        return;
      }
      if (!supabase) {
        reportSessionError("Supabase is not configured in this environment.");
        return;
      }

      setSessionBusy(true);
      try {
        const deleted = await deletePlannerManagedProduct(supabase, id);
        if (deleted) {
          setPlannerManagedProducts((current) => current.filter((entry) => entry.id !== id));
        }
        reportSessionStatus(deleted ? "Planner-managed product removed." : "Planner-managed product was not found.");
      } catch (error) {
        reportSessionError(error instanceof Error ? error.message : "Unable to delete planner-managed product.");
      } finally {
        setSessionBusy(false);
      }
    },
    [authRole, reportSessionError, reportSessionStatus, supabase],
  );

  const plannerSavedEntries = useMemo(() => {
    void localDraftVersion;
    return buildPlannerSavedEntries({ cloudPlans, getDraftScope });
  }, [cloudPlans, getDraftScope, localDraftVersion]);

  const plannerAdminSavedEntries = useMemo(() => {
    if (authRole !== "admin") return [];

    return buildPlannerSavedEntries({
      cloudPlans: adminCloudPlans,
      getDraftScope,
      accessMode: "admin",
      includeLocalDraft: false,
    });
  }, [adminCloudPlans, authRole, getDraftScope]);

  const toolbarSessionModeLabel =
    authRole === "admin" ? "Admin + cloud drafts" : isAuthenticated ? "Cloud + local drafts" : "Local draft mode";
  const toolbarSessionStateLabel = buildPlannerToolbarSessionStateLabel({
    sessionBusy,
    sessionErrorMessage,
    sessionStatusMessage,
    activeDocumentId,
  });

  return {
    authUserId,
    authRole,
    isAdmin: authRole === "admin",
    isAuthenticated,
    sessionBusy,
    sessionStatusMessage,
    sessionErrorMessage,
    sessionDialogOpen,
    plannerSavedEntries,
    plannerAdminSavedEntries,
    plannerManagedProducts,
    toolbarSessionModeLabel,
    toolbarSessionStateLabel,
    getDraftScope,
    syncSessionInventory,
    reportSessionStatus,
    reportSessionError,
    clearSessionError,
    setSessionDialogOpen,
    handleSaveCloud,
    handleSaveDraft,
    handleLoadPlan,
    handleDeletePlan,
    handleImportRequest,
    handleImportFileChange,
    handleExportJson,
    handleOpen3d,
    handleUpsertManagedProduct,
    handleDeleteManagedProduct,
  };
}
