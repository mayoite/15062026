"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image"; // PERF-FIX: use next/image for optimized loading
import { Search, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { CatalogItem } from "@/features/planner/shared/catalog/types";
import type { MeshFamily } from "@/features/planner/shared/mesh-contract";
import { usePlannerR3FStore } from "../usePlannerR3FStore";

type CategoryGroup = {
  category: string;
  items: CatalogItem[];
};

function groupByCategory(items: CatalogItem[]): CategoryGroup[] {
  const map = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const cat = item.category || "uncategorized";
    if (!map.has(cat)) map.set(cat, []);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }));
}

function groupBySeries(items: CatalogItem[]): Map<string, CatalogItem[]> {
  const map = new Map<string, CatalogItem[]>();
  for (const item of items) {
    const series = item.series || "_none";
    if (!map.has(series)) map.set(series, []);
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    map.get(series)!.push(item);
  }
  return map;
}

function ColorDot({ color }: { color?: string }) {
  if (!color) return null;
  return (
    <div
      className="h-3 w-3 shrink-0 rounded-full border border-neutral-200"
      style={{ backgroundColor: color }}
    />
  );
}

function ThumbnailImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-neutral-300">
        <svg className="h-4 w-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={80}
      height={80}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function ProductCard({
  item,
  onAdd,
}: {
  item: CatalogItem;
  onAdd: (item: CatalogItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-blue-50 transition-colors group"
    >
      {item.thumbnail ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-50 border border-neutral-100 overflow-hidden">
          <ThumbnailImage src={item.thumbnail} alt={item.name} />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 group-hover:bg-blue-100 group-hover:text-blue-500 transition-colors">
          <Plus className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <ColorDot color={item.color} />
          <p className="text-[13px] font-medium text-neutral-800 truncate">{item.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-neutral-400">
            {item.dimensions.widthMm} Ã— {item.dimensions.depthMm} Ã— {item.dimensions.heightMm}mm
          </p>
          {item.subcategory && (
            <span className="rounded bg-neutral-100 px-1.5 py-0 text-[9px] font-medium text-neutral-500 uppercase">
              {item.subcategory}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function SeriesGroup({
  series,
  items,
  onAdd,
}: {
  series: string;
  items: CatalogItem[];
  onAdd: (item: CatalogItem) => void;
}) {
  if (series === "_none") {
    return (
      <>
        {items.map((item) => (
          <ProductCard key={item.id} item={item} onAdd={onAdd} />
        ))}
      </>
    );
  }

  return (
    <div className="mb-1">
      <div className="flex items-center gap-2 px-3 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">{series}</span>
        <span className="rounded-full bg-neutral-200 px-1.5 text-[9px] font-bold text-neutral-500">
          {items.length}
        </span>
      </div>
      {items.map((item) => (
        <ProductCard key={item.id} item={item} onAdd={onAdd} />
      ))}
    </div>
  );
}

export function CatalogSidebar({ catalog }: { catalog: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth < 768;
    return false;
  });
  const setGhostItem = usePlannerR3FStore((s) => s.setGhostItem);

  const categories = useMemo(() => {
    const cats = new Set(catalog.map((i) => i.category));
    return ["all", ...Array.from(cats).sort()];
  }, [catalog]);

  const filtered = useMemo(() => {
    let result = catalog;
    if (activeCategory !== "all") {
      result = result.filter((i) => i.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          (i.subcategory?.toLowerCase().includes(q) ?? false) ||
          (i.series?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [catalog, query, activeCategory]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  const handleAdd = useCallback(
    (item: CatalogItem) => {
      setGhostItem({
        catalogId: item.id,
        name: item.name,
        category: item.category,
        meshType: item.meshType ?? ("utility-box" as MeshFamily),
        widthMm: item.dimensions.widthMm,
        depthMm: item.dimensions.depthMm,
        heightMm: item.dimensions.heightMm,
        color: item.color,
      });
    },
    [setGhostItem],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="absolute left-2 top-14 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white shadow-sm md:hidden"
        aria-label={collapsed ? "Show catalog" : "Hide catalog"}
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
      <div
        className={`${
          collapsed
            ? "hidden"
            : "absolute inset-y-0 left-0 z-10 w-72 md:relative md:z-auto"
        } flex h-full w-72 flex-col border-r border-neutral-200 bg-white`}
      >
        <div className="shrink-0 border-b border-neutral-200 p-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500 mb-2">
            Catalog
          </h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              aria-label="Search catalog products"
              type="search"
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-8 pr-3 text-[13px] text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
            />
          </div>
          <p className="mt-1.5 text-[10px] text-neutral-400">{filtered.length} products</p>
        </div>

        <div className="shrink-0 flex gap-1 overflow-x-auto border-b border-neutral-200 px-3 py-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium capitalize transition-colors ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-[13px] text-neutral-400">
              No items found
            </div>
          ) : (
            groups.map((g) => {
              const seriesGroups = groupBySeries(g.items);
              return (
                <div key={g.category} className="border-b border-neutral-100 py-1">
                  {activeCategory === "all" && (
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        {g.category}
                      </span>
                      <span className="rounded-full bg-blue-50 px-1.5 text-[9px] font-bold text-blue-600">
                        {g.items.length}
                      </span>
                    </div>
                  )}
                  {Array.from(seriesGroups.entries()).map(([series, items]) => (
                    <SeriesGroup key={series} series={series} items={items} onAdd={handleAdd} />
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
