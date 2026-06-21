"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  DoorOpen,
  GitMerge,
  PackagePlus,
  PenTool,
  Pin,
  PinOff,
  Plus,
  Search,
  Square,
  X,
} from "lucide-react";
import Image from "next/image";


import type { CatalogProduct, PlannerStep, RoomPreset } from "@/features/planner/shared/types/planner";
import { formatDimensionPair, type MeasurementUnit } from "../lib/measurements";

/** Parse dimension numbers from a raw dimension string, respecting mm/cm/m units.
 *  Heuristic: if both numbers are small (<300) and no explicit 'mm' marker, treat as cm. */
function parseDimensionToMm(raw: string | undefined | null): { widthMm: number; depthMm: number } | null {
  if (!raw) return null;
  const normalized = String(raw).trim().toLowerCase();
  const numbers = normalized.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2) return null;

  const a = Number.parseFloat(numbers[0]);
  const b = Number.parseFloat(numbers[1]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;

  let multiplier = 1; // default: mm
  const hasExplicitMm = /\bmm\b/.test(normalized);
  const hasExplicitCm = /\bcm\b/.test(normalized);
  const hasExplicitM = /\bm\b/.test(normalized) && !hasExplicitMm && !hasExplicitCm;

  if (hasExplicitCm) {
    multiplier = 10;
  } else if (hasExplicitM) {
    multiplier = 1000;
  } else if (/\bin(?:ch(?:es)?)?\b|"/.test(normalized)) {
    multiplier = 25.4;
  } else if (/\bft|'/.test(normalized)) {
    multiplier = 304.8;
  } else if (!hasExplicitMm && a < 300 && b < 300) {
    multiplier = 10;
  }

  return {
    widthMm: Math.max(300, Math.round(a * multiplier)),
    depthMm: Math.max(300, Math.round(b * multiplier)),
  };
}

function formatCatalogDimensions(dims: string | undefined, unitSystem: MeasurementUnit): string | null {
  if (!dims) return null;
  const parsed = parseDimensionToMm(dims);
  if (!parsed) return dims; // fallback to raw string if unparseable
  return formatDimensionPair(parsed.widthMm, parsed.depthMm, unitSystem);
}

