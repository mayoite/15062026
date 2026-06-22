"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function AdminCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Standard catalog"
      description="Planner managed products used by the canvas catalog sidebar."
      catalogType="standard"
    />
  );
}
