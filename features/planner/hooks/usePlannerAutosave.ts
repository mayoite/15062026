"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "tldraw";
import { getSnapshot, loadSnapshot } from "tldraw";

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

export function usePlannerAutosave(
  editor: Editor | null,
  guestMode: boolean,
  planId?: string,
) {
  const projectId = getPlannerProjectId(guestMode, planId);
  const [status, setStatus] = useState<PlannerSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saverRef = useRef<ReturnType<typeof createAutoSaver> | null>(null);
  const savingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaving = useCallback(() => {
    setStatus("saving");
    if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    savingTimerRef.current = setTimeout(() => {
      setStatus((prev) => (prev === "saving" ? "saved" : prev));
      setLastSavedAt(new Date().toISOString());
    }, 5200);
  }, []);

  const schedulePersist = useCallback(
    (instance: Editor) => {
      setStatus("unsaved");
      const envelope = buildSessionEnvelope(getSnapshot(instance.store));
      const snapshot = JSON.stringify(envelope);
      markSaving();
      saverRef.current?.scheduleSave(snapshot);
    },
    [markSaving],
  );

  const restoreSnapshot = useCallback(async (instance: Editor) => {
    try {
      if (!guestMode) {
        await migrateGuestProjectToMember();
      }
      const existing: BuddyProject | undefined = await loadProject(projectId);
      if (!existing?.snapshot) return false;
      const envelope = parseSessionSnapshot(existing.snapshot);
      if (!envelope?.store) return false;
      loadSnapshot(instance.store, envelope.store as never);
      applySessionWorkspace(envelope);
      setLastSavedAt(new Date(existing.updatedAt).toISOString());
      setStatus("saved");
      return true;
    } catch {
      return false;
    }
  }, [guestMode, projectId]);

  useEffect(() => {
    if (!editor) return;
    saverRef.current = createAutoSaver(projectId);

    const cleanupDoc = editor.store.listen(
      () => schedulePersist(editor),
      { scope: "document", source: "user" },
    );

    const cleanupWorkspace = usePlannerWorkspaceStore.subscribe(() => {
      schedulePersist(editor);
    });

    return () => {
      cleanupDoc();
      cleanupWorkspace();
      saverRef.current?.cancel();
      if (savingTimerRef.current) clearTimeout(savingTimerRef.current);
    };
  }, [editor, projectId, schedulePersist]);

  const retrySave = useCallback(() => {
    if (!editor) return;
    schedulePersist(editor);
  }, [editor, schedulePersist]);

  return { status, lastSavedAt, restoreSnapshot, retrySave };
}
