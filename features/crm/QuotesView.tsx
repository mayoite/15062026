"use client";

import React, { useState, useMemo } from "react";
import type { Quote } from "./stores/crmStore";
import { useCrmStore } from "./stores/crmStore";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import { cn } from "@/lib/utils";
import { crmQuoteStatusColumns, crmUi } from "./crmUi";
import { 
  FileText, Plus, Search,
  Building2, Users, Clock, Trash2, TrendingUp
} from "lucide-react";

export default function QuotesView() {
  const { quotes, clients, projects, addQuote, updateQuote, deleteQuote } = useCrmStore();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("none");
  const [projectId, setProjectId] = useState("none");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [status, setStatus] = useState<Quote["status"]>("draft");

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c.id, c]));
  }, [clients]);

  const projectMap = useMemo(() => {
    return new Map(projects.map((p) => [p.id, p]));
  }, [projects]);

  const filteredQuotes = useMemo(() => {
    const q = search.toLowerCase();
    return quotes.filter(
      (qt) =>
        qt.title.toLowerCase().includes(q) ||
        (clientMap.get(qt.clientId)?.name ?? "").toLowerCase().includes(q) ||
        (projectMap.get(qt.projectId)?.name ?? "").toLowerCase().includes(q)
    );
  }, [quotes, search, clientMap, projectMap]);

  const quotesByStatus = useMemo(() => {
    const groups: Record<Quote["status"], Quote[]> = {
      draft: [],
      sent: [],
      approved: [],
      rejected: [],
    };
    filteredQuotes.forEach((q) => {
      if (groups[q.status]) {
        groups[q.status].push(q);
      }
    });
    return groups;
  }, [filteredQuotes]);

  const totalValue = useMemo(() => {
    return quotes
      .filter((q) => q.status === "approved")
      .reduce((sum, q) => sum + q.totalAmount, 0);
  }, [quotes]);

  const pipelineValue = useMemo(() => {
    return quotes
      .filter((q) => q.status === "sent")
      .reduce((sum, q) => sum + q.totalAmount, 0);
  }, [quotes]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addQuote({
      title: title.trim(),
      clientId,
      projectId,
      planId: `plan-${Date.now()}`,
      items: [],
      totalAmount: Number(totalAmount),
      status,
    });

    // Reset Form
    setTitle("");
    setClientId("none");
    setProjectId("none");
    setTotalAmount(0);
    setStatus("draft");
    setIsModalOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: Quote["status"]) => {
    updateQuote(id, { status: newStatus });
  };

  return (
    <section className="shell-workspace-page min-h-screen">
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Hero Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.26em]">
              Quotes & Deal Flow
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">
              Deals Pipeline
            </h1>
            <p className="shell-workspace-muted mt-2 text-sm leading-6">
              Track project quote values, approval cycles, and invoice stages.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" /> Create Quote
          </button>
        </div>

        {/* Financial Highlights */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="shell-workspace-card p-5 flex items-center justify-between">
            <div>
              <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Closed Approved</p>
              <p className="mt-2 text-2xl font-bold text-success">
                ₹{totalValue.toLocaleString("en-IN")}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-success opacity-30" />
          </div>
          <div className="shell-workspace-card p-5 flex items-center justify-between">
            <div>
              <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Active In-Flight</p>
              <p className="mt-2 text-2xl font-bold text-warning">
                ₹{pipelineValue.toLocaleString("en-IN")}
              </p>
            </div>
            <Clock className="h-8 w-8 text-warning opacity-30" />
          </div>
          <div className="shell-workspace-card p-5 flex items-center justify-between">
            <div>
              <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Total Quotes</p>
              <p className="mt-2 text-2xl font-bold text-strong">{quotes.length}</p>
            </div>
            <FileText className="h-8 w-8 text-subtle" />
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search deals, clients, or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shell-workspace-auth-input pl-10 text-sm"
          />
        </div>

        {/* Pipeline Columns */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 overflow-x-auto pb-4">
          {crmQuoteStatusColumns.map((col) => {
            const list = quotesByStatus[col.value as Quote["status"]] || [];
            const colTotal = list.reduce((s, q) => s + q.totalAmount, 0);

            return (
              <div
                key={col.value}
                className={cn("flex min-w-[16rem] shrink-0 flex-col rounded-[1.6rem] border", crmUi.softSurface, crmUi.panelBorder)}
              >
                {/* Column Header */}
                <div className={cn("flex items-center justify-between rounded-t-[1.6rem] p-4", col.header)}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-sm font-semibold text-strong">{col.label}</span>
                    <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px]", col.badge)}>
                      {list.length}
                    </span>
                  </div>
                  <span className={cn("text-xs font-semibold", col.valueTone)}>
                    ₹{colTotal.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Column Body */}
                <div className="p-3 space-y-3 flex-1 min-h-[24rem] overflow-y-auto">
                  {list.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-16 text-center text-xs shell-workspace-muted italic">
                      No deals here
                    </div>
                  ) : (
                    list.map((quote) => {
                      const client = clientMap.get(quote.clientId);
                      const project = projectMap.get(quote.projectId);

                      return (
                        <div
                          key={quote.id}
                          className={cn("flex flex-col gap-3 rounded-xl border p-4 transition", crmUi.strongSurface, crmUi.softBorder, crmUi.hoverBorder)}
                        >
                          <div>
                            <h4 className="text-sm font-semibold leading-tight text-strong">
                              {quote.title}
                            </h4>
                            {client && (
                              <p className="text-[11px] shell-workspace-muted flex items-center gap-1.5 mt-1.5">
                                <Users className="h-3 w-3 opacity-60" /> {client.name}
                              </p>
                            )}
                            {project && (
                              <p className="text-[11px] shell-workspace-muted flex items-center gap-1.5 mt-1">
                                <Building2 className="h-3 w-3 opacity-60" /> {project.name}
                              </p>
                            )}
                          </div>

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm font-bold text-strong">
                              ₹{quote.totalAmount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] shell-workspace-muted font-mono">
                              {new Date(quote.updatedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className={cn("mt-1 flex justify-between gap-2 border-t pt-2", crmUi.softBorder)}>
                            {/* Pipeline status select */}
                            <select
                              value={quote.status}
                              onChange={(e) => handleStatusChange(quote.id, e.target.value as Quote["status"])}
                              className="cursor-pointer border-0 bg-transparent text-[10px] font-semibold capitalize text-muted focus:ring-0"
                            >
                              <option value="draft">Move to Draft</option>
                              <option value="sent">Move to Sent</option>
                              <option value="approved">Move to Approved</option>
                              <option value="rejected">Move to Rejected</option>
                            </select>

                            <button
                              onClick={() => deleteQuote(quote.id)}
                              className={cn("rounded p-1", crmUi.ghostDanger)}
                              title="Delete quote"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Quote Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-md flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-2xl font-semibold text-strong">Create Quote Card</h2>
              <p className="shell-workspace-muted text-xs mt-1">
                Configure quote title and deal value.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Quote Title *</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="e.g. Nexus Tech Furnishing Phase 1"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Client Account</span>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                >
                  <option value="none">Select Client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Project Association</span>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                >
                  <option value="none">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Quote Amount (INR)</span>
                <input
                  type="number"
                  value={totalAmount || ""}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="Enter deal value"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Pipeline Stage</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Quote["status"])}
                  className="shell-workspace-auth-input text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
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
                  disabled={!title.trim()}
                  className="btn-primary px-5 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
