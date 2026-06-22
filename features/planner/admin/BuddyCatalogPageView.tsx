"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function BuddyCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Buddy catalog"
      description="Buddy alias of the configurator catalog (same API source)."
      catalogType="buddy"
    />
  );
}
