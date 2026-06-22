"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileUp,
  FolderOpen,
  HelpCircle,
  LayoutTemplate,
  MoreHorizontal,
  Save,
  Sparkles,
} from "lucide-react";

import { PlannerThemeToggle } from "@/features/planner/components/PlannerThemeToggle";
import { useTheme } from "@/features/planner/components/WorkspaceThemeProvider";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import type { PlannerSaveStatus } from "@/features/planner/hooks/usePlannerAutosave";
import { PlannerSaveIndicator } from "@/features/planner/ui/PlannerSaveIndicator";
import { PlannerStepBar } from "@/features/planner/editor/PlannerStepBar";
import type { PlannerStep } from "@/features/planner/editor/plannerStep";

interface PlannerTopBarProps {
  guestMode: boolean;
  planName: string;
  plannerStep: PlannerStep;
  disabledSteps: Partial<Record<PlannerStep, boolean>>;
  onPlannerStepChange: (step: PlannerStep) => void;
  saveStatus: PlannerSaveStatus;
  lastSavedAt: string | null;
  onRetrySave: () => void;
  onOpenSession: () => void;
  onSaveDraft: () => void;
  onImport: () => void;
  onUploadFloorPlan?: () => void;
  onOpenTemplates: () => void;
  onOpenAi: () => void;
  isOnline?: boolean;
}

export function PlannerTopBar({
  guestMode,
  planName,
  plannerStep,
  disabledSteps,
  onPlannerStepChange,
  saveStatus,
  lastSavedAt,
  onRetrySave,
  onOpenSession,
  onSaveDraft,
  onImport,
  onUploadFloorPlan,
  onOpenTemplates,
  onOpenAi,
  isOnline = true,
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

      <div className="pw-topbar-center">
        <PlannerStepBar
          current={plannerStep}
          disabledSteps={disabledSteps}
          onChange={onPlannerStepChange}
          compact
          showIntro={false}
        />
      </div>

      <div className="pw-topbar-actions">
        <div className="pw-topbar-actions-primary flex items-center gap-2">
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 typ-caption font-semibold uppercase tracking-[0.1em] text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Offline
            </span>
          )}
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
            <span>Plan Sessions</span>
          </button>
          <button
            type="button"
            className="pw-icon-btn pw-icon-btn--labeled"
            onClick={onSaveDraft}
            aria-label="Save local draft"
          >
            <Save size={14} aria-hidden />
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            className="pw-icon-btn pw-icon-btn--labeled"
            onClick={onImport}
            aria-label="Import planner JSON"
          >
            <FileUp size={14} aria-hidden />
            <span>Import</span>
          </button>
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
              <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onSaveDraft(); setMenuOpen(false); }}>
                Save draft
              </button>
              <button type="button" role="menuitem" className="pw-menu-item" onClick={() => { onImport(); setMenuOpen(false); }}>
                Import JSON
              </button>
              {onUploadFloorPlan ? (
                <button
                  type="button"
                  role="menuitem"
                  className="pw-menu-item"
                  onClick={() => {
                    onUploadFloorPlan();
                    setMenuOpen(false);
                  }}
                >
                  Upload sketch or plan
                </button>
              ) : null}
              <Link href="/planner/help/" role="menuitem" className="pw-menu-item" onClick={() => setMenuOpen(false)}>
                Help
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}