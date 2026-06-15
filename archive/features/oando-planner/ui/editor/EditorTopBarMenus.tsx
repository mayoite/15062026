"use client";

import React from "react";
import { Ic, TBtn } from "./EditorTopBarIcons";

interface FileMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onNewProject: () => void;
  onOpenProjects: () => void;
  onImport: () => void;
  onSave: () => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onExportBOQ: () => void;
  onExportBOQJSON: () => void;
  onOpenRefine?: () => void;
  onOpenQuote?: () => void;
  onShare: () => void;
  onPublishToPortal: () => void;
  onImportImage: () => void;
  guestMode?: boolean;
  readOnly?: boolean;
}

export function FileMenu({
  open,
  setOpen,
  onNewProject,
  onOpenProjects,
  onImport,
  onSave,
  onExportPDF,
  onExportSVG,
  onExportPNG,
  onExportJSON,
  onExportBOQ,
  onExportBOQJSON,
  onOpenRefine,
  onOpenQuote,
  onShare,
  onPublishToPortal,
  onImportImage,
  guestMode = false,
  readOnly = false,
}: FileMenuProps) {
  const canMutate = !guestMode && !readOnly;

  return (
    <div className="relative">
      <TBtn onClick={() => setOpen(!open)} title="File" active={open}>
        <Ic.Hamburger />
        <Ic.ChevronDown />
      </TBtn>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-[var(--surface-inverse)] border border-white/[0.1] rounded-lg shadow-2xl z-50 min-w-[200px] py-1">
            <button onClick={() => { onNewProject(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.NewFile />
              <span>New Project</span>
            </button>
            {canMutate && (
              <button onClick={() => { onOpenProjects(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                <Ic.Projects />
                <span>Projects</span>
              </button>
            )}
            <button onClick={() => { onImport(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.Import />
              <span>Import JSON</span>
            </button>
            {canMutate && onOpenRefine && (
              <button onClick={() => { onOpenRefine(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                <Ic.Arrange />
                <span>Continue to Refine</span>
              </button>
            )}
            {canMutate && (
              <>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
                <button onClick={() => { onSave(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 transition-colors" style={{ color: "var(--color-accent)" }}>
                  <Ic.Save />
                  <span>Save</span>
                </button>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
              </>
            )}
            <button onClick={() => { onExportPDF(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.PDF />
              <span>Export PDF</span>
            </button>
            <button onClick={() => { onExportSVG(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.SVG />
              <span>Export SVG</span>
            </button>
            <button onClick={() => { onExportPNG(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.PNG />
              <span>Export PNG</span>
            </button>
            <button onClick={() => { onExportJSON(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.JSON />
              <span>Export JSON</span>
            </button>
            <button onClick={() => { onExportBOQ(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.CSV />
              <span>BOQ Export (PDF)</span>
            </button>
            <button onClick={() => { onExportBOQJSON(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.JSON />
              <span>BOQ Export (JSON)</span>
            </button>
            <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
            {onOpenQuote && (
              <button onClick={() => { onOpenQuote(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                <Ic.BOQ />
                <span>Generate Quote</span>
              </button>
            )}
            {canMutate && (
              <>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
                <button onClick={() => { onShare(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                  <Ic.Share />
                  <span>Share Link</span>
                </button>
                <button onClick={() => { onPublishToPortal(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
                  <Ic.Portal />
                  <span>Publish to Portal</span>
                </button>
                <div className="h-px my-1" style={{ background: "var(--overlay-inverse-06)" }} />
              </>
            )}
            <button onClick={() => { onImportImage(); setOpen(false); }} className="w-full text-left px-3 py-2 text-[12px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.05] hover:text-[var(--text-inverse)] flex items-center gap-2 transition-colors">
              <Ic.Image />
              <span>Import Floor Plan</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface MobileMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  viewMode: "2d" | "3d" | "split";
  setViewMode: (mode: "2d" | "3d" | "split") => void;
  oneClick3DTitle: string;
  onOneClick3D: () => void;
  onOpenTemplates: () => void;
  onOpenProjects: () => void;
  onNewProject: () => void;
  onSave: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onExportBOQ: () => void;
  onExportBOQJSON: () => void;
  onOpenRefine?: () => void;
  onImport: () => void;
  onImportImage: () => void;
  guestMode?: boolean;
  readOnly?: boolean;
}

export function MobileMenu({
  open,
  setOpen,
  viewMode,
  setViewMode,
  oneClick3DTitle,
  onOneClick3D,
  onOpenTemplates,
  onOpenProjects,
  onNewProject,
  onSave,
  onExportPNG,
  onExportPDF,
  onExportSVG,
  onExportJSON,
  onExportBOQ,
  onExportBOQJSON,
  onOpenRefine,
  onImport,
  onImportImage,
  guestMode = false,
  readOnly = false,
}: MobileMenuProps) {
  const canMutate = !guestMode && !readOnly;

  return (
    <div className="relative" data-mobile-menu>
      <button
        onClick={onOneClick3D}
        title={oneClick3DTitle}
        aria-label={oneClick3DTitle}
        className={[
          "w-9 h-9 rounded flex items-center justify-center text-[11px] font-semibold transition-colors",
          viewMode === "3d"
            ? "bg-[var(--color-accent)] text-white"
            : "text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)] hover:bg-white/[0.06]",
        ].join(" ")}
      >
        3D
      </button>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded flex items-center justify-center text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)] hover:bg-white/[0.06] transition-colors"
        aria-label="More options"
      >
        <Ic.Hamburger />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-1 bg-[var(--surface-inverse)] border border-white/[0.1] rounded-lg shadow-2xl z-[100] w-[220px] py-1.5 overflow-hidden"
          data-mobile-menu
        >
          {[
            { label: "Templates", onClick: () => { onOpenTemplates(); setOpen(false); } },
            ...(canMutate ? [{ label: "Projects", onClick: () => { onOpenProjects(); setOpen(false); } }] : []),
            { label: "New", onClick: () => { onNewProject(); setOpen(false); } },
            ...((canMutate && onOpenRefine) ? [{ label: "Refine", onClick: () => { onOpenRefine(); setOpen(false); } }] : []),
            ...(canMutate ? [{ label: "Save", onClick: () => { onSave(); setOpen(false); }, accent: true }] : []),
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={[
                "w-full text-left px-3.5 py-2.5 text-[13px] hover:bg-white/[0.05] transition-colors",
                item.accent ? "text-[var(--color-accent)]" : "text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)]",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
          <div className="h-px bg-white/[0.07] my-1" />
          <p className="px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-dark-midnight-blue-200)]">View</p>
          {(["2d", "3d", "split"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setOpen(false); }}
              className={[
                "w-full text-left px-3.5 py-2.5 text-[13px] transition-colors flex items-center justify-between",
                viewMode === mode ? "text-[var(--color-accent)]" : "text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)] hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <span>{{ "2d": "2D Plan", "3d": "3D Viewer", split: "Split View" }[mode]}</span>
              {viewMode === mode && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />}
            </button>
          ))}
          <div className="h-px bg-[var(--color-accent)] my-1" />
          {canMutate && (
            <>
              <button onClick={() => { onExportPNG(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>🖼️</span>
            <span>Export PNG</span>
          </button>
          <button onClick={() => { onExportPDF(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📄</span>
            <span>Export PDF</span>
          </button>
          <button onClick={() => { onExportSVG(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📐</span>
            <span>Export SVG</span>
          </button>
          <button onClick={() => { onExportJSON(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📤</span>
            <span>Export JSON</span>
          </button>
          <button onClick={() => { onExportBOQ(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📊</span>
            <span>BOQ (PDF)</span>
          </button>
          <button onClick={() => { onExportBOQJSON(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📋</span>
            <span>BOQ (JSON)</span>
          </button>
            </>
          )}
          <button onClick={() => { onImport(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>📥</span>
            <span>Import JSON</span>
          </button>
          <button onClick={() => { onImportImage(); setOpen(false); }} className="w-full text-left px-4 py-3 text-[13px] text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] flex items-center gap-3">
            <span>🖼️</span>
            <span>Import Floor Plan</span>
          </button>
        </div>
      )}
    </div>
  );
}
