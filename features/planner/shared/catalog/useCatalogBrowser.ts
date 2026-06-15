"use client";

/**
 * useCatalogBrowser — Phase 06
 *
 * React hook providing runtime catalog browsing with async loading,
 * category filtering, and text search. Works with both planners.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import type { CatalogItem } from "./types";
import { loadPlannerCatalog } from "./catalogAdapter";
import { filterCatalog, type CatalogFilter } from "./catalogBridge";

export type CatalogBrowserState = {
  items: CatalogItem[];
  filtered: CatalogItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  filter: CatalogFilter;
  setQuery: (query: string) => void;
  setCategory: (category: string) => void;
  refresh: () => void;
};

/**
 * Hook to load and browse the shared planner catalog at runtime.
 * Provides filtering, search, and category enumeration.
 */
export function useCatalogBrowser(): CatalogBrowserState {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CatalogFilter>({});

  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const catalog = await loadPlannerCatalog();
      setItems(catalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPlannerCatalog()
      .then((catalog) => {
        if (!cancelled) {
          setItems(catalog);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load catalog");
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category));
    return ["all", ...Array.from(cats).sort()];
  }, [items]);

  const filtered = useMemo(() => filterCatalog(items, filter), [items, filter]);

  const setQuery = useCallback((query: string) => {
    setFilter((prev) => ({ ...prev, query }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setFilter((prev) => ({ ...prev, category }));
  }, []);

  return {
    items,
    filtered,
    categories,
    isLoading,
    error,
    filter,
    setQuery,
    setCategory,
    refresh: loadCatalog,
  };
}
