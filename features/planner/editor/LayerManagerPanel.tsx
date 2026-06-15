"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDownToLine,
  ArrowUpToLine,
  BetweenHorizonalStart,
  BetweenVerticalStart,
  ChevronDown,
  ChevronRight,
  Lock,
  LockOpen,
  Search,
  MousePointer2,
  ScanSearch,
} from "lucide-react";
import type { Editor, TLShapeId } from "tldraw";

import {
  buildLayerManagerEntries,
  filterLayerManagerEntries,
  getNextLayerSelection,
  groupLayerManagerEntries,
  LAYER_MANAGER_CATEGORIES,
  summarizeLayerGroupSelection,
  type LayerManagerCategory,
} from "@/features/planner/editor/layerManagerEntries";
import {
  LAYER_MANAGER_UI_STATE_KEY,
  loadLayerManagerUiStateFromStorage,
} from "@/features/planner/editor/layerManagerUiState";
import { alignPlannerSelection, distributePlannerSelection } from "@/features/planner/lib/editorTools";

interface LayerManagerPanelProps {
  editor: Editor | null;
  unitSystem: "metric" | "imperial";
}

export function LayerManagerPanel({ editor, unitSystem }: LayerManagerPanelProps) {
  const [version, setVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState<LayerManagerCategory>(
    () => loadLayerManagerUiStateFromStorage().activeCategory,
  );
  const [query, setQuery] = useState(() => loadLayerManagerUiStateFromStorage().query);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(
    () => loadLayerManagerUiStateFromStorage().collapsedGroups,
  );

  useEffect(() => {
    if (!editor) return;
    const cleanupDocument = editor.store.listen(
      () => setVersion((current) => current + 1),
      { scope: "document" },
    );
    const cleanupSession = editor.store.listen(
      () => setVersion((current) => current + 1),
      { scope: "session" },
    );
    return () => {
      cleanupDocument();
      cleanupSession();
    };
  }, [editor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        LAYER_MANAGER_UI_STATE_KEY,
        JSON.stringify({
          activeCategory,
          query,
          collapsedGroups,
        }),
      );
    } catch {
      // Ignore unavailable storage in constrained environments.
    }
  }, [activeCategory, collapsedGroups, query]);

  const entries = useMemo(() => {
    void version;
    if (!editor) return [];
    return buildLayerManagerEntries(
      editor.getCurrentPageShapes(),
      editor.getSelectedShapeIds(),
      unitSystem,
    );
  }, [editor, unitSystem, version]);

  const selectedIds = useMemo(
    () => entries.filter((entry) => entry.isSelected).map((entry) => entry.id as TLShapeId),
    [entries],
  );
  const visibleEntries = useMemo(
    () => filterLayerManagerEntries(entries, activeCategory, query),
    [activeCategory, entries, query],
  );
  const visibleGroups = useMemo(
    () => groupLayerManagerEntries(visibleEntries),
    [visibleEntries],
  );
  const visibleGroupKeys = useMemo(
    () => visibleGroups.map((group) => group.category),
    [visibleGroups],
  );
  const orderedVisibleIds = useMemo(
    () => visibleEntries.map((entry) => entry.id),
    [visibleEntries],
  );

  const hasSelection = selectedIds.length > 0;
  const hasLockedSelection = entries.some((entry) => entry.isSelected && entry.isLocked);
  const canAlign = selectedIds.length >= 2;
  const canDistribute = selectedIds.length >= 3;
  const selectionHint = hasSelection
    ? `${selectedIds.length} selected on canvas`
    : "Select items to focus, lock, and reorder";
  const selectionHelp = "Ctrl/Cmd-click adds. Shift-click selects a range.";
  const allVisibleGroupsCollapsed = visibleGroupKeys.length > 0 && visibleGroupKeys.every((key) => collapsedGroups[key] === true);

  const handleSelectAll = () => {
    editor?.selectAll();
  };

  const handleFitSelection = () => {
    if (!editor || selectedIds.length === 0) return;
    editor.zoomToSelection({ animation: { duration: 200 } });
  };

  const handleToggleSelectionLock = () => {
    if (!editor || selectedIds.length === 0) return;
    editor.toggleLock(selectedIds);
  };

  const handleAlignSelection = (operation: Parameters<Editor["alignShapes"]>[1]) => {
    if (!editor || selectedIds.length < 2) return;
    alignPlannerSelection(editor, selectedIds, operation);
  };

  const handleDistributeSelection = (operation: Parameters<Editor["distributeShapes"]>[1]) => {
    if (!editor || selectedIds.length < 3) return;
    distributePlannerSelection(editor, selectedIds, operation);
  };

  const handleSelectShape = (shapeId: string, event?: MouseEvent<HTMLButtonElement>) => {
    if (!editor) return;

    const nextIds = getNextLayerSelection({
      anchorId: selectionAnchorId,
      clickedId: shapeId,
      currentIds: selectedIds,
      orderedIds: orderedVisibleIds,
      extendRange: event?.shiftKey === true,
      toggleSelection: event?.metaKey === true || event?.ctrlKey === true,
    });

    if (nextIds.length === 0) {
      editor.selectNone();
    } else {
      editor.setSelectedShapes(nextIds as TLShapeId[]);
    }

    setSelectionAnchorId(shapeId);
  };

  const handleToggleShapeLock = (shapeId: string) => {
    if (!editor) return;
    editor.toggleLock([shapeId as TLShapeId]);
    editor.select(shapeId as TLShapeId);
  };

  const handleBringToFront = (shapeId: string) => {
    if (!editor) return;
    editor.bringToFront([shapeId as TLShapeId]);
    editor.select(shapeId as TLShapeId);
  };

  const handleSendToBack = (shapeId: string) => {
    if (!editor) return;
    editor.sendToBack([shapeId as TLShapeId]);
    editor.select(shapeId as TLShapeId);
  };

  const handleToggleGroupCollapsed = (groupKey: string) => {
    setCollapsedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const handleSetAllGroupsCollapsed = (collapsed: boolean) => {
    setCollapsedGroups((current) => {
      const next = { ...current };
      for (const key of visibleGroupKeys) {
        next[key] = collapsed;
      }
      return next;
    });
  };

  const handleSelectGroup = (groupIds: string[]) => {
    if (!editor || groupIds.length === 0) return;
    editor.setSelectedShapes(groupIds as TLShapeId[]);
    setSelectionAnchorId(groupIds[0] ?? null);
  };

  const handleFitGroup = (groupIds: string[]) => {
    if (!editor || groupIds.length === 0) return;
    editor.setSelectedShapes(groupIds as TLShapeId[]);
    editor.zoomToSelection({ animation: { duration: 200 } });
    setSelectionAnchorId(groupIds[0] ?? null);
  };

  const handleToggleGroupLock = (groupEntries: Array<{ id: string; isLocked: boolean }>, allSelectedLocked: boolean) => {
    const groupIds = groupEntries.map((entry) => entry.id);
    if (!editor || groupIds.length === 0) return;
    const targetIds = (
      allSelectedLocked
        ? groupEntries.filter((entry) => entry.isLocked).map((entry) => entry.id)
        : groupEntries.filter((entry) => !entry.isLocked).map((entry) => entry.id)
    ) as TLShapeId[];

    if (targetIds.length === 0) return;

    editor.setSelectedShapes(groupIds as TLShapeId[]);
    editor.toggleLock(targetIds);
    setSelectionAnchorId(groupIds[0] ?? null);
  };

  return (
    <section className="pwx-layers mt-3 border-t border-[color:var(--planner-border-soft)] pt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="typ-label text-muted">Manage Layers</p>
          <p className="mt-1 text-xs text-soft">{selectionHint}</p>
          <p className="mt-1 text-[11px] text-[color:var(--planner-text-muted)]">{selectionHelp}</p>
        </div>
        <span className="rounded-full border border-[color:var(--planner-border-soft)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
          {entries.length} items
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <ActionButton label="Select all" onClick={handleSelectAll}>
          <MousePointer2 size={14} strokeWidth={1.75} />
        </ActionButton>
        <ActionButton label="Fit selection" onClick={handleFitSelection} disabled={!hasSelection}>
          <ScanSearch size={14} strokeWidth={1.75} />
        </ActionButton>
        <ActionButton
          label={hasLockedSelection ? "Unlock" : "Lock"}
          onClick={handleToggleSelectionLock}
          disabled={!hasSelection}
        >
          {hasLockedSelection ? <LockOpen size={14} strokeWidth={1.75} /> : <Lock size={14} strokeWidth={1.75} />}
        </ActionButton>
      </div>

      <div className="mt-3 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
              Arrange Selection
            </p>
            <p className="mt-1 text-xs text-soft">
              Align with 2+ items. Distribute with 3+.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          <IconButton label="Align left" onClick={() => handleAlignSelection("left")} disabled={!canAlign}>
            <AlignHorizontalJustifyStart size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Align center horizontally" onClick={() => handleAlignSelection("center-horizontal")} disabled={!canAlign}>
            <AlignHorizontalJustifyCenter size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Align right" onClick={() => handleAlignSelection("right")} disabled={!canAlign}>
            <AlignHorizontalJustifyEnd size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Distribute horizontally" onClick={() => handleDistributeSelection("horizontal")} disabled={!canDistribute}>
            <BetweenHorizonalStart size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Align top" onClick={() => handleAlignSelection("top")} disabled={!canAlign}>
            <AlignVerticalJustifyStart size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Align center vertically" onClick={() => handleAlignSelection("center-vertical")} disabled={!canAlign}>
            <AlignVerticalJustifyCenter size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Align bottom" onClick={() => handleAlignSelection("bottom")} disabled={!canAlign}>
            <AlignVerticalJustifyEnd size={14} strokeWidth={1.75} />
          </IconButton>
          <IconButton label="Distribute vertically" onClick={() => handleDistributeSelection("vertical")} disabled={!canDistribute}>
            <BetweenVerticalStart size={14} strokeWidth={1.75} />
          </IconButton>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] p-3">
        <label className="flex items-center gap-2 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] px-3 py-2 text-[color:var(--planner-text-muted)]">
          <Search size={14} strokeWidth={1.75} />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search layers"
            className="w-full bg-transparent text-xs text-[color:var(--planner-text-body)] outline-none placeholder:text-[color:var(--planner-text-muted)]"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {LAYER_MANAGER_CATEGORIES.map((category) => (
            <FilterChip
              key={category}
              label={category}
              active={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>
        {visibleGroupKeys.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <HeaderActionButton
              label="Expand all groups"
              onClick={() => handleSetAllGroupsCollapsed(false)}
              disabled={!allVisibleGroupsCollapsed}
            >
              Expand all
            </HeaderActionButton>
            <HeaderActionButton
              label="Collapse all groups"
              onClick={() => handleSetAllGroupsCollapsed(true)}
              disabled={allVisibleGroupsCollapsed}
            >
              Collapse all
            </HeaderActionButton>
          </div>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-4 py-5 text-center text-xs leading-5 text-soft">
          Add walls, zones, or furniture to manage them here.
        </div>
      ) : visibleEntries.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-4 py-5 text-center text-xs leading-5 text-soft">
          No layers match this filter yet.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {visibleGroups.map((group) => (
            <section key={group.category} className="space-y-2">
              {(() => {
                const summary = summarizeLayerGroupSelection(group.entries);
                const groupIds = group.entries.map((entry) => entry.id);
                const allLocked = group.entries.every((entry) => entry.isLocked);
                const isCollapsed = collapsedGroups[group.category] === true;
                return (
              <div className="flex items-center justify-between gap-3 px-1">
                <button
                  type="button"
                  onClick={() => handleToggleGroupCollapsed(group.category)}
                  aria-expanded={!isCollapsed}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-text-muted)]">
                    {isCollapsed ? <ChevronRight size={12} strokeWidth={1.75} /> : <ChevronDown size={12} strokeWidth={1.75} />}
                  </span>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
                    {group.label}
                  </p>
                  <span className="rounded-full border border-[color:var(--planner-border-soft)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--planner-text-muted)]">
                    {summary.selectedCount}/{summary.totalCount}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <HeaderActionButton
                    label={summary.allSelected ? "Group selected" : "Select group"}
                    onClick={() => handleSelectGroup(groupIds)}
                    disabled={summary.allSelected}
                  >
                    {summary.allSelected ? "Selected" : "Select"}
                  </HeaderActionButton>
                  <HeaderActionButton
                    label="Fit group"
                    onClick={() => handleFitGroup(groupIds)}
                  >
                    Fit
                  </HeaderActionButton>
                  <HeaderActionButton
                    label={allLocked ? "Unlock group" : "Lock group"}
                    onClick={() => handleToggleGroupLock(group.entries, allLocked)}
                  >
                    {allLocked ? "Unlock" : "Lock"}
                  </HeaderActionButton>
                </div>
              </div>
                );
              })()}
              {collapsedGroups[group.category] === true ? null : group.entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-2xl border px-3 py-3 transition-colors ${
                    entry.isSelected
                      ? "border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-primary-soft)]/60"
                      : "border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={(event) => handleSelectShape(entry.id, event)}
                      title={`Select ${entry.label}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-strong">{entry.label}</p>
                        <span className="rounded-full border border-[color:var(--planner-border-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)]">
                          {entry.typeLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-soft">{entry.detail}</p>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <IconButton
                        label={entry.isLocked ? "Unlock layer" : "Lock layer"}
                        onClick={() => handleToggleShapeLock(entry.id)}
                        active={entry.isLocked}
                      >
                        {entry.isLocked ? <Lock size={14} strokeWidth={1.75} /> : <LockOpen size={14} strokeWidth={1.75} />}
                      </IconButton>
                      <IconButton label="Bring to front" onClick={() => handleBringToFront(entry.id)}>
                        <ArrowUpToLine size={14} strokeWidth={1.75} />
                      </IconButton>
                      <IconButton label="Send to back" onClick={() => handleSendToBack(entry.id)}>
                        <ArrowDownToLine size={14} strokeWidth={1.75} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-[color:var(--planner-primary-soft)] bg-[color:var(--planner-primary-soft)] text-[color:var(--planner-primary)]"
          : "border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-text-muted)] hover:border-[color:var(--planner-primary)] hover:text-[color:var(--planner-primary)]"
      }`}
    >
      {label}
    </button>
  );
}

function HeaderActionButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-full border border-[color:var(--planner-border-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--planner-text-muted)] transition-colors enabled:hover:border-[color:var(--planner-primary)] enabled:hover:text-[color:var(--planner-primary)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center justify-center gap-2 rounded-2xl border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-3 text-xs font-semibold text-[color:var(--planner-text-body)] transition-colors enabled:hover:border-[color:var(--planner-primary)] enabled:hover:text-[color:var(--planner-primary)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
      <span className="truncate">{label}</span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${
        disabled
          ? "cursor-not-allowed border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-text-muted)] opacity-35"
          : active
            ? "border-[color:var(--planner-accent-soft)] bg-[color:var(--planner-accent-soft)] text-[color:var(--planner-accent-strong)]"
            : "border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel)] text-[color:var(--planner-text-muted)] hover:border-[color:var(--planner-primary)] hover:text-[color:var(--planner-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
