"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  SharedClient as Client,
  SharedProject as Project,
  SharedCrmQuoteItem as QuoteItem,
  SharedCrmQuote as Quote
} from "../../shared/crm/types";

export type { Client, Project, QuoteItem, Quote };

interface CrmStore {
  clients: Client[];
  projects: Project[];
  quotes: Quote[];
  
  // Client actions
  addClient: (client: Omit<Client, "id" | "createdAt">) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  // Project actions
  addProject: (project: Omit<Project, "id" | "createdAt" | "updatedAt" | "planIds">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  assignPlanToProject: (projectId: string, planId: string) => void;
  removePlanFromProject: (projectId: string, planId: string) => void;
  
  // Quote actions
  addQuote: (quote: Omit<Quote, "id" | "createdAt" | "updatedAt">) => Quote;
  updateQuote: (id: string, updates: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
}

export const useCrmStore = create<CrmStore>()(
  persist(
    (set) => ({
      clients: [
        {
          id: "client-1",
          name: "Amit Sharma",
          company: "Nexus Tech Solutions",
          email: "amit.sharma@nexustech.co.in",
          phone: "+91 98765 43210",
          address: "Sector 62, Noida, UP",
          notes: "Prefers modern, open-layout workstations. High budget for ergonomic seating.",
          createdAt: new Date().toISOString(),
        },
        {
          id: "client-2",
          name: "Priya Patel",
          company: "Indus Capital Partners",
          email: "p.patel@induscap.com",
          phone: "+91 98112 23344",
          address: "Bandra Kurla Complex, Mumbai",
          notes: "Requires executive desks and acoustic panel partitions for conference rooms.",
          createdAt: new Date().toISOString(),
        }
      ],
      projects: [
        {
          id: "project-1",
          name: "Nexus HQ Floor 4 Layout",
          clientId: "client-1",
          status: "active",
          notes: "Initial space planning for 45 task-desk seats and 2 meeting zones.",
          planIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "project-2",
          name: "Indus Executive Suite",
          clientId: "client-2",
          status: "active",
          notes: "High-end executive office with modular soft seating and glass partitions.",
          planIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],
      quotes: [
        {
          id: "quote-1",
          title: "Nexus Phase 1 Workspace Quote",
          projectId: "project-1",
          clientId: "client-1",
          planId: "nexus-plan-1",
          items: [
            { id: "item-1", name: "Linear Desk 1400", qty: 24, price: 12500, category: "Workstations" },
            { id: "item-2", name: "Task Chair", qty: 24, price: 8500, category: "Seating" },
            { id: "item-3", name: "Meeting Table (6-Seat)", qty: 2, price: 28000, category: "Tables" },
            { id: "item-4", name: "Locker Bank (4-wide)", qty: 4, price: 18500, category: "Storage" }
          ],
          totalAmount: 634000,
          status: "sent",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ],

      addClient: (data) => {
        const client: Client = {
          ...data,
          id: `client-${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ clients: [...state.clients, client] }));
        return client;
      },
      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },
      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
          projects: state.projects.map((p) => (p.clientId === id ? { ...p, clientId: "none" } : p)),
        }));
      },

      addProject: (data) => {
        const project: Project = {
          ...data,
          id: `project-${Date.now()}`,
          planIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ projects: [...state.projects, project] }));
        return project;
      },
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          quotes: state.quotes.filter((q) => q.projectId !== id),
        }));
      },
      assignPlanToProject: (projectId, planId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            if (p.planIds.includes(planId)) return p;
            return {
              ...p,
              planIds: [...p.planIds, planId],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },
      removePlanFromProject: (projectId, planId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            return {
              ...p,
              planIds: p.planIds.filter((id) => id !== planId),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      addQuote: (data) => {
        const quote: Quote = {
          ...data,
          id: `quote-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ quotes: [...state.quotes, quote] }));
        return quote;
      },
      updateQuote: (id, updates) => {
        set((state) => ({
          quotes: state.quotes.map((q) =>
            q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
          ),
        }));
      },
      deleteQuote: (id) => {
        set((state) => ({
          quotes: state.quotes.filter((q) => q.id !== id),
        }));
      },
    }),
    {
      name: "oando-crm-storage",
    }
  )
);
