"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function AdminCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Standard catalog"
      description="Create and edit planner-managed products (dimensions, mesh type, visibility). Stored in Supabase planner_managed_products when configured."
      catalogType="standard"
    />
  );
}
