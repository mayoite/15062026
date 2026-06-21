/**
 * usePlannerSessionHandlers
 *
 * Extracted from PlannerWorkspace to keep that file under 1 000 lines.
 * Owns all save / load / rename / delete / import / export / open-3D callbacks.
 */

import { useCallback, useMemo, useState } from "react";
import {
  LOCAL_CURRENT_DRAFT_ID,
  createPlannerExportPayload,
  formatPlannerSavedPlanTimestamp,
  sanitizePlannerPlanName,
} from "@/features/planner/lib/sessionState";
import {
  deletePlannerDraftDocument,
  listPlannerDraftDocuments,
  loadPlannerDraftDocument,
  savePlannerDraftDocument,
  type PlannerDraftScope,
} from "@/features/planner/persistence/plannerDraft";
import { parsePlannerDocumentImportFile } from "@/features/planner/persistence/plannerImport";
import { normalizePlannerDocument } from "@/features/planner/model";
import type { buildPlannerDocumentFromEditor } from "@/features/planner/document/plannerDocumentBridge";
import { loadPlannerDocumentIntoFabric } from "@/features/planner/lib/fabricDocumentBridge";
import type { PlannerSavedEntry } from "@/features/planner/ui/PlannerSessionDialog";
import type { ChangeEvent } from "react";

type UseSessionHandlersOptions = {
  /** Memoised current planner document (already built — do not re-serialise). */
  getCurrentPlannerDocument: () => ReturnType<typeof buildPlannerDocumentFromEditor>;
  importDraft: (json: string) => Promise<void>;
  planId?: string;
  shapeCount: number;
  saveStatus: string;
};

