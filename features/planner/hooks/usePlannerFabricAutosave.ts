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

  const markSaving = useCallback(() => {
    setStatus("saving");
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    savingTimerRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "saving" ? "saved" : prev));
      setLastSavedAt(new Date().toISOString());
    }, 5200);
  }, []);

  const schedulePersist = useCallback(() => {
    const serialized = exportDraft();
    if (!serialized) return;
    setStatus("unsaved");
    const envelope = buildSessionEnvelope(JSON.parse(serialized));
    const snapshot = JSON.stringify(envelope);
    markSaving();
    saverRef.current?.scheduleSave(snapshot);
  }, [exportDraft, markSaving]);

  const restoreSnapshot = useCallback(async (importDraft: (serialized: string) => Promise<void>) => {
    try {
      if (!guestMode) {
        await migrateGuestProjectToMember();
      }
      const existing: BuddyProject | undefined = await loadProject(projectId);
      if (!existing?.snapshot) return false;
      const envelope = parseSessionSnapshot(existing.snapshot);
      if (!envelope?.store) return false;
      const storeJson = JSON.stringify(envelope.store);
      await importDraft(storeJson);
      applySessionWorkspace(envelope);
      setLastSavedAt(new Date(existing.updatedAt).toISOString());
      setStatus("saved");
      return true;
    } catch {
      return false;
    }
  }, [guestMode, projectId]);

  useEffect(() => {
    saverRef.current = createAutoSaver(projectId);

    const cleanupWorkspace = usePlannerWorkspaceStore.subscribe(() => {
      schedulePersist();
    });

    return () => {
      cleanupWorkspace();
      saverRef.current?.cancel();
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
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
