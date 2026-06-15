"use client";

import React, { useState, useMemo } from "react";
import type { Client } from "./stores/crmStore";
import { useCrmStore } from "./stores/crmStore";
import { GlobalNavHeader } from "@/features/shared/shell/GlobalNavHeader";
import { cn } from "@/lib/utils";
import { crmUi } from "./crmUi";
import { 
  Users, Plus, Search, Trash2, Mail, Phone, MapPin, 
  Building2, ArrowRight, X, Clock 
} from "lucide-react";

export default function ClientsView() {
  const { clients, projects, addClient, deleteClient } = useCrmStore();
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const clientProjects = useMemo(() => {
    if (!selectedClient) return [];
    return projects.filter((p) => p.clientId === selectedClient.id);
  }, [projects, selectedClient]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addClient({
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
    });

    // Reset Form & Close
    setName("");
    setCompany("");
    setEmail("");
    setPhone("");
    setAddress("");
    setNotes("");
    setIsModalOpen(false);
  };

  return (
    <section className="shell-workspace-page min-h-screen">
      <GlobalNavHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        {/* Hero Area */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="shell-workspace-eyebrow text-[11px] font-semibold uppercase tracking-[0.26em]">
              CRM & Customer Relations
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">
              Client Directory
            </h1>
            <p className="shell-workspace-muted mt-2 text-sm leading-6">
              Manage client contact cards, project associations, and notes.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" /> New Client
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Total Clients</p>
            <p className="mt-2 text-2xl font-bold text-strong">{clients.length}</p>
          </div>
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Corporate Accounts</p>
            <p className="mt-2 text-2xl font-bold text-strong">
              {clients.filter((c) => c.company).length}
            </p>
          </div>
          <div className="shell-workspace-card p-5">
            <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">Linked Projects</p>
            <p className="mt-2 text-2xl font-bold text-strong">
              {projects.filter((p) => p.clientId !== "none").length}
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="shell-workspace-auth-input pl-10 text-sm"
          />
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1.4fr]">
          {/* Client List */}
          <div className="shell-workspace-panel">
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-strong">
              All Contacts
            </h2>

            {filteredClients.length === 0 ? (
              <div className={cn("rounded-2xl py-16 text-center text-sm shell-workspace-muted", crmUi.emptyState)}>
                <Users className="mx-auto mb-4 h-10 w-10 text-subtle" />
                <p className="font-semibold text-strong">No clients found</p>
                <p className="mt-1">Add a new client to start building your directory.</p>
              </div>
            ) : (
              <div className={cn("space-y-1 divide-y", crmUi.softBorder)}>
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition ${
                      selectedClient?.id === client.id
                        ? `${crmUi.softSurface} border ${crmUi.panelBorder}`
                        : `border border-transparent ${crmUi.hoverSurface}`
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-inverse">
                        {client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-strong">
                          {client.name}
                        </p>
                        {client.company && (
                          <p className="shell-workspace-subtle text-xs flex items-center gap-1.5 mt-0.5">
                            <Building2 className="h-3.5 w-3.5 opacity-60" /> {client.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClient(client.id);
                          if (selectedClient?.id === client.id) setSelectedClient(null);
                        }}
                        className={cn("rounded-lg p-2", crmUi.ghostDanger)}
                        title="Delete client"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <ArrowRight className="h-4 w-4 text-subtle" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Client Detail Side Panel */}
          <div className="shell-workspace-panel flex flex-col justify-between">
            {selectedClient ? (
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-inverse">
                      {selectedClient.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-strong">
                        {selectedClient.name}
                      </h3>
                      {selectedClient.company && (
                        <p className="shell-workspace-muted text-sm mt-0.5">
                          {selectedClient.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className={cn("rounded-lg p-1", crmUi.ghostInverse)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <hr className={crmUi.panelBorder} />

                {/* Contact Information */}
                <div className="space-y-3">
                  <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Contact Details
                  </p>
                  <div className="space-y-2 text-sm">
                    {selectedClient.email && (
                      <div className="flex items-center gap-3 text-body">
                        <Mail className="h-4 w-4 opacity-70 shrink-0" />
                        <a href={`mailto:${selectedClient.email}`} className="hover:underline">
                          {selectedClient.email}
                        </a>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-3 text-body">
                        <Phone className="h-4 w-4 opacity-70 shrink-0" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.address && (
                      <div className="flex items-center gap-3 text-body">
                        <MapPin className="h-4 w-4 opacity-70 shrink-0" />
                        <span>{selectedClient.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div className="space-y-3">
                    <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">
                      Correspondence Notes
                    </p>
                    <div className={cn("rounded-xl border p-4 text-xs leading-relaxed text-body whitespace-pre-wrap", crmUi.softSurface, crmUi.panelBorder)}>
                      {selectedClient.notes}
                    </div>
                  </div>
                )}

                {/* Projects */}
                <div className="space-y-3">
                  <p className="shell-workspace-faint text-[10px] font-semibold uppercase tracking-[0.2em]">
                    Associated Projects ({clientProjects.length})
                  </p>
                  {clientProjects.length === 0 ? (
                    <p className="text-xs shell-workspace-muted italic">
                      No projects linked to this client yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {clientProjects.map((p) => (
                        <div
                          key={p.id}
                          className={cn("flex items-center justify-between rounded-xl border p-3", crmUi.softSurface, crmUi.softBorder)}
                        >
                          <div>
                            <p className="text-xs font-semibold text-strong">{p.name}</p>
                            <p className="text-[10px] shell-workspace-muted mt-1">
                              Status: <span className="capitalize">{p.status.replace("_", " ")}</span>
                            </p>
                          </div>
                          <Clock className="h-3.5 w-3.5 text-subtle" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-16 shell-workspace-muted">
                <Users className="mb-4 h-12 w-12 animate-pulse text-subtle" />
                <p className="text-sm font-medium">Select a contact</p>
                <p className="text-xs mt-1 max-w-[16rem]">
                  Click on any client card to view their full detail sheet, contact info, and linked projects.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={cn("flex w-full max-w-lg flex-col gap-6 p-8", crmUi.modal)}>
            <div>
              <h2 className="text-2xl font-semibold text-strong">Add New Client</h2>
              <p className="shell-workspace-muted text-xs mt-1">
                Enter client details to create a new contact profile.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Name *</span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="Full Name"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Company / Organisation</span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="e.g. Nexus Tech"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="shell-workspace-auth-label">
                  <span className="typ-label shell-workspace-auth-label-text">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="shell-workspace-auth-input text-sm"
                    placeholder="name@company.com"
                  />
                </label>
                <label className="shell-workspace-auth-label">
                  <span className="typ-label shell-workspace-auth-label-text">Phone</span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="shell-workspace-auth-input text-sm"
                    placeholder="+91..."
                  />
                </label>
              </div>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Address</span>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="Office Address"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="shell-workspace-auth-input text-sm py-2"
                  placeholder="Client preferences, project scoping details..."
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
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
