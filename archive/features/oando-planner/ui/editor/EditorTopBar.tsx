"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { ProjectManagerModal } from "./ProjectManagerModal";
import { useDialogA11y } from "@/features/oando-planner/hooks/useDialogA11y";
import { useAIStore } from "@/features/oando-planner/data/aiStore";
import { OfflinePill } from "./OfflinePill";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { Ic, TBtn, Divider } from "./EditorTopBarIcons";
import { FileMenu, MobileMenu } from "./EditorTopBarMenus";
import { ShareProjectModal } from "./ShareProjectModal";
import { useEditorTopBarActions } from "./useEditorTopBarActions";
import "./topbar.css";

interface Props {
  onOpenTemplates: () => void;
  onOpenRefine?: () => void;
  onOpenShortcuts: () => void;
  onSave?: () => void;
  onOpenCluster?: () => void;
  onOpenAutoArrange?: () => void;
  onOpenPresentation?: () => void;
  onOpenZonePlanning?: () => void;
  onToggleSpacing?: () => void;
  showSpacing?: boolean;
  onOpenIntegrations?: () => void;
  integrationsOpen?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onOpenQuote?: () => void;
  guestMode?: boolean;
  readOnly?: boolean;
  refineOpen?: boolean;
}

export function EditorTopBar({ onOpenTemplates, onOpenRefine, onOpenShortcuts, onSave, onOpenCluster, onOpenAutoArrange, onOpenPresentation, onOpenZonePlanning, onToggleSpacing, showSpacing, onOpenIntegrations, integrationsOpen, onToggleSidebar, sidebarOpen, onOpenQuote, guestMode = false, readOnly = false, refineOpen = false }: Props) {
  const effectiveReadOnly = guestMode || readOnly;
  const { projectName, setProjectName, isDirty } = usePlannerStore();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [loadMenuOpen, setLoadMenuOpen] = useState(false);
  // React-controlled breakpoints — avoids Tailwind responsive class issues in App Router
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 640 : false);
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" ? window.innerWidth < 1024 : false);
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsNarrow(window.innerWidth < 1024);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const { isOpen: aiOpen, setOpen: setAIOpen } = useAIStore();
  const {
    fileInputRef,
    imageInputRef,
    shareModalOpen,
    setShareModalOpen,
    shareURL,
    shareCopied,
    handleSave,
    handleExportJSON,
    handleExportPNG,
    handleExportPDF,
    handleExportSVG,
    handleExportBOQ,
    handleExportBOQJSON,
    handleShare,
    handlePublishToPortal,
    handleCopyShareURL,
    handleImport,
    handleImportImage,
    handleImageImport,
    handleFileChange,
    handleNewProject,
  } = useEditorTopBarActions({ onSave, readOnly: effectiveReadOnly });
  const shareDialogRef = useDialogA11y(shareModalOpen, () => setShareModalOpen(false));

  const undoCount = usePlannerStore((s) => s.undoStack.length);
  const redoCount = usePlannerStore((s) => s.redoStack.length);
  const canUndo = undoCount > 0;
  const canRedo = redoCount > 0;
  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const [lastNon3DViewMode, setLastNon3DViewMode] = useState<"2d" | "split">("2d");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format badge display: cap at 99+
  const formatBadgeCount = (count: number): string => {
    if (count > 99) return "99+";
    return String(count);
  };

  useEffect(() => {
    if (mobileMenuOpen) {
      const handler = (e: MouseEvent | TouchEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-mobile-menu]")) setMobileMenuOpen(false);
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("touchstart", handler);
      return () => {
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("touchstart", handler);
      };
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (viewMode !== "3d") {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setLastNon3DViewMode(viewMode);
    }
  }, [viewMode]);

  const handleOneClick3D = () => {
    if (viewMode === "3d") {
      setViewMode(lastNon3DViewMode);
      return;
    }
    setViewMode("3d");
  };

  const oneClick3DTitle =
    viewMode === "3d"
      ? `Return to ${lastNon3DViewMode === "split" ? "Split View" : "2D Plan"}`
      : "One click to 3D";

  return (
    <>
      {/* â”€â”€ Top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="planner-topbar">
        {/* â”€â”€ Left: logo (clickable breadcrumb back to planner dashboard) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <Link
          href="/oando-planner/dashboard"
          aria-label="Back to planner dashboard"
          title="Back to planner dashboard"
          onClick={(e) => {
            if (isDirty) {
              if (!confirm("You have unsaved changes. Leave without saving?")) {
                e.preventDefault();
              }
            }
          }}
          className="flex items-center gap-2 shrink-0 group mr-1"
        >
          <div className="w-6 h-6 rounded-md bg-[var(--color-accent)] flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-[10px] tracking-tight leading-none">O</span>
          </div>
          {!isMobile && (
            <span className="text-[13px] font-semibold text-[var(--text-inverse)] group-hover:text-[var(--text-inverse)] transition-colors tracking-tight">
              One&amp;Only
            </span>
          )}
        </Link>

        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={sidebarOpen ? "true" : "false"}
            className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-dark-midnight-blue-100)] hover:text-[var(--text-inverse)] hover:bg-white/[0.06] transition-colors"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen ? (
                <><rect x="1" y="2" width="14" height="12" rx="1.5"/><path d="M5.5 2v12"/></>
              ) : (
                <><rect x="1" y="2" width="14" height="12" rx="1.5"/><path d="M5.5 2v12" opacity="0.3"/><path d="M8 6l-2 2 2 2"/></>
              )}
            </svg>
          </button>
        )}

        <Divider />

        {/* Project name + status cluster */}
        <div className="flex min-w-0 items-center gap-2">
          <input
            type="text"
            value={projectName}
            onChange={(e) => {
              if (effectiveReadOnly) return;
              setProjectName(e.target.value);
            }}
            aria-label="Project name"
            disabled={effectiveReadOnly}
            className={`bg-transparent text-[var(--text-inverse)] text-[13px] font-medium px-0 py-0 outline-none min-w-0 placeholder:text-[var(--color-dark-midnight-blue-200)] border-b border-transparent focus:border-white/20 transition-colors ${isMobile ? 'w-[88px]' : 'w-[160px]'}`}
            placeholder="Untitled"
          />
          {!isMobile && (
            <div className="planner-topbar__status planner-topbar__status--muted">
              <AutoSaveIndicator onSave={handleSave} />
            </div>
          )}
          {!isMobile && (
            <div className="planner-topbar__status">            </div>
          )}
          <OfflinePill />
        </div>

        <Divider />

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={!canUndo || effectiveReadOnly}
            title={`Undo (Ctrl+Z)${canUndo ? ` - ${undoCount} step${undoCount !== 1 ? 's' : ''} available` : ''}`}
            aria-label={canUndo ? `Undo, ${undoCount} step${undoCount !== 1 ? 's' : ''} available` : 'Undo, no steps available'}
            aria-disabled={!canUndo ? "true" : "false"}
            className="planner-topbar__undo-redo-btn"
          >
            <Ic.Undo />
            {canUndo && (
              <span className="planner-topbar__history-badge" aria-hidden="true">
                {formatBadgeCount(undoCount)}
              </span>
            )}
          </button>
          <button
            onClick={redo}
            disabled={!canRedo || effectiveReadOnly}
            title={`Redo (Ctrl+Shift+Z)${canRedo ? ` - ${redoCount} step${redoCount !== 1 ? 's' : ''} available` : ''}`}
            aria-label={canRedo ? `Redo, ${redoCount} step${redoCount !== 1 ? 's' : ''} available` : 'Redo, no steps available'}
            aria-disabled={!canRedo ? "true" : "false"}
            className="planner-topbar__undo-redo-btn"
          >
            <Ic.Redo />
            {canRedo && (
              <span className="planner-topbar__history-badge" aria-hidden="true">
                {formatBadgeCount(redoCount)}
              </span>
            )}
          </button>
        </div>

        {/* â”€â”€ Left: file operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {!isMobile && (
          <>
            <FileMenu
              guestMode={guestMode}
              readOnly={effectiveReadOnly}
              open={loadMenuOpen}
              setOpen={setLoadMenuOpen}
              onNewProject={handleNewProject}
              onOpenProjects={() => setProjectsOpen(true)}
              onImport={handleImport}
              onSave={handleSave}
              onExportPDF={handleExportPDF}
              onExportSVG={handleExportSVG}
              onExportPNG={handleExportPNG}
              onExportJSON={handleExportJSON}
              onExportBOQ={handleExportBOQ}
              onExportBOQJSON={handleExportBOQJSON}
              onOpenRefine={onOpenRefine}
              onOpenQuote={onOpenQuote}
              onShare={handleShare}
              onPublishToPortal={handlePublishToPortal}
              onImportImage={handleImportImage}
            />

            <TBtn onClick={effectiveReadOnly ? undefined : onOpenTemplates} title="Templates" disabled={effectiveReadOnly}><Ic.Templates /></TBtn>

            {!effectiveReadOnly && (
              <TBtn onClick={handleSave} title="Save (Ctrl+S)" className="text-[var(--color-accent)]">
                <Ic.Save />
              </TBtn>
            )}
          </>
        )}

        {/* ── Center: Guided Steps ────────────────────── */}
        <div className="flex-1 flex justify-center">
          {!isMobile && (
            <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-inner">
              <button 
                onClick={() => setViewMode("2d")}
                className={`flex items-center px-4 py-1.5 rounded-lg text-[12px] font-medium tracking-tight transition-all duration-300 ${viewMode === "2d" && !refineOpen ? "bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <span className="opacity-60 mr-1.5 text-[10px] font-bold">01</span>
                Sketch
              </button>
              <button 
                onClick={() => onOpenRefine?.()}
                disabled={effectiveReadOnly}
                className={`flex items-center px-4 py-1.5 rounded-lg text-[12px] font-medium tracking-tight transition-all duration-300 disabled:opacity-30 ${refineOpen ? "bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <span className="opacity-60 mr-1.5 text-[10px] font-bold">02</span>
                Refine
              </button>
              <button 
                onClick={() => setViewMode("3d")}
                className={`flex items-center px-4 py-1.5 rounded-lg text-[12px] font-medium tracking-tight transition-all duration-300 ${viewMode === "3d" && !refineOpen ? "bg-gradient-to-r from-[var(--color-primary)] to-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" : "text-white/60 hover:text-white hover:bg-white/10"}`}
              >
                <span className="opacity-60 mr-1.5 text-[10px] font-bold">03</span>
                Preview
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* â”€â”€ Right: tools & export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-1">

          {!isMobile && (
            <>
              <Divider />
            </>
          )}

          {/* Wide-screen extras */}
          {!isNarrow && onOpenCluster && (
            <TBtn onClick={onOpenCluster} title="Workstation Clusters"><Ic.Clusters /></TBtn>
          )}
          {!isNarrow && onOpenAutoArrange && (
            <TBtn onClick={onOpenAutoArrange} title="Auto-Arrange"><Ic.Arrange /></TBtn>
          )}
          {!isNarrow && onOpenZonePlanning && (
            <TBtn onClick={onOpenZonePlanning} title="Zone Planning"><Ic.Zones /></TBtn>
          )}
          {!isNarrow && onToggleSpacing && (
            <TBtn onClick={onToggleSpacing} title="Spacing Overlay" active={showSpacing}>
              <Ic.Spacing />
            </TBtn>
          )}
          {!isNarrow && onOpenPresentation && (
            <TBtn onClick={onOpenPresentation} title="Presentation Mode"><Ic.Present /></TBtn>
          )}
          {!isNarrow && <Divider />}

          {/* AI */}
          {!isMobile && !effectiveReadOnly && (
            <TBtn onClick={() => setAIOpen(!aiOpen)} title="AI Design Assistant (Ctrl+I)" active={aiOpen}>
              <Ic.AI />
            </TBtn>
          )}

          {/* Integrations */}
          {!isMobile && onOpenIntegrations && (
            <TBtn onClick={onOpenIntegrations} title="Integrations" active={integrationsOpen}>
              <Ic.Integrations />
            </TBtn>
          )}

          {/* Shortcuts hint â€” desktop */}
          {!isMobile && (
            <button
              onClick={onOpenShortcuts}
              title="Keyboard shortcuts (?)"
              className="w-7 h-7 rounded flex items-center justify-center text-[var(--color-dark-midnight-blue-200)] hover:text-[var(--color-dark-midnight-blue-100)] hover:bg-white/[0.06] transition-colors"
            >
              <Ic.Shortcut />
            </button>
          )}

          {/* Mobile menu */}
          {isMobile && (
            <MobileMenu
              guestMode={guestMode}
              readOnly={effectiveReadOnly}
              open={mobileMenuOpen}
              setOpen={setMobileMenuOpen}
              viewMode={viewMode}
              setViewMode={setViewMode}
              oneClick3DTitle={oneClick3DTitle}
              onOneClick3D={handleOneClick3D}
              onOpenTemplates={onOpenTemplates}
              onOpenProjects={() => setProjectsOpen(true)}
              onNewProject={handleNewProject}
              onSave={handleSave}
              onExportPNG={handleExportPNG}
              onExportPDF={handleExportPDF}
              onExportSVG={handleExportSVG}
              onExportJSON={handleExportJSON}
              onExportBOQ={handleExportBOQ}
              onExportBOQJSON={handleExportBOQJSON}
              onOpenRefine={onOpenRefine}
              onImport={handleImport}
              onImportImage={handleImportImage}
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          aria-label="Import project file"
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          onChange={handleImageImport}
          aria-label="Import floor plan image"
          className="hidden"
        />
      </div>

      <ProjectManagerModal open={projectsOpen} onClose={() => setProjectsOpen(false)} readOnly={effectiveReadOnly} />

      <ShareProjectModal
        open={shareModalOpen}
        shareURL={shareURL}
        shareCopied={shareCopied}
        dialogRef={shareDialogRef}
        onClose={() => setShareModalOpen(false)}
        onCopy={handleCopyShareURL}
      />
    </>
  );
}



