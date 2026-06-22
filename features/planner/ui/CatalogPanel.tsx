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
    "pw-catalog-panel__avatar--blue",
    "pw-catalog-panel__avatar--indigo",
    "pw-catalog-panel__avatar--violet",
    "pw-catalog-panel__avatar--teal",
    "pw-catalog-panel__avatar--amber",
    "pw-catalog-panel__avatar--rose",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return palette[h % palette.length];
}

function ProductAvatar({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const toneClass = colorForName(name);
  if (src && !failed) {
    return (
      <div className={`pw-catalog-panel__avatar ${toneClass}`}>
        <Image
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          className="pw-catalog-panel__avatar-image"
          fill
          sizes="40px"
          unoptimized
        />
      </div>
    );
  }
  return (
    <span className={`pw-catalog-panel__avatar pw-catalog-panel__avatar-fallback ${toneClass}`}>
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
    { key: "wall-chain", label: "Wall Chain", icon: <PenTool className="pw-catalog-panel__tool-icon" />, onClick: onActivateWallTool },
    { key: "wall-seg", label: "Wall Segment", icon: <Square className="pw-catalog-panel__tool-icon" />, onClick: onAddWallSegment },
    { key: "room-shape", label: "Room Shape", icon: <Building2 className="pw-catalog-panel__tool-icon" />, onClick: onActivateBasicShapeTool },
    { key: "door", label: "Door Opening", icon: <DoorOpen className="pw-catalog-panel__tool-icon" />, onClick: onAddDoorOpening },
  ];

  return (
    <div className="pw-catalog-panel">
      <div data-panel-drag-handle="true" className="pw-catalog-panel__header">
        <span className="pw-catalog-panel__title">
          {isRoomStep ? "Room Builder" : "Catalog"}
        </span>
        <div className="pw-catalog-panel__actions">
          {showPinToggle && (
            <button
              type="button"
              onClick={onTogglePin}
              aria-label={pinned ? "Float panel" : "Dock panel"}
              title={pinned ? "Float panel" : "Dock panel"}
              className={`pw-catalog-panel__icon-button${pinned ? " pw-catalog-panel__icon-button--active" : ""}`}
            >
              {pinned ? <PinOff className="pw-catalog-panel__icon" /> : <Pin className="pw-catalog-panel__icon" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="pw-catalog-panel__icon-button"
          >
            <X className="pw-catalog-panel__icon" />
          </button>
        </div>
      </div>

      {isRoomStep ? (
        <div className="pw-catalog-panel__body">
          <section className="pw-catalog-panel__section">
            <p className="pw-catalog-panel__section-label">Presets</p>
            <div className="pw-catalog-panel__stack">
              {roomPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyRoomPreset(preset)}
                  className="pw-catalog-panel__preset"
                >
                  <span className="pw-catalog-panel__preset-name">{preset.name}</span>
                  <span className="pw-catalog-panel__preset-meta">
                    {formatDimensionPair(preset.widthMm, preset.heightMm, unitSystem)}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="pw-catalog-panel__section pw-catalog-panel__section--fill">
            <p className="pw-catalog-panel__section-label">Draw Tools</p>
            <div className="pw-catalog-panel__tools-grid">
              {structuralTools.map((tool) => (
                <button
                  key={tool.key}
                  type="button"
                  onClick={tool.onClick}
                  className="pw-catalog-panel__tool"
                >
                  <span className="pw-catalog-panel__tool-mark">{tool.icon}</span>
                  <span className="pw-catalog-panel__tool-label">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="pw-catalog-panel__tool-row">
              <button type="button" onClick={() => void editor} className="pw-catalog-panel__tool pw-catalog-panel__tool--split">
                <PenTool className="pw-catalog-panel__tool-icon" />
                <span className="pw-catalog-panel__tool-label">Freehand</span>
              </button>
              <button type="button" onClick={onResolveWallJoins} className="pw-catalog-panel__tool pw-catalog-panel__tool--split">
                <GitMerge className="pw-catalog-panel__tool-icon" />
                <span className="pw-catalog-panel__tool-label">Resolve Joins</span>
              </button>
            </div>
          </section>
        </div>
      ) : (
        <div className="pw-catalog-panel__body">
          <div className="pw-catalog-panel__search-shell">
            <div className="pw-catalog-panel__search-box">
              <Search className="pw-catalog-panel__search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="pw-catalog-panel__search-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="pw-catalog-panel__search-clear"
                >
                  <X className="pw-catalog-panel__search-clear-icon" />
                </button>
              )}
            </div>
          </div>

          <div className="pw-catalog-panel__chip-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                data-active={activeCategory === cat}
                className="pw-catalog-panel__chip"
              >
                {cat}
              </button>
            ))}
          </div>

          {seriesInCategory.length > 0 && (
            <div className="pw-catalog-panel__chip-grid pw-catalog-panel__chip-grid--series">
              {seriesInCategory.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSeries(s)}
                  data-active={activeSeries === s}
                  className="pw-catalog-panel__chip pw-catalog-panel__chip--series"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {!canPlaceFurniture && (
            <div className="pw-catalog-panel__warning pw-catalog-warning">
              <p className="pw-catalog-panel__warning-copy">
                <PackagePlus className="pw-catalog-panel__warning-icon" />
                Define the room shell first to place products.
              </p>
            </div>
          )}

          <div className="pw-catalog-panel__list-wrap">
            {filtered.length === 0 ? (
              <div className="pw-catalog-panel__empty">
                <PackagePlus className="pw-catalog-panel__empty-icon" />
                <p className="pw-catalog-panel__empty-copy">No products match</p>
              </div>
            ) : (
              <div className="pw-catalog-panel__list">
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
                      className="pw-catalog-panel__item"
                    >
                      <div className="pw-catalog-panel__avatar-shell">
                        <ProductAvatar name={product.name ?? "?"} src={img} />
                      </div>
                      <div className="pw-catalog-panel__item-copy">
                        <p className="pw-catalog-panel__item-name">
                          {product.name}
                        </p>
                        {ext.seriesName && (
                          <p className="pw-catalog-panel__item-series">
                            {ext.seriesName}
                          </p>
                        )}
                        {dims && (
                          <p className="pw-catalog-panel__item-dims">{formatCatalogDimensions(dims, unitSystem)}</p>
                        )}
                      </div>
                      {canPlaceFurniture && (
                        <Plus className="pw-catalog-panel__add-icon" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pw-catalog-panel__footer">
            <p className="pw-catalog-panel__count">
              {filtered.length} of {products.length} products
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
