"use client";

import { useCallback, useEffect } from "react";
import { usePlannerCatalogStore } from "./catalogStore";

export function usePlannerCatalogHydration({ enabled = true }: { enabled?: boolean } = {}) {
  const hydrateCatalog = usePlannerCatalogStore((s) => s.hydrateCatalog);
  const catalogSource = usePlannerCatalogStore((s) => s.catalogSource);
  const managedCount = usePlannerCatalogStore((s) => s.managedCount);
  const catalogHydrating = usePlannerCatalogStore((s) => s.catalogHydrating);

  const refreshCatalog = useCallback(async () => {
    await hydrateCatalog();
  }, [hydrateCatalog]);

  useEffect(() => {
    if (!enabled) return;
    void hydrateCatalog();
  }, [enabled, hydrateCatalog]);

  return { catalogSource, managedCount, catalogHydrating, refreshCatalog };
}
