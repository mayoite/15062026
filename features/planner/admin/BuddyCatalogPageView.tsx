"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function BuddyCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Buddy catalog"
      description="Same configurator API as Planner catalog — parametric product CRUD with all sizing fields."
      catalogType="buddy"
    />
  );
}
