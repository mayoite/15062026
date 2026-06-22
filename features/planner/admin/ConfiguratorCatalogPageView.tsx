"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function ConfiguratorCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Planner catalog"
      description="Configurator products surfaced in the planner canvas catalog."
      catalogType="configurator"
    />
  );
}
