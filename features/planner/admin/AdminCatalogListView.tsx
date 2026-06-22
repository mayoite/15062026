"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  width_mm?: number;
  depth_mm?: number;
  height_mm?: number;
  visible?: boolean;
  active?: boolean;
};

type CatalogListProps = {
  title: string;
  description: string;
  catalogType: "standard" | "configurator" | "buddy";
};

type CatalogResponse = {
  success?: boolean;
  items?: CatalogItem[];
  catalog_items?: CatalogItem[];
  pagination?: { total: number; page: number; pages: number };
  total?: number;
  source?: string;
};

export function AdminCatalogListView({ title, description, catalogType }: CatalogListProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/catalogs/${catalogType}?limit=50`),
      );
      if (!response.ok) {
        throw new Error(`Failed to load catalog (${response.status})`);
      }
      const payload = (await response.json()) as CatalogResponse;
      const rows = payload.items ?? payload.catalog_items ?? [];
      setItems(rows);
      setTotal(payload.pagination?.total ?? payload.total ?? rows.length);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [catalogType]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Catalog admin</p>
          <h1 className="text-2xl font-semibold text-strong">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
          {source ? <p className="mt-1 text-xs text-soft">Source: {source}</p> : null}
        </div>
        <button
          type="button"
          className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"
          onClick={() => void loadItems()}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading catalog…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-soft bg-panel p-6 text-sm text-muted">No catalog items found.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-soft bg-panel">
          <div className="border-b border-soft px-4 py-3 text-sm text-muted">{total} items</div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-soft bg-subtle text-xs uppercase tracking-wide text-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Size (mm)</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-soft last:border-b-0">
                  <td className="px-4 py-3 font-medium text-strong">{item.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {item.category}
                    {item.subcategory ? ` · ${item.subcategory}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.width_mm ?? "—"} × {item.depth_mm ?? "—"} × {item.height_mm ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.visible === false || item.active === false ? "Hidden" : "Active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
