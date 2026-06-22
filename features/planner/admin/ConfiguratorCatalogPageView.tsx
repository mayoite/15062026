"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function ConfiguratorCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Planner catalog"
      description="Full CRUD for parametric, discrete, and fixed configurator products (workstation JSON, footprints, materials)."
      catalogType="configurator"
    />
  );
}
