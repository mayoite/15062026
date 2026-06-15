"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { Project } from "./stores/crmStore";
import { useCrmStore } from "./stores/crmStore";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import { cn } from "@/lib/utils";
import { crmProjectStatus, crmUi } from "./crmUi";
import { 
  FolderOpen, Plus, FileText, Trash2, ArrowRight,
  Building2, Users, CalendarDays
} from "lucide-react";

export default function ProjectsView() {
  const { projects, clients, addProject, deleteProject } = useCrmStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("none");
  const [status, setStatus] = useState<Project["status"]>("active");
  const [notes, setNotes] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProject({
      name: name.trim(),
      clientId,
      status,
      notes: notes.trim(),
    });

    // Reset Form & Close
    setName("");
    setClientId("none");
    setStatus("active");
    setNotes("");
    setIsModalOpen(false);
  };

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const groupedProjects = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    projects.forEach((p) => {
      const clientName = clientMap.get(p.clientId)?.name ?? "Unassigned Clients";
      if (!groups[clientName]) groups[clientName] = [];
      groups[clientName].push(p);
    });
    return groups;
  }, [projects, clientMap]);

  return (
    <section className="shell-workspace-page min-h-screen">
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Hero Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.26em]">
              Project Management
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">
              Projects Tracker
            </h1>
            <p className="shell-workspace-muted mt-2 text-sm leading-6">
              Track active floor plans, layouts, and reviews grouped by customer accounts.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Total Projects</p>
            <p className="mt-2 text-2xl font-bold text-strong">{projects.length}</p>
          </div>
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Active Projects</p>
            <p className="mt-2 text-2xl font-bold text-success">
              {projects.filter((p) => p.status === "active").length}
            </p>
          </div>
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">On Hold</p>
            <p className="mt-2 text-2xl font-bold text-warning">
              {projects.filter((p) => p.status === "on_hold").length}
            </p>
          </div>
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Completed</p>
            <p className="mt-2 text-2xl font-bold text-primary">
              {projects.filter((p) => p.status === "completed").length}
            </p>
          </div>
        </div>

        {/* Project Grouping List */}
        {projects.length === 0 ? (
          <div className={cn("shell-workspace-panel py-20 text-center rounded-[2rem]", crmUi.emptyState)}>
            <FolderOpen className="mx-auto mb-4 h-16 w-16 text-subtle" />
            <h2 className="text-xl font-semibold text-strong">No projects yet</h2>
            <p className="shell-workspace-muted text-sm mt-2 max-w-md mx-auto">
              Create your first project to organize your space planner designs, link them to clients, and build quotes.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary mt-6 rounded-full px-6 py-2.5 text-xs font-semibold"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedProjects).map(([clientName, clientProjs]) => (
              <div key={clientName} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", crmUi.iconChip)}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-strong">{clientName}</h2>
                    <p className="text-xs shell-workspace-muted">
                      {clientProjs.length} project{clientProjs.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {clientProjs.map((project) => {
                    const sc = crmProjectStatus[project.status] || crmProjectStatus.active;
                    const client = clientMap.get(project.clientId);
                    return (
                      <div
                        key={project.id}
                        className={cn("shell-workspace-card group flex flex-col justify-between transition-all", crmUi.hoverBorder)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="truncate text-base font-semibold text-strong transition group-hover:text-primary">
                              {project.name}
                            </h3>
                            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", sc.badge)}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          </div>

                          {client && (
                            <p className="text-xs shell-workspace-muted flex items-center gap-1.5 mt-2">
                              <Users className="h-3.5 w-3.5 opacity-60" /> {client.name}
                            </p>
                          )}
                          
                          {project.notes && (
                            <p className="text-xs shell-workspace-muted mt-3 line-clamp-2 leading-relaxed">
                              {project.notes}
                            </p>
                          )}
                        </div>

                        <div className={cn("flex items-center justify-between border-t px-6 py-4 text-xs shell-workspace-muted", crmUi.softBorder)}>
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-4 w-4 opacity-70" />
                            <span>{project.planIds.length} floor plan{project.planIds.length !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 opacity-70" />
                            <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className={cn("flex gap-2 border-t px-6 py-3", crmUi.softSurface, crmUi.softBorder)}>
                          <Link
                            href={`/crm/projects/${project.id}`}
                            className={cn("btn-secondary flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-center text-xs font-semibold", crmUi.hoverSurface)}
                          >
                            Open Details <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className={cn("rounded-lg p-2", crmUi.ghostDanger)}
                            title="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Project Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-2xl font-semibold text-strong">Create New Project</h2>
              <p className="shell-workspace-muted text-xs mt-1">
                Configure a tracking project to bundle floor plans and configurations.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Project Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="e.g. Nexus Office Level 4"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Client Association</span>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                >
                  <option value="none">No Client Assignment</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Initial Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Project["status"])}
                  className="shell-workspace-auth-input text-sm"
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Notes / Brief</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="shell-workspace-auth-input text-sm py-2"
                  placeholder="Design specs, seat requirements..."
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-outline px-5 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
