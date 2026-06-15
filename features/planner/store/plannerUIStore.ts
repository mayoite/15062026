import { create } from "zustand";
import type { ViewMode, LightingPreset } from "./plannerTypes";

interface UIState {
  zoom: number;
  panOffset: { x: number; y: number };
  sidebarCollapsed: boolean;
  viewMode: ViewMode;
  show3D: boolean;
  showGrid: boolean;
  backgroundImage: {
    url: string;
    width: number;
    height: number;
    scale: number;
    opacity: number;
    x: number;
    y: number;
    isCalibrating: boolean;
    isLocked: boolean;
  } | null;
  lightingPreset: LightingPreset;
  tags: string[];

  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setBackgroundImage: (bg: UIState["backgroundImage"]) => void;
  updateBackgroundImage: (updates: Partial<NonNullable<UIState["backgroundImage"]>>) => void;
  setLightingPreset: (preset: LightingPreset) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => { success: boolean; error?: string };
  removeTag: (tag: string) => void;
  setShowGrid: (show: boolean) => void;
  toggleGrid: () => void;
}

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

function sanitizeTags(tags: string[]): string[] {
  return tags.map((t) => t.trim()).filter((t) => t.length > 0);
}

function validateTagAddition(tags: string[], tag: string): { success: boolean; error?: string } {
  const trimmed = tag.trim();
  if (!trimmed) return { success: false, error: "Tag cannot be empty" };
  if (trimmed.length > MAX_TAG_LENGTH) return { success: false, error: `Tag too long (max ${MAX_TAG_LENGTH} chars)` };
  if (tags.length >= MAX_TAGS) return { success: false, error: `Maximum ${MAX_TAGS} tags allowed` };
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return { success: false, error: "Tag already exists" };
  return { success: true };
}

export const usePlannerUIStore = create<UIState>((set, get) => ({
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  sidebarCollapsed: false,
  viewMode: "2d",
  show3D: false,
  showGrid: true,
  backgroundImage: null,
  lightingPreset: "day",
  tags: [],

  setZoom: (zoom) => set({ zoom }),
  setPanOffset: (panOffset) => set({ panOffset }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setViewMode: (viewMode) => set({ viewMode, show3D: viewMode === "3d" || viewMode === "split" }),
  setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
  updateBackgroundImage: (updates) => set((s) => ({
    backgroundImage: s.backgroundImage ? { ...s.backgroundImage, ...updates } : null
  })),
  setLightingPreset: (lightingPreset) => set({ lightingPreset }),
  setTags: (tags) => set({ tags: sanitizeTags(tags) }),
  addTag: (tag) => {
    const s = get();
    const validation = validateTagAddition(s.tags, tag);
    if (!validation.success) return validation;
    set({ tags: [...s.tags, tag.trim()] });
    return { success: true };
  },
  removeTag: (tag) => {
    const s = get();
    set({ tags: s.tags.filter((t) => t.toLowerCase() !== tag.toLowerCase()) });
  },
  setShowGrid: (show) => set({ showGrid: show }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
}));
