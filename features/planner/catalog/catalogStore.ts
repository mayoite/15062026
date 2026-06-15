import { create } from "zustand";

import type { PlannerPrimaryPurpose } from "@/features/planner/onboarding/projectSetup";
import { filterCatalogItemsByPurpose } from "@/features/planner/onboarding/projectSetup";

import {
  enrichCatalogItem,
  enrichCatalogItems,
  itemMatchesCatalogSearch,
} from "./catalogHierarchy";
import type { CatalogCategory, CatalogItem } from "./catalogTypes";
import { PLANNER_CATALOG_ITEMS } from "./workspaceCatalog";

const RECENT_STORAGE_KEY = "planner-catalog-recent";
const RECENT_LIMIT = 5;

function readRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string").slice(0, RECENT_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function writeRecentIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(ids.slice(0, RECENT_LIMIT)));
  } catch {
    /* ignore */
  }
}

interface PlannerCatalogState {
  items: CatalogItem[];
  query: string;
  purposeFilter: PlannerPrimaryPurpose | null;
  recentIds: string[];
  setQuery: (query: string) => void;
  setPurposeFilter: (purpose: PlannerPrimaryPurpose | null) => void;
  recordRecentPlacement: (itemId: string) => void;
  getFilteredItems: () => CatalogItem[];
  getByCategory: (category: CatalogCategory) => CatalogItem[];
  getRecentItems: () => CatalogItem[];
}

function applyCatalogFilters(items: CatalogItem[], query: string, purpose: PlannerPrimaryPurpose | null) {
  const enriched = enrichCatalogItems(items);
  const purposeScoped = purpose ? filterCatalogItemsByPurpose(enriched, purpose) : enriched;
  return purposeScoped.filter((item) => itemMatchesCatalogSearch(item, query));
}

export const usePlannerCatalogStore = create<PlannerCatalogState>((set, get) => ({
  items: enrichCatalogItems(PLANNER_CATALOG_ITEMS),
  query: "",
  purposeFilter: null,
  recentIds: readRecentIds(),
  setQuery: (query) => set({ query }),
  setPurposeFilter: (purpose) => set({ purposeFilter: purpose }),
  recordRecentPlacement: (itemId) =>
    set((state) => {
      const recentIds = [itemId, ...state.recentIds.filter((id) => id !== itemId)].slice(0, RECENT_LIMIT);
      writeRecentIds(recentIds);
      return { recentIds };
    }),
  getFilteredItems: () => applyCatalogFilters(get().items, get().query, get().purposeFilter),
  getByCategory: (category) => {
    const purpose = get().purposeFilter;
    const scoped = applyCatalogFilters(get().items, "", purpose);
    return scoped.filter((item) => item.category === category);
  },
  getRecentItems: () => {
    const byId = new Map(get().items.map((item) => [item.id, enrichCatalogItem(item)]));
    return get()
      .recentIds.map((id) => byId.get(id))
      .filter((item): item is CatalogItem => Boolean(item));
  },
}));