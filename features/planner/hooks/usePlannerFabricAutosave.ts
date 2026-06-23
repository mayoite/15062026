"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  applySessionWorkspace,
  buildSessionEnvelope,
  parseSessionSnapshot,
} from "@/features/planner/persistence/plannerSession";
import {
  createAutoSaver,
  getPlannerProjectId,
  loadProject,
  migrateGuestProjectToMember,
  type BuddyProject,
} from "@/features/planner/persistence/persistence";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

export type PlannerSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export { getPlannerProjectId } from "@/features/planner/persistence/persistence";

export function usePlannerFabricAutosave(
  exportDraft: () => string | null,
  guestMode: boolean,
  planId?: string,
  revisionSignal?: string,
) {
  const projectId = getPlannerProjectId(guestMode, planId);
  const [status, setStatus] = useState<PlannerSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didReceiveRevisionRef = useRef(false);
  const mountedRef = useRef(false);
  const restoreSequenceRef = useRef(0);

  const markSaving = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("saving");
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    savingTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setStatus((prev) => (prev === "saving" ? "saved" : prev));
      setLastSavedAt(new Date().toISOString());
    }, 5200);
  }, []);

  const schedulePersist = useCallback(() => {
    if (!mountedRef.current) return;
    const serialized = exportDraft();
    if (!serialized) return;
    setStatus("unsaved");
    const envelope = buildSessionEnvelope(JSON.parse(serialized));
    const snapshot = JSON.stringify(envelope);
    markSaving();
    saverRef.current?.scheduleSave(snapshot);
  }, [exportDraft, markSaving]);

  const restoreSnapshot = useCallback(async (importDraft: (serialized: string) => Promise<void>) => {
    const restoreId = ++restoreSequenceRef.current;
    try {
      if (!guestMode) {
        await migrateGuestProjectToMember();
      }
      if (!mountedRef.current || restoreSequenceRef.current !== restoreId) return false;
      const existing: BuddyProject | undefined = await loadProject(projectId);
      if (!mountedRef.current || restoreSequenceRef.current !== restoreId) return false;
      if (!existing?.snapshot) return false;
      const envelope = parseSessionSnapshot(existing.snapshot);
      if (!mountedRef.current || restoreSequenceRef.current !== restoreId) return false;
      if (!envelope?.store) return false;
      const storeJson = JSON.stringify(envelope.store);
      await importDraft(storeJson);
      if (!mountedRef.current || restoreSequenceRef.current !== restoreId) return false;
      applySessionWorkspace(envelope);
      setLastSavedAt(new Date(existing.updatedAt).toISOString());
      setStatus("saved");
      return true;
    } catch {
      return false;
    }
  }, [guestMode, projectId]);

  useEffect(() => {
    mountedRef.current = true;
    saverRef.current = createAutoSaver(projectId);

    const cleanupWorkspace = usePlannerWorkspaceStore.subscribe(() => {
      schedulePersist();
    });

    return () => {
      mountedRef.current = false;
      restoreSequenceRef.current += 1;
      cleanupWorkspace();
      saverRef.current?.cancel();
      saverRef.current = null;
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
      savingTimerRef.current = null;
    };
  }, [projectId, schedulePersist]);

  useEffect(() => {
    if (!revisionSignal) return;
    if (!didReceiveRevisionRef.current) {
      didReceiveRevisionRef.current = true;
      return;
    }
    schedulePersist();
  }, [revisionSignal, schedulePersist]);

  const retrySave = useCallback(() => {
    schedulePersist();
  }, [schedulePersist]);

  return { status, lastSavedAt, restoreSnapshot, retrySave, schedulePersist };
}
