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
import type { LocalSaveState, SyncState } from "@/features/planner/store/offlineStorage";

export type PlannerSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export type PlannerEnvelopeStatus = {
  localSaveState: LocalSaveState;
  syncState: SyncState;
};

export { getPlannerProjectId } from "@/features/planner/persistence/persistence";

export function usePlannerFabricAutosave(
  exportDraft: () => string | null,
  guestMode: boolean,
  planId?: string,
  revisionSignal?: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;
  const projectId = getPlannerProjectId(guestMode, planId);
  const [status, setStatus] = useState<PlannerSaveStatus>("idle");
  const [envelopeStatus, setEnvelopeStatus] = useState<PlannerEnvelopeStatus>({
    localSaveState: "saved_local",
    syncState: "idle",
  });
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const didReceiveRevisionRef = useRef(false);
  const mountedRef = useRef(false);
  const restoreSequenceRef = useRef(0);
  const autosaveGenerationRef = useRef(0);

  const markSaving = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("saving");
    setEnvelopeStatus((current) => ({
      ...current,
      localSaveState: "saving_local",
      syncState: "idle",
    }));
  }, []);

  const schedulePersist = useCallback(() => {
    if (!enabled) return;
    if (!mountedRef.current) return;
    const serialized = exportDraft();
    if (!serialized) return;
    setStatus("unsaved");
    setEnvelopeStatus((current) => ({
      ...current,
      localSaveState: "dirty",
      syncState: "idle",
    }));
    const envelope = buildSessionEnvelope(JSON.parse(serialized));
    const snapshot = JSON.stringify(envelope);
    markSaving();
    saverRef.current?.scheduleSave(snapshot);
  }, [enabled, exportDraft, markSaving]);

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
      setEnvelopeStatus({
        localSaveState: "saved_local",
        syncState: "idle",
      });
      return true;
    } catch {
      return false;
    }
  }, [guestMode, projectId]);

  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    const generation = ++autosaveGenerationRef.current;
    saverRef.current = createAutoSaver(projectId, {
      onSaved: () => {
        if (!mountedRef.current || autosaveGenerationRef.current !== generation) return;
        setStatus("saved");
        setLastSavedAt(new Date().toISOString());
        setEnvelopeStatus((current) => ({
          ...current,
          localSaveState: "saved_local",
          syncState: "idle",
        }));
      },
      onError: (error) => {
        if (!mountedRef.current || autosaveGenerationRef.current !== generation) return;
        console.error("Planner autosave failed:", error);
        setStatus("error");
        setEnvelopeStatus((current) => ({
          ...current,
          localSaveState: "local_save_failed",
          syncState: "idle",
        }));
      },
    });

    const cleanupWorkspace = usePlannerWorkspaceStore.subscribe(() => {
      schedulePersist();
    });

    return () => {
      mountedRef.current = false;
      autosaveGenerationRef.current += 1;
      restoreSequenceRef.current += 1;
      cleanupWorkspace();
      saverRef.current?.cancel();
      saverRef.current = null;
    };
  }, [enabled, projectId, schedulePersist]);

  useEffect(() => {
    if (!enabled) return;
    if (!revisionSignal) return;
    if (!didReceiveRevisionRef.current) {
      didReceiveRevisionRef.current = true;
      return;
    }
    schedulePersist();
  }, [enabled, revisionSignal, schedulePersist]);

  const retrySave = useCallback(() => {
    schedulePersist();
  }, [schedulePersist]);

  return { status, envelopeStatus, lastSavedAt, restoreSnapshot, retrySave, schedulePersist };
}
