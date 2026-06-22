"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import plannerCanvasConfig from "@/config/planner-canvas.json";
import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import {
  formatCatalogDimensionsLabel,
  formatCatalogSeatFootprint,
  enrichCatalogItem,
} from "@/features/planner/catalog/catalogHierarchy";
import { useState } from "react";

export default function AdminWorkspaceCatalogPageView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const items = useMemo(() => {
    const enriched = PLANNER_CATALOG_ITEMS.map(enrichCatalogItem);
    const q = query.trim().toLowerCase();
    return enriched.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const categories = useMemo(
    () => [...new Set(PLANNER_CATALOG_ITEMS.map((item) => item.category))].sort(),
    [],
  );

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-soft">Static ingest</p>
        <h1 className="text-2xl font-semibold text-strong">Workspace element library</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          Read-only view of <code>workspaceCatalog</code> — the catalog shown in the planner left library today.
          Regenerate from source CSV via{" "}
          <code className="rounded bg-subtle px-1">npx tsx scripts/ingest-planner-catalog.ts</code>.
          Managed products in Supabase merge separately via <Link href="/admin/catalog" className="text-primary hover:underline">Standard catalog</Link>.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-soft bg-panel p-4">
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-muted">Search</span>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-soft bg-panel py-2 pl-9 pr-3 text-sm"
              placeholder="SKU, name, id…"
            />
          </div>
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-soft bg-panel px-3 py-2 text-sm"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-3 text-sm text-muted">{items.length} items</p>

      <div className="overflow-hidden rounded-xl border border-soft bg-panel">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-soft bg-subtle/50 text-xs uppercase tracking-wide text-soft">
            <tr>
              <th className="px-4 py-3">SKU / ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Seats</th>
              <th className="px-4 py-3">Footprint</th>
              <th className="px-4 py-3">Raw fields</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-soft last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs text-muted">{item.sku ?? item.id}</td>
                <td className="px-4 py-3 font-medium text-strong">{item.shortName ?? item.name}</td>
                <td className="px-4 py-3 text-muted">{item.category}</td>
                <td className="px-4 py-3 text-muted">{item.seatCount ?? "—"}</td>
                <td className="px-4 py-3 text-muted">
                  <p>{formatCatalogSeatFootprint(item)}</p>
                  <p className="text-xs text-soft">{formatCatalogDimensionsLabel(item)}</p>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-soft">
                  w:{item.widthMm} d:{item.heightMm} h:{item.depthMm}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCanvasConfigSection() {
  const config = plannerCanvasConfig;
  const rows: Array<{ group: string; key: string; value: string }> = [];

  for (const [group, values] of Object.entries(config)) {
    if (values && typeof values === "object") {
      for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
        rows.push({ group, key, value: String(value) });
      }
    }
  }

  return (
    <section className="rounded-xl border border-soft bg-panel">
      <header className="border-b border-soft px-4 py-3">
        <h2 className="text-sm font-semibold text-strong">Canvas configuration</h2>
        <p className="mt-1 text-xs text-muted">
          From <code>config/planner-canvas.json</code> — edit in repo and redeploy to change bounds, scale, and viewport.
        </p>
      </header>
      <table className="w-full text-sm">
        <thead className="border-b border-soft text-xs uppercase text-soft">
          <tr>
            <th className="px-4 py-2 text-left">Group</th>
            <th className="px-4 py-2 text-left">Parameter</th>
            <th className="px-4 py-2 text-left">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.group}.${row.key}`} className="border-b border-soft last:border-b-0">
              <td className="px-4 py-2 text-muted">{row.group}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
              <td className="px-4 py-2 font-medium text-strong">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
