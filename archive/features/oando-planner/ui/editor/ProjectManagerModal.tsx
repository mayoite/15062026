"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import {
  appendSnapshot,
  listSnapshots,
  restoreSnapshot,
  type VersionSnapshot,
} from "@/features/oando-planner/data/versionStore";
import { useToast } from "./ToastProvider";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";
import {
  buildPlannerVersionDocument,
  restoreSavedProjectFromVersion,
  type SavedPlannerProject,
} from "@/features/oando-planner/lib/plannerSavedProjectVersions";
import {
  deleteSavedPlan,
  duplicateSavedPlan,
  getProjectIdFromKey,
  getSavedPlans,
  readSavedProjectPayload,
  renameSavedPlan,
  type SavedPlanRecord,
  updateSavedPlanMetadata,
} from "@/features/oando-planner/lib/projectIndex";
import { trackVersionHistory, trackVersionRestore } from "@/features/oando-planner/hooks/useAnalytics";

function readSavedProject(key: string): SavedPlannerProject | null {
  return readSavedProjectPayload(key) as SavedPlannerProject | null;
}

function captureThumbnail(): string | null {
  return null;
}

export function ProjectManagerModal({
  open,
  onClose,
  readOnly = false,
}: {
  open: boolean;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const [projects, setProjects] = useState<SavedPlanRecord[]>([]);
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [versionPanelKey, setVersionPanelKey] = useState<string | null>(null);
  // Save as copy state
  const [showSaveAsCopy, setShowSaveAsCopy] = useState(false);
  const [saveAsCopyName, setSaveAsCopyName] = useState("");
  const [saveAsCopyError, setSaveAsCopyError] = useState<string | null>(null);
  const { addToast } = useToast();
  const loadProject = usePlannerStore((s) => s.loadProject);
  const saveAsCopy = usePlannerStore((s) => s.saveAsCopy);
  const projectName = usePlannerStore((s) => s.projectName);
  const hasContent = usePlannerStore((s) => s.hasContent);
  const dialogRef = useDialogA11y(open, onClose);
  const canMutate = !readOnly;

  const refresh = useCallback(() => {
    setProjects(getSavedPlans());
  }, []);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => refresh(), 0);
      // Reset save-as-copy state when modal opens
// eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSaveAsCopy(false);
      setSaveAsCopyName(`Copy of ${projectName}`);
      setSaveAsCopyError(null);
      return () => clearTimeout(t);
    }
  }, [open, refresh, projectName]);

  if (!open) return null;

  const handleLoad = (key: string) => {
    if (!canMutate) return;
    if (confirm("Load this project? Unsaved changes will be lost.")) {
      loadProject(key);
      addToast("Project loaded", "success");
      onClose();
    }
  };

  const handleDelete = (key: string, name: string) => {
    if (!canMutate) return;
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      if (deleteSavedPlan(key)) {
        addToast(`"${name}" deleted`, "info");
        refresh();
      } else {
        addToast("Failed to delete project", "error");
      }
    }
  };

  const handleDuplicate = (key: string) => {
    if (!canMutate) return;
    const source = readSavedProjectPayload(key);
    if (!source) return;
    const newName = `${source.projectName || "Project"} (Copy)`;
    const thumbnail = captureThumbnail();
    const duplicated = duplicateSavedPlan(key, newName, thumbnail);

    if (!duplicated) {
      addToast("Storage full. Delete old projects to free space.", "error");
      return;
    }

    addToast("Project duplicated", "success");
    refresh();
  };

  const handleRenameStart = (key: string, currentName: string) => {
    if (!canMutate) return;
    setRenamingKey(key);
    setRenameValue(currentName);
  };

  const handleRenameConfirm = (oldKey: string) => {
    if (!canMutate) return;
    if (!renameValue.trim()) {
      setRenamingKey(null);
      return;
    }

    if (!renameSavedPlan(oldKey, renameValue)) {
      addToast("Storage full", "error");
      setRenamingKey(null);
      return;
    }

    setRenamingKey(null);
    addToast("Project renamed", "success");
    refresh();
  };

  const handleExpandMetadata = (p: SavedPlanRecord) => {
    if (!canMutate) return;
    if (expandedKey === p.key) {
      setExpandedKey(null);
    } else {
      setExpandedKey(p.key);
      setEditClientName(p.clientName || "");
      setEditDescription(p.description || "");
    }
  };

  const handleSaveMetadata = (key: string) => {
    if (!canMutate) return;
    if (!updateSavedPlanMetadata(key, { clientName: editClientName, description: editDescription })) {
      addToast("Storage full", "error");
      return;
    }
    setExpandedKey(null);
    addToast("Project info saved", "success");
    refresh();
  };

  const handleToggleVersions = (key: string) => {
    if (!canMutate) return;
    setVersionPanelKey((current) => {
      const next = current === key ? null : key;
      if (next) {
        trackVersionHistory();
      }
      return next;
    });
  };

  const handleCreateSnapshot = (key: string) => {
    if (!canMutate) return;
    const savedProject = readSavedProject(key);
    if (!savedProject) {
      addToast("Could not read project for version snapshot", "error");
      return;
    }

    const snapshot = appendSnapshot(
      getProjectIdFromKey(key),
      buildPlannerVersionDocument(getProjectIdFromKey(key), savedProject),
      "save",
      "Manual snapshot",
    );

    if (!snapshot) {
      addToast("Could not create version snapshot", "error");
      return;
    }

    setVersionPanelKey(key);
    addToast("Version snapshot saved", "success");
    refresh();
  };

  const handleRestoreSnapshot = (key: string, snapshot: VersionSnapshot) => {
    if (!canMutate) return;
    const currentProject = readSavedProject(key);
    if (!currentProject) {
      addToast("Could not load current project state", "error");
      return;
    }

    const restored = restoreSnapshot(getProjectIdFromKey(key), snapshot.id);
    if (!restored) {
      addToast("Version snapshot not found", "error");
      return;
    }

    const mergedProject = restoreSavedProjectFromVersion(restored, currentProject);

    try {
      localStorage.setItem(key, JSON.stringify(mergedProject));
    } catch {
      addToast("Storage full", "error");
      return;
    }

    appendSnapshot(
      getProjectIdFromKey(key),
      buildPlannerVersionDocument(getProjectIdFromKey(key), mergedProject),
      "restore",
      snapshot.label || "Restored snapshot",
    );

    const snapshotAge = Math.floor(
// eslint-disable-next-line react-hooks/purity
      (Date.now() - new Date(snapshot.createdAt).getTime()) / 1000,
    );
    trackVersionRestore(snapshot.id, snapshotAge);
    loadProject(key);
    addToast("Version restored", "success");
    refresh();
  };

  const handleSaveAsCopySubmit = () => {
    if (!canMutate) return;
    setSaveAsCopyError(null);
    
    const trimmedName = saveAsCopyName.trim();
    if (!trimmedName) {
      setSaveAsCopyError("Project name cannot be empty");
      return;
    }
    if (trimmedName.length > 120) {
      setSaveAsCopyError("Project name must be 120 characters or less");
      return;
    }

    const result = saveAsCopy(trimmedName);
    if (result.success && result.key) {
      addToast(`Created "${trimmedName}"`, "success");
      setShowSaveAsCopy(false);
      setSaveAsCopyName("");
      setSaveAsCopyError(null);
      refresh();
      // Load the new project
      loadProject(result.key);
      onClose();
    } else {
      setSaveAsCopyError(result.error || "Failed to save copy");
    }
  };

  const handleSaveAsCopyCancel = () => {
    if (!canMutate) return;
    setShowSaveAsCopy(false);
    setSaveAsCopyName(`Copy of ${projectName}`);
    setSaveAsCopyError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="projects-modal-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div ref={dialogRef} className="relative bg-[var(--surface-inverse)] backdrop-blur-xl rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] sm:max-h-[85vh] flex flex-col border border-[var(--color-accent)]/15 animate-scale-in">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[var(--color-accent)]/10">
          <div>
            <h2 id="projects-modal-title" className="text-white text-[15px] font-semibold">Project Manager</h2>
            <p className="text-white/40 text-[11px] mt-0.5">{projects.length} saved project{projects.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2">
            {canMutate && hasContent() && !showSaveAsCopy && (
              <button
                onClick={() => setShowSaveAsCopy(true)}
                className="px-3 py-2 rounded-lg text-[12px] text-white transition-all min-h-[44px]"
                style={{ background: "linear-gradient(to right, var(--color-accent), var(--color-accent-hover))" }}
                aria-label="Save current project as a copy"
              >
                Save as copy
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/[0.04] text-white/40 hover:text-white text-xl leading-none flex items-center justify-center min-h-[44px] min-w-[44px] border border-white/[0.04] transition-all">&times;</button>
          </div>
        </div>

        {/* Save as copy form */}
        {showSaveAsCopy && (
          <div className="px-4 sm:px-5 py-4 border-b border-[var(--color-accent)]/10 bg-white/[0.02]">
            <div className="space-y-3">
              <div>
                <label htmlFor="save-as-copy-name" className="text-[10px] uppercase tracking-wider mb-1.5 block font-semibold text-[var(--color-accent)]">
                  New project name
                </label>
                <input
                  id="save-as-copy-name"
                  type="text"
                  value={saveAsCopyName}
                  disabled={!canMutate}
                  onChange={(e) => {
                    setSaveAsCopyName(e.target.value);
                    setSaveAsCopyError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAsCopySubmit();
                    if (e.key === "Escape") handleSaveAsCopyCancel();
                  }}
                  placeholder="Enter a name for the copy"
                  maxLength={120}
                  autoFocus
                  className="w-full bg-white/[0.04] text-white text-[13px] px-3 py-2 rounded-lg border border-white/[0.08] focus:border-[var(--color-accent)] outline-none transition-colors"
                  aria-describedby={saveAsCopyError ? "save-as-copy-error" : undefined}
                  aria-invalid={saveAsCopyError ? "true" : "false"}
                />
                {saveAsCopyError && (
                  <p id="save-as-copy-error" className="text-red-400 text-[11px] mt-1.5" role="alert">
                    {saveAsCopyError}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveAsCopySubmit}
                  className="px-4 py-2 rounded-lg text-[12px] text-white transition-all"
                  style={{ background: "linear-gradient(to right, var(--color-accent), var(--color-accent-hover))" }}
                >
                  Create copy
                </button>
                <button
                  onClick={handleSaveAsCopyCancel}
                  className="px-4 py-2 rounded-lg text-[12px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="text-4xl opacity-30">📁</div>
              <p className="text-white/40 text-[13px] text-center">No saved projects yet.<br/>Save a project to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => {
                const snapshots = listSnapshots(getProjectIdFromKey(p.key));
                return (
                <div key={p.key} className="bg-white/[0.02] rounded-xl border border-white/[0.05] overflow-hidden hover:border-[var(--color-accent)]/20 transition-all">
                  <div className="flex items-stretch gap-0">
                    {p.thumbnail ? (
                      <div className="w-24 h-20 shrink-0 overflow-hidden bg-[var(--overlay-inverse-35)] rounded-l-xl">
                        <Image src={p.thumbnail} alt="Preview" width={96} height={80} unoptimized className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-20 shrink-0 flex items-center justify-center bg-[var(--overlay-inverse-35)] text-2xl opacity-20 rounded-l-xl">
                        📐
                      </div>
                    )}
                    <div className="flex-1 min-w-0 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {renamingKey === p.key ? (
                            <input
                              autoFocus
                              value={renameValue}
                              disabled={!canMutate}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => handleRenameConfirm(p.key)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleRenameConfirm(p.key);
                                if (e.key === "Escape") setRenamingKey(null);
                              }}
                              className="bg-white/[0.06] text-white text-[13px] px-2 py-0.5 rounded-lg border border-white/[0.12] outline-none w-full"
                            />
                          ) : (
                            <p className="text-white text-[13px] font-medium truncate">{p.name}</p>
                          )}
                          {p.clientName && (
                            <p className="text-white/40 text-[11px] mt-0.5 truncate">Client: {p.clientName}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-white/25 text-[10px]">
                              {p.savedAt ? new Date(p.savedAt).toLocaleDateString() : "—"}
                            </span>
                            <span className="text-white/25 text-[10px]">
                              {p.walls.length}W · {p.rooms.length}R · {p.furniture.length}F
                            </span>
                            <span className="text-white/20 text-[10px]">
                              {p.snapshotCount} snapshot{p.snapshotCount === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleLoad(p.key)}
                            disabled={!canMutate}
                            className="px-2 py-1 rounded-lg text-[11px] text-white transition-all"
                            style={{ background: "linear-gradient(to right, var(--color-accent), var(--color-accent-hover))" }}
                            title="Load"
                          >
                            Load
                          </button>
                          <button onClick={() => handleRenameStart(p.key, p.name)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all disabled:cursor-not-allowed disabled:opacity-40">Rename</button>
                          <button onClick={() => handleDuplicate(p.key)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all disabled:cursor-not-allowed disabled:opacity-40" title="Duplicate">Dup</button>
                          <button onClick={() => handleExpandMetadata(p)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all disabled:cursor-not-allowed disabled:opacity-40" title="Edit metadata">Info</button>
                          <button onClick={() => handleCreateSnapshot(p.key)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all disabled:cursor-not-allowed disabled:opacity-40" title="Create snapshot">Snap</button>
                          <button onClick={() => handleToggleVersions(p.key)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all disabled:cursor-not-allowed disabled:opacity-40" title="Version history">
                            Ver {p.snapshotCount > 0 ? `(${p.snapshotCount})` : ""}
                          </button>
                          <button onClick={() => handleDelete(p.key, p.name)} disabled={!canMutate} className="px-2 py-1 rounded-lg text-[11px] bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-40">Del</button>
                        </div>
                      </div>
                      {p.description && expandedKey !== p.key && (
                        <p className="text-white/25 text-[11px] mt-1 truncate">{p.description}</p>
                      )}
                    </div>
                  </div>
                  {expandedKey === p.key && (
                    <div className="border-t border-white/[0.04] p-3 space-y-2 bg-white/[0.01]">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1 block font-semibold text-[var(--color-accent)]">Client Name</label>
                        <input
                          type="text"
                          value={editClientName}
                          disabled={!canMutate}
                          onChange={(e) => setEditClientName(e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="w-full bg-white/[0.04] text-white text-[12px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:border-[var(--color-accent)] outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider mb-1 block font-semibold text-[var(--color-accent)]">Description</label>
                        <textarea
                          value={editDescription}
                          disabled={!canMutate}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="e.g. Open plan office redesign..."
                          rows={2}
                          className="w-full bg-white/[0.04] text-white text-[12px] px-2.5 py-1.5 rounded-lg border border-white/[0.08] focus:border-[var(--color-accent)] outline-none resize-none transition-colors"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMetadata(p.key)}
                          disabled={!canMutate}
                          className="px-3 py-1.5 rounded-lg text-[11px] text-white transition-all"
                          style={{ background: "linear-gradient(to right, var(--color-accent), var(--color-accent-hover))" }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setExpandedKey(null)}
                          className="px-3 py-1.5 rounded-lg text-[11px] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {versionPanelKey === p.key && (
                    <div className="border-t border-white/[0.04] bg-white/[0.01] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                          Version History
                        </p>
                        <span className="text-[10px] text-white/30">
                          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {snapshots.length === 0 ? (
                        <p className="text-[11px] text-white/35">
                          No snapshots yet. Create one before a major edit or review handoff.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {snapshots.map((snapshot) => (
                            <div
                              key={snapshot.id}
                              className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-[12px] text-white/80">
                                    {snapshot.label || (snapshot.reason === "restore" ? "Restore checkpoint" : "Saved snapshot")}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-white/35">
                                    {new Date(snapshot.createdAt).toLocaleString()} · {snapshot.reason}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleRestoreSnapshot(p.key, snapshot)}
                                  disabled={!canMutate}
                                  className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70 transition-all hover:bg-white/[0.08]"
                                >
                                  Restore
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
