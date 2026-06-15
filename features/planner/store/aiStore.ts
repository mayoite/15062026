import { create } from "zustand";
import type { StylePreset, AIFurniturePlacement, AISpaceWarning } from "@/features/planner/lib/aiService";
import { furnitureCatalog } from "./catalogData";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  warnings?: AISpaceWarning[];
  placements?: AIFurniturePlacement[];
  isLoading?: boolean;
  isError?: boolean;
}

export interface GhostItem {
  id: string;
  catalogId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  shape: string;
}

interface AIStore {
  isOpen: boolean;
  style: StylePreset;
  messages: ChatMessage[];
  ghostItems: GhostItem[];
  isLoading: boolean;

  setOpen: (open: boolean) => void;
  setStyle: (style: StylePreset) => void;

  addMessage: (msg: Omit<ChatMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  setGhostItems: (items: GhostItem[]) => void;
  removeGhostItem: (id: string) => void;
  clearGhostItems: () => void;
  setLoading: (loading: boolean) => void;
}

let msgCounter = 0;

export const useAIStore = create<AIStore>((set) => ({
  isOpen: true,
  style: "Modern",
  messages: [],
  ghostItems: [],
  isLoading: false,

  setOpen: (open) => set({ isOpen: open }),
  setStyle: (style) => set({ style }),

  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${++msgCounter}`;
    const newMsg: ChatMessage = { ...msg, id, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, newMsg] }));
    return id;
  },

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  clearMessages: () => set({ messages: [] }),

  setGhostItems: (items) => {
    const enriched = items.map((item) => {
      const cat = furnitureCatalog.find((c) => c.id === item.catalogId);
      return {
        ...item,
        color: item.color || "var(--surface-panel)",
        shape: item.shape || cat?.shape || "sofa",
        width: item.width || (cat ? Math.round(cat.widthMm / 10) : 50),
        height: item.height || (cat ? Math.round(cat.depthMm / 10) : 50),
      };
    });
    set({ ghostItems: enriched });
  },

  removeGhostItem: (id) =>
    set((s) => ({ ghostItems: s.ghostItems.filter((g) => g.id !== id) })),

  clearGhostItems: () => set({ ghostItems: [] }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
