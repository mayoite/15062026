"use client";
import { useState, useEffect } from "react";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";

type Tab = "overview" | "notes" | "miro" | "swiftask";

const NOTES_KEY = "planner_project_notes";

export function IntegrationsPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");

  const TAB_LABELS: { id: Tab; label: string }[] = [
    { id: "overview",  label: "Overview"  },
    { id: "notes",     label: "Notes"     },
    { id: "miro",      label: "Miro"      },
    { id: "swiftask",  label: "Swiftask"  },
  ];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[380px] bg-[var(--surface-inverse)] border-l border-white/10 flex flex-col z-30">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <h2 className="text-white font-semibold text-sm">Integrations</h2>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          aria-label="Close integrations panel"
        >
          &times;
        </button>
      </div>

      <div className="flex border-b border-white/10 px-2 gap-1 shrink-0">
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-[11px] font-medium transition-colors ${
              tab === id
                ? "text-[var(--color-ocean-boat-blue-500)] border-b-2 border-[var(--color-ocean-boat-blue-500)]"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "overview"  && <OverviewTab onSwitch={setTab} />}
        {tab === "notes"     && <NotesTab />}
        {tab === "miro"      && <ComingSoonTab name="Miro" icon="🎨" description="Export floor plans directly to a Miro board for team collaboration and visual review." />}
        {tab === "swiftask"  && <ComingSoonTab name="Swiftask" icon="⚡" description="Generate AI-powered task checklists from your floor plan and sync them to Swiftask." />}
      </div>
    </div>
  );
}

/* ── Overview ─────────────────────────────────────────────────────────────── */

function ServiceCard({
  name,
  icon,
  description,
  status,
  onClick,
}: {
  name: string;
  icon: string;
  description: string;
  status: "active" | "coming soon";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">{name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {status === "active" ? "Ready" : "Coming soon"}
            </span>
          </div>
          <p className="text-white/40 text-[11px] mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
    </button>
  );
}

function OverviewTab({ onSwitch }: { onSwitch: (t: Tab) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-white/50 text-xs mb-4">
        Connect your tools to extend the planner with notes, collaboration, and task management.
      </p>

      <ServiceCard
        name="Project Notes"
        icon="📝"
        description="Write and save notes directly inside your project"
        status="active"
        onClick={() => onSwitch("notes")}
      />

      <ServiceCard
        name="Miro"
        icon="🎨"
        description="Export floor plans to Miro boards for team review"
        status="coming soon"
        onClick={() => onSwitch("miro")}
      />

      <ServiceCard
        name="Swiftask AI"
        icon="⚡"
        description="Generate task checklists from your floor plan"
        status="coming soon"
        onClick={() => onSwitch("swiftask")}
      />
    </div>
  );
}

/* ── Project Notes ────────────────────────────────────────────────────────── */

function NotesTab() {
  const projectKey = usePlannerStore((s) => s.currentProjectKey);
  const projectName = usePlannerStore((s) => s.projectName);
  const storageKey = `${NOTES_KEY}_${projectKey || "default"}`;

  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Load notes for this project on mount / project change
  useEffect(() => {
    try {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes(localStorage.getItem(storageKey) || "");
    } catch {
      setNotes("");
    }
    setSaved(false);
  }, [storageKey]);

  const handleSave = () => {
    try {
      localStorage.setItem(storageKey, notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
// eslint-disable-next-line no-empty
    } catch {}
  };

  const handleClear = () => {
    if (confirm("Clear all notes for this project?")) {
      setNotes("");
// eslint-disable-next-line no-empty
      try { localStorage.removeItem(storageKey); } catch {}
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white text-sm font-medium">Project Notes</h3>
          <p className="text-white/30 text-[10px] mt-0.5 truncate max-w-[220px]">{projectName}</p>
        </div>
        <div className="flex items-center gap-1">
          {notes && (
            <button
              onClick={handleClear}
              className="px-2 py-1 text-[11px] rounded text-white/30 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSave}
            className={`px-3 py-1 text-[11px] rounded-lg font-medium transition-all ${
              saved
                ? "bg-emerald-600 text-white"
                : "bg-[var(--color-ocean-boat-blue-500)] text-white hover:bg-[var(--color-ocean-boat-blue-600)]"
            }`}
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        placeholder={`Notes for ${projectName}…\n\nE.g. client requirements, dimensions, constraints, material preferences.`}
        className="flex-1 min-h-[320px] w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-white/80 text-[12px] placeholder:text-white/20 focus:outline-none focus:border-[var(--color-ocean-boat-blue-500)]/50 resize-none leading-relaxed"
      />

      <p className="text-white/20 text-[10px]">
        Notes are saved per project in your browser.
      </p>
    </div>
  );
}

/* ── Coming Soon placeholder ─────────────────────────────────────────────── */

function ComingSoonTab({ name, icon, description }: { name: string; icon: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-sm">{name}</h3>
        <p className="text-white/40 text-[12px] mt-1.5 max-w-[260px] leading-relaxed">{description}</p>
      </div>
      <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-white/5 text-white/30 border border-white/10">
        Coming soon
      </span>
    </div>
  );
}
