"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileDown,
  FolderOpen,
  HelpCircle,
  LayoutTemplate,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import type { Editor } from "tldraw";

import { PlannerThemeToggle } from "@/features/planner/components/PlannerThemeToggle";
import { useTheme } from "@/features/planner/components/WorkspaceThemeProvider";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import type { PlannerSaveStatus } from "@/features/planner/hooks/usePlannerAutosave";
import { PlannerHistoryControls } from "@/features/planner/editor/PlannerHistoryControls";
import { PlannerSaveIndicator } from "@/features/planner/ui/PlannerSaveIndicator";

interface PlannerTopBarProps {
  guestMode: boolean;
  planName: string;
  viewMode: "2d" | "3d" | "split";
  onViewModeChange: (mode: "2d" | "3d" | "split") => void;
  saveStatus: PlannerSaveStatus;
  lastSavedAt: string | null;
  onRetrySave: () => void;
  onOpenSession: () => void;
  onOpenTemplates: () => void;
  onOpenAi: () => void;
  onOpenExport: () => void;
  editor: Editor | null;
  onCanvasReset?: () => void;
}

export function PlannerTopBar({
  guestMode,
  planName,
  viewMode,
  onViewModeChange,
  saveStatus,
  lastSavedAt,
  onRetrySave,
  onOpenSession,
  onOpenTemplates,
  onOpenAi,
  onOpenExport,
  editor,
  onCanvasReset,
}: PlannerTopBarProps) {
  const { resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <header className="pw-topbar">
      <div className="pw-topbar-brand">
        <Link href="/" className="pw-topbar-logo-link" aria-label="One&Only — home">
          <OneAndOnlyLogo
            variant={resolvedTheme === "dark" ? "white" : "orange"}
            className="pw-topbar-logo"
          />
        </Link>
        <div className="min-w-0">
          <p className="pw-topbar-title">{planName.trim() || "Workspace Planner"}</p>
          <p className="pw-topbar-sub">
            {guestMode ? "Guest session — saves in this browser" : "Your layout workspace"}
          </p>
        </div>
        {guestMode && <span className="pw-badge">Guest</span>}
      </div>

      <PlannerHistoryControls editor={editor} onReset={onCanvasReset} tooltipSide="bottom" />

      <div data-coach="view-toggle" className="pw-topbar-center pw-segment">
        {(["2d", "3d", "split"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            className="pw-segment-btn"
            data-active={viewMode === mode}
            aria-pressed={viewMode === mode}
          >
            {mode === "2d" ? "2D" : mode === "3d" ? "3D" : "Split"}
          </button>
        ))}
      </div>

      <div className="pw-topbar-actions">
        <div className="pw-topbar-actions-primary">
          <PlannerThemeToggle />
          <PlannerSaveIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            onRetry={onRetrySave}
          />
          <button
            type="button"
            data-coach="templates"
            onClick={onOpenTemplates}
            className="pw-icon-btn pw-icon-btn--labeled"
          >
            <LayoutTemplate size={14} aria-hidden />
            <span>Templates</span>
          </button>
          <button
            type="button"
            data-coach="ai-advisor"
            onClick={onOpenAi}
            className="pw-icon-btn pw-icon-btn--labeled"
          >
            <Sparkles size={14} aria-hidden />
            <span>AI</span>
          </button>
        </div>

        <div className="pw-topbar-actions-wide">
          <Link
            href="/planner/help/"
            data-coach="help-link"
            className="pw-icon-btn pw-icon-btn--labeled"
            aria-label="Open planner help"
          >
            <HelpCircle size={14} aria-hidden />
            <span>Help</span>
          </Link>
          <button
            type="button"
            className="pw-icon-btn pw-icon-btn--labeled"
            onClick={onOpenSession}
            aria-label="Open plan sessions"
          >
            <FolderOpen size={14} aria-hidden />
            <span>Plans</span>
          </button>
          {editor && (
            <div data-coach="export" className="pw-topbar-export">
              <button
                type="button"
                onClick={onOpenExport}
                className="pw-icon-btn pw-icon-btn--labeled"
                title="Export plan"
              >
                <FileDown size={14} aria-hidden />
                <span>Export</span>
              </button>
            </div>
          )}
        </div>

        <div className="pw-topbar-menu" ref={menuRef}>
          <button
            type="button"
            className="pw-icon-btn"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="More actions"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={16} aria-hidden />
          </button>
          {menuOpen && (
            <div className="pw-topbar-menu-panel" role="menu">
              <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onOpenTemplates(); setMenuOpen(false); }}>
                Templates
              </button>
              <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onOpenAi(); setMenuOpen(false); }}>
                AI advisor
              </button>
              <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onOpenSession(); setMenuOpen(false); }}>
                Plan sessions
              </button>
              <Link href="/planner/help/" role="menuitem" className="pw-menu-item" onClick={() => setMenuOpen(false)}>
                Help
              </Link>
              {editor && (
                <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onOpenExport(); setMenuOpen(false); }}>
                  Export plan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