interface CatalogPanelProps {
  products: CatalogProduct[];
  editor?: null;
  currentStep: PlannerStep;
  canPlaceFurniture: boolean;
  roomPresets: RoomPreset[];
  unitSystem: MeasurementUnit;
  onApplyRoomPreset: (preset: RoomPreset) => void;
  onActivateWallTool: () => void;
  onActivateBasicShapeTool: () => void;
  onAddWallSegment: () => void;
  onAddDoorOpening: () => void;
  onResolveWallJoins: () => void;
  onDropFurniture: (prod: CatalogProduct | { name: string; category: string }) => void;
  onClose: () => void;
  pinned: boolean;
  onTogglePin: () => void;
  showPinToggle?: boolean;
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ExtCatalogProduct = CatalogProduct & {
  categoryId?: string;
  categoryName?: string;
  seriesId?: string;
  seriesName?: string;
  specs?: { dimensions?: string; [k: string]: unknown };
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function colorForName(name: string) {
  const palette = [
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-teal-100 text-teal-700",
    "pw-catalog-warning",
    "bg-rose-100 text-rose-700",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function ProductAvatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  if (src && !failed) {
    return (
      <Image src={src} alt={name} onError={() => setFailed(true)} className="object-contain" fill unoptimized />
    );
  }
  return (
    <span className={`flex h-full w-full items-center justify-center pw-ui-2xs font-bold ${colorForName(name)}`}>
      {initials || "–"}
    </span>
  );
}

// Priority category ordering
const CAT_PRIORITY = ["Workstation", "Workstations", "Desking", "Seating", "Soft Seating", "Lounge"];

function sortedCategories(raw: string[]): string[] {
  const priority = CAT_PRIORITY.filter((p) => raw.includes(p));
  const rest = raw.filter((c) => !CAT_PRIORITY.includes(c)).sort();
  return [...priority, ...rest, "All"];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function CatalogPanel({
  products,
  editor,
  currentStep,
  canPlaceFurniture,
  roomPresets,
  unitSystem,
  onApplyRoomPreset,
  onActivateWallTool,
  onActivateBasicShapeTool,
  onAddWallSegment,
  onAddDoorOpening,
  onResolveWallJoins,
  onDropFurniture,
  onClose,
  pinned,
  onTogglePin,
  showPinToggle = true,
}: CatalogPanelProps) {
  const isRoomStep = currentStep === "room";
  const extProducts = products as ExtCatalogProduct[];

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Workstation");
  const [activeSeries, setActiveSeries] = useState("All");

  // ── L1: unique categories ──────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>();
    extProducts.forEach((p) => { if (p.category) cats.add(p.category); });
    return sortedCategories(Array.from(cats));
  }, [extProducts]);

  // ── L2: series within active category ─────────────────────────────────────
  const seriesInCategory = useMemo(() => {
    const catProducts = activeCategory === "All"
      ? extProducts
      : extProducts.filter((p) => p.category === activeCategory);
    const series = new Set<string>();
    catProducts.forEach((p) => { if (p.seriesName) series.add(p.seriesName); });
    const sorted = Array.from(series).sort();
    return sorted.length > 1 ? ["All", ...sorted] : [];
  }, [extProducts, activeCategory]);

  // Reset series when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setActiveSeries("All");
  };

  // ── L3: filtered products ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return extProducts.filter((p) => {
      const matchCat = activeCategory === "All" || p.category === activeCategory;
      const matchSeries = activeSeries === "All" || p.seriesName === activeSeries;
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSeries && matchSearch;
    });
  }, [extProducts, activeCategory, activeSeries, search]);

  const structuralTools = [
    { key: "wall-chain", label: "Wall Chain", icon: <PenTool className="h-3.5 w-3.5" />, onClick: onActivateWallTool },
    { key: "wall-seg", label: "Wall Segment", icon: <Square className="h-3.5 w-3.5" />, onClick: onAddWallSegment },
    { key: "room-shape", label: "Room Shape", icon: <Building2 className="h-3.5 w-3.5" />, onClick: onActivateBasicShapeTool },
    { key: "door", label: "Door Opening", icon: <DoorOpen className="h-3.5 w-3.5" />, onClick: onAddDoorOpening },
  ];

  return (
    <div className="flex h-full flex-col bg-[color:var(--planner-panel)] font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        data-panel-drag-handle="true"
        className="flex h-9 shrink-0 items-center justify-between border-b border-[color:var(--planner-border-soft)] px-3"
      >
        <span className="pw-ui-2xs font-bold uppercase tracking-[0.14em] text-[color:var(--planner-text-muted)]">
          {isRoomStep ? "Room Builder" : "Catalog"}
        </span>
        <div className="flex items-center gap-0.5">
          {showPinToggle && (
            <button
              type="button" onClick={onTogglePin}
              aria-label={pinned ? "Float panel" : "Dock panel"}
              title={pinned ? "Float panel" : "Dock panel"}
              className={`flex h-6 w-6 items-center justify-center transition-colors ${
                pinned ? "text-[color:var(--planner-primary)]" : "text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)]"
              }`}
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Close panel"
            className="flex h-6 w-6 items-center justify-center text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)] transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── ROOM BUILDER VIEW ─────────────────────────────────────────────── */}
      {isRoomStep ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-[color:var(--planner-border-soft)] p-2">
            <p className="mb-1.5 px-1 pw-ui-2xs font-semibold uppercase tracking-[0.12em] text-[color:var(--planner-text-subtle)]">Presets</p>
            <div className="space-y-px">
              {roomPresets.map((preset) => (
                <button key={preset.id} type="button" onClick={() => onApplyRoomPreset(preset)}
                  className="group flex w-full items-center justify-between border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-3 py-2 text-left transition-colors hover:border-[color:var(--planner-primary)] hover:bg-[color:var(--planner-primary-soft)]">
                  <span className="pw-ui-xs font-semibold text-[color:var(--planner-text-strong)]">{preset.name}</span>
                  <span className="pw-ui-2xs font-medium text-[color:var(--planner-text-subtle)]">
                    {formatDimensionPair(preset.widthMm, preset.heightMm, unitSystem)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <p className="mb-1.5 px-1 pw-ui-2xs font-semibold uppercase tracking-[0.12em] text-[color:var(--planner-text-subtle)]">Draw Tools</p>
            <div className="grid grid-cols-2 gap-px bg-[color:var(--planner-border-soft)]">
              {structuralTools.map((tool) => (
                <button key={tool.key} type="button" onClick={tool.onClick}
                  className="flex items-center gap-2 bg-[color:var(--planner-panel-strong)] px-2.5 py-2.5 text-left transition-colors hover:bg-[color:var(--planner-primary-soft)]">
                  <span className="text-[color:var(--planner-primary)]">{tool.icon}</span>
                  <span className="pw-ui-xs font-medium text-[color:var(--planner-text-body)]">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-px flex gap-px bg-[color:var(--planner-border-soft)]">
              <button type="button" onClick={() => void editor}
                className="flex flex-1 items-center gap-2 bg-[color:var(--planner-panel-strong)] px-2.5 py-2 transition-colors hover:bg-[color:var(--planner-primary-soft)]">
                <PenTool className="h-3.5 w-3.5 text-[color:var(--planner-primary)]" />
                <span className="pw-ui-xs font-medium text-[color:var(--planner-text-body)]">Freehand</span>
              </button>
              <button type="button" onClick={onResolveWallJoins}
                className="flex flex-1 items-center gap-2 bg-[color:var(--planner-panel-strong)] px-2.5 py-2 transition-colors hover:bg-[color:var(--planner-primary-soft)]">
                <GitMerge className="h-3.5 w-3.5 text-[color:var(--planner-primary)]" />
                <span className="pw-ui-xs font-medium text-[color:var(--planner-text-body)]">Resolve Joins</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── CATALOG VIEW ─────────────────────────────────────────────────── */
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Search */}
          <div className="shrink-0 border-b border-[color:var(--planner-border-soft)] px-2 py-2">
            <div className="flex items-center gap-1.5 border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)] px-2 py-1.5">
              <Search className="h-3.5 w-3.5 shrink-0 text-[color:var(--planner-text-subtle)]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="min-w-0 flex-1 bg-transparent pw-ui-xs text-[color:var(--planner-text-body)] placeholder:text-[color:var(--planner-text-subtle)] outline-none" />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="text-[color:var(--planner-text-subtle)] hover:text-[color:var(--planner-text-body)]">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* L1: Category chips — 2-row grid, NO rounded corners */}
          <div className="shrink-0 grid grid-cols-3 gap-px border-b border-[color:var(--planner-border-soft)] bg-[color:var(--planner-border-soft)] p-px">
            {categories.map((cat) => (
              <button key={cat} type="button" onClick={() => handleCategoryChange(cat)}
                className={`rounded-none px-1.5 py-1.5 pw-ui-2xs font-semibold uppercase tracking-[0.05em] transition-colors ${
                  activeCategory === cat
                    ? "bg-[color:var(--planner-primary)] text-white"
                    : "bg-[color:var(--planner-panel-strong)] text-[color:var(--planner-text-muted)] hover:bg-[color:var(--planner-primary-soft)] hover:text-[color:var(--planner-primary)]"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {/* L2: Series/subcategory filter — only when multiple series exist */}
          {seriesInCategory.length > 0 && (
            <div className="shrink-0 grid grid-cols-2 gap-px border-b border-[color:var(--planner-border-soft)] bg-[color:var(--planner-border-soft)] p-px">
              {seriesInCategory.map((s) => (
                <button key={s} type="button" onClick={() => setActiveSeries(s)}
                  className={`rounded-none px-2 py-1 pw-ui-2xs font-medium tracking-[0.03em] transition-colors truncate ${
                    activeSeries === s
                      ? "bg-[color:var(--planner-primary)]/15 text-[color:var(--planner-primary)] font-semibold"
                      : "bg-[color:var(--planner-panel-strong)] text-[color:var(--planner-text-muted)] hover:text-[color:var(--planner-primary)]"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Placement warning */}
          {!canPlaceFurniture && (
            <div className="shrink-0 border-b border-[color:var(--planner-border-soft)] bg-amber-50 px-3 py-2">
              <p className="flex items-center gap-1.5 pw-ui-2xs font-medium text-[color:var(--color-bronze-600)]">
                <PackagePlus className="h-3.5 w-3.5 shrink-0" />
                Define the room shell first to place products.
              </p>
            </div>
          )}

          {/* L3: Product list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <PackagePlus className="h-6 w-6 text-[color:var(--planner-text-subtle)]" />
                <p className="pw-ui-xs text-[color:var(--planner-text-subtle)]">No products match</p>
              </div>
            ) : (
              <div className="divide-y divide-[color:var(--planner-border-soft)]">
                {filtered.map((product, idx) => {
                  const ext = product as ExtCatalogProduct;
                  const img = product.flagship_image || product.images?.[0];
                  const dims = ext.specs?.dimensions;
                  return (
                    <button
                      key={`${product.slug ?? product.name}-${idx}`}
                      type="button"
                      disabled={!canPlaceFurniture}
                      onClick={() => onDropFurniture(product)}
                      title={product.name}
                      className={`group flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                        canPlaceFurniture
                          ? "hover:bg-[color:var(--planner-primary-soft)]"
                          : "cursor-not-allowed opacity-45"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="h-10 w-10 shrink-0 overflow-hidden border border-[color:var(--planner-border-soft)] bg-[color:var(--planner-panel-strong)]">
                        <ProductAvatar name={product.name ?? "?"} src={img} />
                      </div>
                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold leading-tight text-[color:var(--planner-text-strong)]">
                          {product.name}
                        </p>
                        {ext.seriesName && (
                          <p className="truncate pw-ui-2xs font-medium text-[color:var(--planner-text-muted)]">
                            {ext.seriesName}
                          </p>
                        )}
                        {dims && (
                          <p className="pw-ui-2xs text-[color:var(--planner-text-subtle)]">{formatCatalogDimensions(dims, unitSystem)}</p>
                        )}
                      </div>
                      {/* Add */}
                      {canPlaceFurniture && (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-[color:var(--planner-text-subtle)] opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-[color:var(--planner-primary)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[color:var(--planner-border-soft)] px-3 py-1">
            <p className="pw-ui-2xs text-[color:var(--planner-text-subtle)]">
              {filtered.length} of {products.length} products
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