export function usePlannerSessionHandlers({
  getCurrentPlannerDocument,
  importDraft,
  planId,
  shapeCount,
  saveStatus,
}: UseSessionHandlersOptions) {
  const [planNameOverride, setPlanNameOverride] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(planId ?? null);
  const [sessionStatusMessage, setSessionStatusMessage] = useState<string | null>(null);
  const [sessionErrorMessage, setSessionErrorMessage] = useState<string | null>(null);
  const [localDraftVersion, setLocalDraftVersion] = useState(0);

  const currentDraftScope = useMemo<PlannerDraftScope>(
    () => ({ documentId: LOCAL_CURRENT_DRAFT_ID }),
    [],
  );

  const draftPlanName = useMemo(() => {
    void localDraftVersion;
    const localDraft = loadPlannerDraftDocument(currentDraftScope);
    if (!localDraft) return "Workspace Plan";
    return localDraft.title ?? localDraft.name;
  }, [currentDraftScope, localDraftVersion]);

  const draftNameKey = useMemo(
    () => `${currentDraftScope.documentId ?? ""}:${localDraftVersion}`,
    [currentDraftScope, localDraftVersion],
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
    (planName: string) => {
      // BUG-04 fix: use the already-memoised document.
      const draftDocument = getCurrentPlannerDocument();
      const namedDocumentId = activeDocumentId ?? draftDocument.id ?? crypto.randomUUID();
      const normalizedName = sanitizePlannerPlanName(planName);
      const normalizedDraft = normalizePlannerDocument({
        ...draftDocument,
        id: namedDocumentId,
        name: normalizedName,
        title: normalizedName,
      });

      const savedCurrent = savePlannerDraftDocument(normalizedDraft, currentDraftScope);
      const savedNamed = savePlannerDraftDocument(normalizedDraft, {
        documentId: namedDocumentId,
      });
      setActiveDocumentId(namedDocumentId);
      setLocalDraftVersion((v) => v + 1);
      if (!savedCurrent || !savedNamed) {
        setSessionErrorMessage("Local draft save is unavailable in this environment.");
        return;
      }
      setSessionErrorMessage(null);
      setSessionStatusMessage(
        `Local session saved ${formatPlannerSavedPlanTimestamp(savedNamed.savedAt)}`,
      );
    },
    [activeDocumentId, getCurrentPlannerDocument, currentDraftScope],
  );

  const handleSaveAsNewSession = useCallback(
    (planName: string) => {
      // BUG-04 fix: use the already-memoised document.
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

      const savedCurrent = savePlannerDraftDocument(normalizedDraft, currentDraftScope);
      const savedNamed = savePlannerDraftDocument(normalizedDraft, {
        documentId: newDocumentId,
      });
      setActiveDocumentId(newDocumentId);
      setPlanNameOverride(normalizedName);
      setLocalDraftVersion((v) => v + 1);
      if (!savedCurrent || !savedNamed) {
        setSessionErrorMessage("New local session could not be created.");
        return;
      }
      setSessionErrorMessage(null);
      setSessionStatusMessage(
        `New local session created ${formatPlannerSavedPlanTimestamp(savedNamed.savedAt)}`,
      );
    },
    [activeDocumentId, getCurrentPlannerDocument, currentDraftScope],
  );

  // ── Load ──────────────────────────────────────────────────────────────────

  const handleLoadPlan = useCallback(
    (plan: PlannerSavedEntry) => {
      if (plan.source !== "local") {
        setSessionErrorMessage(
          "Only local draft loading is enabled in this planner session.",
        );
        return;
      }
      // P5-09: confirm before replacing an unsaved canvas.
      if (shapeCount > 0 && saveStatus !== "saved") {
        const confirmed = window.confirm(
          `You have unsaved changes (${shapeCount} object${shapeCount !== 1 ? "s" : ""}). Load "${plan.name}" and discard?`,
        );
        if (!confirmed) return;
      }
      const scope =
        plan.id === LOCAL_CURRENT_DRAFT_ID ? currentDraftScope : { documentId: plan.id };
      const draft = loadPlannerDraftDocument(scope);
      if (!draft) {
        setSessionErrorMessage("Local draft not found.");
        return;
      }
      applyPlannerDocument(draft);
    },
    [applyPlannerDocument, currentDraftScope, saveStatus, shapeCount],
  );

  // ── Delete / rename ───────────────────────────────────────────────────────

  const handleDeletePlan = useCallback(
    (plan: PlannerSavedEntry) => {
      if (plan.source !== "local" || plan.id === LOCAL_CURRENT_DRAFT_ID) {
        setSessionErrorMessage("Only named local sessions can be deleted here.");
        return;
      }
      const deleted = deletePlannerDraftDocument({ documentId: plan.id });
      if (!deleted) {
        setSessionErrorMessage("Local session could not be deleted.");
        return;
      }
      if (activeDocumentId === plan.id) setActiveDocumentId(null);
      setLocalDraftVersion((v) => v + 1);
      setSessionErrorMessage(null);
      setSessionStatusMessage(`Deleted local session: ${plan.name}`);
    },
    [activeDocumentId],
  );

  const handleRenamePlan = useCallback(
    (plan: PlannerSavedEntry, nextNameInput: string) => {
      if (plan.source !== "local" || plan.id === LOCAL_CURRENT_DRAFT_ID) {
        setSessionErrorMessage("Only named local sessions can be renamed here.");
        return;
      }
      const existing = loadPlannerDraftDocument({ documentId: plan.id });
      if (!existing) {
        setSessionErrorMessage("Local session not found.");
        return;
      }
      const nextName = sanitizePlannerPlanName(nextNameInput);
      const renamed = normalizePlannerDocument({ ...existing, name: nextName, title: nextName });
      const savedNamed = savePlannerDraftDocument(renamed, { documentId: plan.id });
      if (activeDocumentId === plan.id) {
        savePlannerDraftDocument(renamed, currentDraftScope);
        setPlanNameOverride(nextName);
      }
      setLocalDraftVersion((v) => v + 1);
      if (!savedNamed) {
        setSessionErrorMessage("Local session could not be renamed.");
        return;
      }
      setSessionErrorMessage(null);
      setSessionStatusMessage(`Renamed local session to ${nextName}`);
    },
    [activeDocumentId, currentDraftScope],
  );

  // ── Import / Export ───────────────────────────────────────────────────────

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>, _planName: string) => {
      const file = event.target.files?.[0];
      if (!file) return;
      // P5-09
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
        savePlannerDraftDocument(normalizedDocument, currentDraftScope);
        savePlannerDraftDocument(normalizedDocument, { documentId });
        setActiveDocumentId(documentId);
        setLocalDraftVersion((v) => v + 1);
        setSessionStatusMessage(`Imported planner JSON: ${normalizedName}`);
      }
      event.currentTarget.value = "";
    },
    [applyPlannerDocument, currentDraftScope, saveStatus, shapeCount],
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

  const localDraft = useMemo(() => {
    void localDraftVersion;
    return loadPlannerDraftDocument(currentDraftScope);
  }, [currentDraftScope, localDraftVersion]);

  const localDraftSessions = useMemo(() => {
    void localDraftVersion;
    return listPlannerDraftDocuments().filter(
      (entry) => entry.scope.documentId && entry.scope.documentId !== LOCAL_CURRENT_DRAFT_ID,
    );
  }, [localDraftVersion]);

  const buildSavedEntries = useCallback(
    (activeDocId: string | null): PlannerSavedEntry[] => {
      const namedEntries = localDraftSessions.map((entry) => ({
        id: entry.scope.documentId ?? entry.envelope.document.id ?? entry.storageKey,
        name: entry.envelope.document.title ?? entry.envelope.document.name,
        source: "local" as const,
        isActive:
          activeDocId ===
          (entry.scope.documentId ?? entry.envelope.document.id ?? entry.storageKey),
        canDelete: true,
        canRename: true,
        updatedAtLabel: formatPlannerSavedPlanTimestamp(
          entry.envelope.document.updatedAt ??
            entry.envelope.document.createdAt ??
            entry.envelope.savedAt,
        ),
        itemCount: entry.envelope.document.itemCount,
        detail: `${entry.envelope.document.roomWidthMm}mm x ${entry.envelope.document.roomDepthMm}mm`,
        subtitle: entry.envelope.document.projectName ?? "Named local session",
        statusLabel:
          entry.envelope.document.unitSystem === "imperial" ? "Imperial units" : "Metric units",
      }));

      if (!localDraft) return namedEntries;

      return [
        {
          id: LOCAL_CURRENT_DRAFT_ID,
          name: `${localDraft.title ?? localDraft.name} (Current Draft)`,
          source: "local" as const,
          isActive: !activeDocId || activeDocId === LOCAL_CURRENT_DRAFT_ID,
          canDelete: false,
          canRename: false,
          updatedAtLabel: formatPlannerSavedPlanTimestamp(
            localDraft.updatedAt ?? localDraft.createdAt,
          ),
          itemCount: localDraft.itemCount,
          detail: `${localDraft.roomWidthMm}mm x ${localDraft.roomDepthMm}mm`,
          subtitle: localDraft.projectName ?? "Rolling browser draft",
          statusLabel: localDraft.unitSystem === "imperial" ? "Imperial units" : "Metric units",
        },
        ...namedEntries,
      ];
    },
    [localDraft, localDraftSessions],
  );

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
    localDraftVersion,
    currentDraftScope,
    draftPlanName,
    draftNameKey,
    // actions
    applyPlannerDocument,
    handleSaveDraft,
    handleSaveAsNewSession,
    handleLoadPlan,
    handleDeletePlan,
    handleRenamePlan,
    handleImportFileChange,
    handleExportJson,
    buildSavedEntries,
  };
}
