import { useState, useEffect } from "react";
import { readPlannerWorkspacePreferences, writePlannerWorkspacePreferences } from "./plannerWorkspacePreferences";
import { usePlannerCatalogStore } from "../catalog/catalogStore";

export function usePlannerViewMode() {
  const [viewMode, setViewMode] = useState<"2d" | "3d" | "split">("2d");
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      const saved = readPlannerWorkspacePreferences();
      setViewMode(saved.viewMode);
      usePlannerCatalogStore.getState().setQuery(saved.catalogQuery);
      setPreferencesHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!preferencesHydrated) return;
    writePlannerWorkspacePreferences({ viewMode });
  }, [preferencesHydrated, viewMode]);

  useEffect(() => usePlannerCatalogStore.subscribe((state) => {
    writePlannerWorkspacePreferences({ catalogQuery: state.query });
  }), []);

  return { viewMode, setViewMode };
}
