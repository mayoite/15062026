"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  DownloadSimple,
  ArrowArcRight,
  ArrowCounterClockwise,
  ArrowClockwise,
  Trash,
  ArrowArcLeft,
  Intersect,
  Exclude,
} from "@phosphor-icons/react";
import { useFloorplan } from "./context/FloorplanContext";
import { FabricDrawToolsBar } from "./FabricDrawToolsBar";
import { PlannerTooltip } from "@/features/planner/ui/PlannerTooltip";

function IconButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <PlannerTooltip label={title} side="bottom" disabled={disabled}>
      <button
        type="button"
        className="fcw-icon-btn"
        aria-label={title}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </PlannerTooltip>
  );
}

function ArrangeMenu({ app }: { app: ReturnType<typeof useFloorplan> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const item = (label: string, action: () => void, disabled?: boolean) => (
    <button
      type="button"
      className="fcw-menu-item"
      disabled={disabled}
      onClick={() => {
        action();
        setOpen(false);
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="fcw-menu-wrap" ref={ref}>
      <button type="button" className="fcw-btn" onClick={() => setOpen((v) => !v)} disabled={app.roomEdit}>
        Arrange
      </button>
      {open ? (
        <div className="fcw-menu">
          {item("Arrange Left", () => app.arrange("LEFT"), app.selections.length < 2)}
          {item("Arrange Center", () => app.arrange("CENTER"), app.selections.length < 2)}
          {item("Arrange Right", () => app.arrange("RIGHT"), app.selections.length < 2)}
          {item("Arrange Top", () => app.arrange("TOP"), app.selections.length < 2)}
          {item("Arrange Middle", () => app.arrange("MIDDLE"), app.selections.length < 2)}
          {item("Arrange Bottom", () => app.arrange("BOTTOM"), app.selections.length < 2)}
          {item("Center Horizontally", () => app.placeInCenter("HORIZONTAL"))}
          {item("Center Vertically", () => app.placeInCenter("VERTICAL"))}
        </div>
      ) : null}
    </div>
  );
}

type FabricCanvasSubToolbarProps = {
  onExport?: () => void;
};

export function FabricCanvasSubToolbar({ onExport }: FabricCanvasSubToolbarProps) {
  const app = useFloorplan();
  const [init, setInit] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setInit(true), 100);
    return () => window.clearTimeout(t);
  }, []);

  const exportDraft = () => {
    if (onExport) {
      onExport();
      return;
    }
    const serialized = app.exportDraft();
    if (!serialized) return;
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `plan-session-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const undoDisabled = app.roomEdit ? app.roomEditStates.length === 1 : app.states.length === 1;
  const redoDisabled = app.roomEdit ? app.roomEditRedoStates.length === 0 : app.redoStates.length === 0;

  if (!init) return <div className="pw-subtopbar pw-subtopbar--fabric" aria-hidden />;

  if (app.roomEdit) {
    return (
      <div className="pw-subtopbar pw-subtopbar--fabric fcw-toolbar" role="toolbar" aria-label="Room edit tools">
        <div className="fcw-toolbar-group">
          <IconButton title="Undo" disabled={undoDisabled} onClick={app.undo}>
            <ArrowArcLeft size={18} weight="bold" />
          </IconButton>
          <IconButton title="Redo" disabled={redoDisabled} onClick={app.redo}>
            <ArrowArcRight size={18} weight="bold" />
          </IconButton>
        </div>
        <div className="fcw-toolbar-separator" />
        <div className="fcw-toolbar-group">
          <button
            type="button"
            className={`fcw-btn fcw-btn--dark${app.snapEnabled ? " fcw-btn--primary" : ""}`}
            onClick={app.toggleSnap}
          >
            <span>Snap</span>
          </button>
          <button
            type="button"
            className={`fcw-btn fcw-btn--dark${app.gridEnabled ? " fcw-btn--primary" : ""}`}
            onClick={app.toggleGrid}
          >
            <span>Grid</span>
          </button>
        </div>
        <div className="fcw-toolbar-separator" />
        <div className="fcw-toolbar-group">
          <button type="button" className="fcw-btn fcw-btn--primary" onClick={app.endEditRoom}>
            End room edit
          </button>
          <button type="button" className="fcw-btn" onClick={exportDraft}>
            <DownloadSimple size={18} weight="bold" />
            <span>Export</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pw-subtopbar pw-subtopbar--fabric fcw-toolbar" role="toolbar" aria-label="Canvas tools">
      <FabricDrawToolsBar disabled={app.roomEdit} />
      <div className="fcw-toolbar-separator" />
      <div className="fcw-toolbar-group" role="group" aria-label="Canvas history">
        <IconButton title="Undo" disabled={undoDisabled} onClick={app.undo}>
          <ArrowArcLeft size={18} weight="bold" />
        </IconButton>
        <IconButton title="Redo" disabled={redoDisabled} onClick={app.redo}>
          <ArrowArcRight size={18} weight="bold" />
        </IconButton>
      </div>
      <div className="fcw-toolbar-separator" />
      <div className="fcw-toolbar-group">
        <IconButton title="Clone" disabled={app.roomEdit || !app.selections.length} onClick={app.clone}>
          <Copy size={18} weight="bold" />
        </IconButton>
        <IconButton title="Delete" disabled={app.roomEdit || !app.selections.length} onClick={app.deleteSelection}>
          <Trash size={18} weight="bold" />
        </IconButton>
        <IconButton
          title="Rotate left"
          disabled={app.roomEdit || !app.selections.length}
          onClick={app.rotateAntiClockWise}
        >
          <ArrowCounterClockwise size={18} weight="bold" />
        </IconButton>
        <IconButton
          title="Rotate right"
          disabled={app.roomEdit || !app.selections.length}
          onClick={app.rotateClockWise}
        >
          <ArrowClockwise size={18} weight="bold" />
        </IconButton>
        <IconButton title="Group" disabled={app.roomEdit || app.selections.length < 2} onClick={app.group}>
          <Intersect size={18} weight="bold" />
        </IconButton>
        <IconButton title="Ungroup" disabled={app.roomEdit || !app.ungroupable} onClick={app.ungroup}>
          <Exclude size={18} weight="bold" />
        </IconButton>
      </div>
      <div className="fcw-toolbar-separator" />
      <div className="fcw-toolbar-group">
        <button
          type="button"
          className={`fcw-btn fcw-btn--dark${app.snapEnabled ? " fcw-btn--primary" : ""}`}
          onClick={app.toggleSnap}
        >
          <span>Snap</span>
        </button>
        <button
          type="button"
          className={`fcw-btn fcw-btn--dark${app.gridEnabled ? " fcw-btn--primary" : ""}`}
          onClick={app.toggleGrid}
        >
          <span>Grid</span>
        </button>
      </div>
      <div className="fcw-toolbar-separator" />
      <div className="fcw-toolbar-group">
        <ArrangeMenu app={app} />
        <button type="button" className="fcw-btn" onClick={exportDraft}>
          <DownloadSimple size={18} weight="bold" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
