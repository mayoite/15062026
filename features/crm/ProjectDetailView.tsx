"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCrmStore } from "./stores/crmStore";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import { cn } from "@/lib/utils";
import { crmUi } from "./crmUi";
import { getSavedPlans } from "@/features/planner/lib/projectIndex";
import type { PlannerSaveSummary } from "@/features/planner/store/plannerSaves";
import {
  ArrowLeft, ArrowRight, Mail, Phone, Clock, FileText,
  Box, AlertCircle, Plus, X
} from "lucide-react";

interface ProjectDetailViewProps {
  projectId: string;
}

export default function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const router = useRouter();
  const { projects, clients, assignPlanToProject, removePlanFromProject } = useCrmStore();
  const [onlinePlans, setOnlinePlans] = useState<PlannerSaveSummary[]>([]);
  const [, setIsLoadingOnline] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");

  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  const client = useMemo(() => {
    if (!project) return null;
    return clients.find((c) => c.id === project.clientId);
  }, [clients, project]);

  // Fetch online plans via the server API (keeps DB driver off the client bundle)
  useEffect(() => {
    let cancelled = false;
    async function fetchOnlinePlans() {
      setIsLoadingOnline(true);
      try {
        const res = await fetch("/api/plans", { credentials: "include" });
        if (!res.ok) {
          if (res.status !== 401) {
            console.error("Failed to fetch online plans:", res.statusText);
          }
          return;
        }
        const body = (await res.json()) as { documents?: PlannerSaveSummary[] };
        if (!cancelled && Array.isArray(body.documents)) {
          setOnlinePlans(body.documents);
        }
      } catch (err) {
        console.error("Failed to fetch online plans:", err);
      } finally {
        if (!cancelled) setIsLoadingOnline(false);
      }
    }
    fetchOnlinePlans();
    return () => {
      cancelled = true;
    };
  }, []);


  // Get local plans
  const localPlans = useMemo(() => {
    return getSavedPlans();
  }, []);

  // Combine all available plans in the system
  const allSystemPlans = useMemo(() => {
    const combined: Array<{ id: string; name: string; type: "local" | "online"; itemsCount: number; updatedAt: string }> = [];
    
    // Add local plans
    localPlans.forEach((p) => {
      combined.push({
        id: p.id,
        name: p.name,
        type: "local",
        itemsCount: p.furniture.length,
        updatedAt: p.savedAt || new Date().toISOString(),
      });
    });

    // Add online plans
    onlinePlans.forEach((p) => {
      // Avoid duplication if the ID is already there
      if (!combined.some((c) => c.id === p.id)) {
        combined.push({
          id: p.id,
          name: p.name,
          type: "online",
          itemsCount: p.item_count,
          updatedAt: p.updated_at,
        });
      }
    });

    return combined;
  }, [localPlans, onlinePlans]);

  // Filter plans assigned to this project
  const assignedPlans = useMemo(() => {
    if (!project) return [];
    return allSystemPlans.filter((p) => project.planIds.includes(p.id));
  }, [allSystemPlans, project]);

  // Filter plans not assigned to this project
  const unassignedPlans = useMemo(() => {
    if (!project) return [];
    return allSystemPlans.filter((p) => !project.planIds.includes(p.id));
  }, [allSystemPlans, project]);

  if (!project) {
    return (
      <section className="shell-workspace-page min-h-screen">
        <GlobalNavHeader />
        <div className="mx-auto max-w-md space-y-4 py-20 text-center text-inverse">
          <AlertCircle className="mx-auto h-12 w-12 text-danger" />
          <h2 className="text-xl font-semibold">Project not found</h2>
          <p className="shell-workspace-muted text-sm">The project you are looking for does not exist or has been deleted.</p>
          <Link href="/crm/projects" className="btn-primary inline-block rounded-full px-6 py-2">
            Back to Projects
          </Link>
        </div>
      </section>
    );
  }

  const handleLinkPlan = (planId: string) => {
    assignPlanToProject(project.id, planId);
    setIsLinkModalOpen(false);
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    // Create a new local plan entry in localStorage
    const newId = `plan-${Date.now()}`;
    const newKey = `planner_${newId}`;
    const now = new Date().toISOString();

    const emptyPayload = {
      projectName: newPlanTitle.trim(),
      savedAt: now,
      thumbnail: null,
      clientName: client?.name ?? "",
      description: project.name,
      walls: [],
      rooms: [],
      furniture: [],
      doors: [],
      windows: [],
      measurements: [],
      zones: [],
      textLabels: [],
      structuralElements: [],
    };

    localStorage.setItem(newKey, JSON.stringify(emptyPayload));
    
    // Add to project index
    const index = JSON.parse(localStorage.getItem("planner_project_index") || "[]");
    index.push({ id: newId, key: nextKey(newId), name: newPlanTitle.trim() });
    localStorage.setItem("planner_project_index", JSON.stringify(index));

    // Link it to the project
    assignPlanToProject(project.id, newId);

    // Reset and redirect
    setNewPlanTitle("");
    setIsCreateModalOpen(false);
    router.push(`/planner/canvas?id=${newId}`);
  };

  function nextKey(id: string) {
    return `planner_${id}`;
  }

  return (
    <section className="shell-workspace-page min-h-screen">
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Back Link */}
        <div className="flex items-center gap-3">
          <Link
            href="/crm/projects"
            className={cn("rounded-xl p-2", crmUi.softSurface, crmUi.ghostInverse)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="shell-workspace-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em]">Project Detail</p>
            <h1 className="text-2xl font-semibold text-strong">{project.name}</h1>
          </div>
        </div>

        {/* Project Layout Split */}
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Client Info Card */}
            {client ? (
              <div className="shell-workspace-panel space-y-4">
                <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Client Account</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-inverse">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-strong">{client.name}</h4>
                    {client.company && <p className="text-xs shell-workspace-muted">{client.company}</p>}
                  </div>
                </div>
                <hr className={crmUi.panelBorder} />
                <div className="space-y-2 text-xs text-inverse-body">
                  {client.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 opacity-60" /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 opacity-60" /> {client.phone}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="shell-workspace-panel text-center py-6 shell-workspace-muted text-xs italic">
                No client associated with this project.
              </div>
            )}

            {/* Notes Card */}
            <div className="shell-workspace-panel space-y-3">
              <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Project Brief</p>
              {project.notes ? (
                <p className="text-xs leading-relaxed text-inverse-body whitespace-pre-wrap">{project.notes}</p>
              ) : (
                <p className="text-xs shell-workspace-muted italic">No briefs or project notes recorded.</p>
              )}
            </div>

            {/* Meta Info */}
            <div className="shell-workspace-panel space-y-3 text-xs text-inverse-muted">
              <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Timestamps</p>
              <p className="flex justify-between">
                <span>Created</span>
                <span className="font-mono text-inverse">{new Date(project.createdAt).toLocaleDateString()}</span>
              </p>
              <p className="flex justify-between">
                <span>Updated</span>
                <span className="font-mono text-inverse">{new Date(project.updatedAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Main Space Plans */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-strong">Floor Plans & Designs</h3>
                <p className="text-xs shell-workspace-muted">
                  {assignedPlans.length} plan{assignedPlans.length !== 1 ? "s" : ""} grouped in this project
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="btn-outline-light px-4 py-2 text-xs font-semibold rounded-lg"
                >
                  Link Plan
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn-primary px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Create Plan
                </button>
              </div>
            </div>

            {assignedPlans.length === 0 ? (
              <div className={cn("shell-workspace-panel rounded-[2rem] py-20 text-center text-sm shell-workspace-muted", crmUi.emptyState)}>
                <FileText className="mx-auto mb-4 h-12 w-12 text-subtle" />
                <p className="font-semibold text-strong">No plans linked yet</p>
                <p className="mt-1">Link an existing floor plan or create a new one for this project.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {assignedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={cn("shell-workspace-card group flex flex-col justify-between", crmUi.panelBorder)}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="max-w-[12rem] truncate font-semibold text-inverse">{plan.name}</h4>
                          <span className={cn("mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-inverse-muted", crmUi.softSurface)}>
                            {plan.type}
                          </span>
                        </div>
                        <button
                          onClick={() => removePlanFromProject(project.id, plan.id)}
                          className={cn("rounded-lg p-1.5", crmUi.ghostDanger)}
                          title="Unlink plan"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <hr className={cn("my-3", crmUi.softBorder)} />

                      <div className="flex justify-between items-center text-xs shell-workspace-muted mt-2">
                        <span className="flex items-center gap-1.5">
                          <Box className="h-3.5 w-3.5 opacity-60" /> {plan.itemsCount} items
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 opacity-60" /> {new Date(plan.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className={cn("border-t p-3", crmUi.softSurface, crmUi.softBorder)}>
                      <Link
                        href={`/planner/canvas?id=${plan.id}`}
                        className="btn-primary block text-center py-2 text-xs font-semibold rounded-lg"
                      >
                        Open in Canvas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Link Existing Plan Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-xl font-semibold text-inverse">Link Floor Plan</h2>
              <p className="shell-workspace-muted text-xs mt-1">
                Select an existing workspace plan to assign to this project.
              </p>
            </div>

            {unassignedPlans.length === 0 ? (
              <div className="text-center py-8 text-sm shell-workspace-muted">
                No unassigned plans found in the system.
                <button
                  onClick={() => {
                    setIsLinkModalOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="block mt-4 mx-auto text-xs font-semibold text-[color:var(--color-primary)] hover:underline"
                >
                  Create a new plan instead
                </button>
              </div>
            ) : (
              <div className={cn("max-h-60 space-y-1 overflow-y-auto divide-y", crmUi.softBorder)}>
                {unassignedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handleLinkPlan(plan.id)}
                    className={cn("flex cursor-pointer items-center justify-between rounded-lg p-3 transition", crmUi.hoverSurface)}
                  >
                    <div>
                      <p className="text-sm font-semibold text-inverse">{plan.name}</p>
                      <p className="text-[10px] shell-workspace-muted capitalize mt-0.5">
                        {plan.type} · {plan.itemsCount} items
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-inverse-subtle" />
                  </div>
                ))}
              </div>
            )}

            <div className={cn("flex items-center justify-end border-t pt-2", crmUi.softBorder)}>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="btn-outline-light px-5 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Plan Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-xl font-semibold text-inverse">Create New Floor Plan</h2>
              <p className="shell-workspace-muted text-xs mt-1">
                Set up a blank floor plan linked to this project.
              </p>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Plan Title *</span>
                <input
                  type="text"
                  required
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="e.g. Executive Cabin Blueprint"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-outline-light px-5 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPlanTitle.trim()}
                  className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
