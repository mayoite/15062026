/**
 * CatalogPanel — 3-layer catalog browser for the planner left sidebar.
 *
 * Layer 1: Purpose tabs (horizontal scroll)
 * Layer 2: Sub-category chips
 * Layer 3: 2-column item cards with thumbnails and add-to-canvas
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { Clock, Plus, Search } from "lucide-react";
import Link from "next/link";

import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import {
  CATALOG_SUB_CATEGORIES,
  enrichCatalogItem,
  formatCatalogDimensionsLabel,
  formatCatalogSeatFootprint,
  mapPurposeFilterToCatalogTab,
} from "@/features/planner/catalog/catalogHierarchy";
import {
  CATALOG_PURPOSE_TABS,
  type CatalogItem,
  type CatalogPurposeTab,
  type CatalogSubCategoryId,
} from "@/features/planner/catalog/catalogTypes";
import { CatalogBlockPreview } from "@/features/planner/catalog/CatalogBlockPreview";
import {
  filterCatalogItemsByPurpose,
  type PlannerPrimaryPurpose,
} from "@/features/planner/onboarding/projectSetup";
import { hideNativeDragPreview } from "@/features/planner/catalog/catalogDrop";
import { writeCatalogDragPayload } from "@/features/planner/catalog/shapeTypeRegistry";

export interface CatalogPanelProps {
  onDragStart?: (item: CatalogItem) => void;
  onDragEnd?: () => void;
  onItemClick?: (item: CatalogItem) => void;
  embedded?: boolean;
}

export function CatalogPanel({ onDragStart, onDragEnd, onItemClick, embedded = false }: CatalogPanelProps) {
  const searchQuery = usePlannerCatalogStore((s) => s.query);
  const setSearchQuery = usePlannerCatalogStore((s) => s.setQuery);
  const catalogItems = usePlannerCatalogStore((s) => s.items);
  const purposeFilter = usePlannerCatalogStore((s) => s.purposeFilter);
  const recentIds = usePlannerCatalogStore((s) => s.recentIds);

  const defaultPurposeTab = mapPurposeFilterToCatalogTab(purposeFilter);
  const [tabPick, setTabPick] = useState<{
    purposeFilter: PlannerPrimaryPurpose | null;
    tab: CatalogPurposeTab;
  } | null>(null);
  const [subPick, setSubPick] = useState<{
    purposeTab: CatalogPurposeTab;
    sub: CatalogSubCategoryId;
  } | null>(null);

  const purposeTab =
    tabPick && tabPick.purposeFilter === purposeFilter ? tabPick.tab : defaultPurposeTab;
  const subCategory =
    subPick && subPick.purposeTab === purposeTab ? subPick.sub : ("all" as CatalogSubCategoryId);

  const purposeScopedItems = useMemo(() => {
    const scoped = purposeFilter
      ? filterCatalogItemsByPurpose(catalogItems, purposeFilter)
      : catalogItems;
    return scoped.map(enrichCatalogItem);
  }, [catalogItems, purposeFilter]);

  const allCatalogItems = useMemo(
    () => catalogItems.map(enrichCatalogItem),
    [catalogItems],
  );

  const recentItems = useMemo(
    () =>
      recentIds
        .map((id) => allCatalogItems.find((item) => item.id === id))
        .filter((item): item is CatalogItem => Boolean(item))
        .slice(0, 5),
    [allCatalogItems, recentIds],
  );

  const subCategoryOptions = useMemo(() => {
    const defs = CATALOG_SUB_CATEGORIES[purposeTab];
    const counts = new Map<string, number>();
    for (const item of purposeScopedItems) {
      if (item.purposeTab !== purposeTab) continue;
      const key = item.subCategory ?? "other";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const chips = defs.filter((def) => (counts.get(def.id) ?? 0) > 0);
    return [{ id: "all", label: "All" }, ...chips];
  }, [purposeScopedItems, purposeTab]);

  const activeSubCategory = useMemo(() => {
    if (subCategory === "all") return "all";
    return subCategoryOptions.some((chip) => chip.id === subCategory) ? subCategory : "all";
  }, [subCategory, subCategoryOptions]);

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim();
    let items = purposeScopedItems;

    if (q) {
      return items.filter(
        (item) =>
          item.name.toLowerCase().includes(q.toLowerCase()) ||
          item.description.toLowerCase().includes(q.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q.toLowerCase())) ||
          (item.sku ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (item.shortName ?? "").toLowerCase().includes(q.toLowerCase()) ||
          (item.material ?? "").toLowerCase().includes(q.toLowerCase()),
      );
    }

    items = items.filter((item) => item.purposeTab === purposeTab);
    if (activeSubCategory !== "all") {
      items = items.filter((item) => item.subCategory === activeSubCategory);
    }
    return items;
  }, [activeSubCategory, purposeScopedItems, purposeTab, searchQuery]);

  const handlePurposeChange = useCallback(
    (next: CatalogPurposeTab) => {
      setTabPick({ purposeFilter, tab: next });
      setSubPick(null);
    },
    [purposeFilter],
  );

  const handleSubCategoryChange = useCallback(
    (next: CatalogSubCategoryId) => {
      setSubPick({ purposeTab, sub: next });
    },
    [purposeTab],
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent, item: CatalogItem) => {
      writeCatalogDragPayload(event.dataTransfer, JSON.stringify(item));
      event.dataTransfer.effectAllowed = "copy";
      hideNativeDragPreview(event);
      onDragStart?.(item);
    },
    [onDragStart],
  );

  const handleDragEnd = useCallback(() => {
    onDragEnd?.();
  }, [onDragEnd]);

  const handleItemClick = useCallback(
    (item: CatalogItem) => {
      onItemClick?.(item);
    },
    [onItemClick],
  );

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <aside className="pw-catalog">
      <div className={`pw-catalog-header${embedded ? "" : " pw-catalog-header--standalone"}`}>
        {!embedded ? <h2 className="pw-catalog-title">Element library</h2> : null}
        <div className="pw-catalog-search-wrap">
          <Search size={14} className="pw-catalog-search-icon" aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search SKU, name, material…"
            className="pw-catalog-search"
            aria-label="Search catalog elements"
          />
        </div>
      </div>

      <div className="pw-catalog-scroll custom-scrollbar">
        {!isSearchActive && recentItems.length > 0 ? (
          <section className="pw-catalog-recent" aria-label="Recently used">
            <div className="pw-catalog-section-label">
              <Clock size={12} aria-hidden />
              <span>Recently used</span>
            </div>
            <div className="pw-catalog-recent-row">
              {recentItems.map((item) => (
                <CatalogItemCard
                  key={`recent-${item.id}`}
                  item={item}
                  compact
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>
          </section>
        ) : null}

        {!isSearchActive ? (
          <>
            <div
              className="pw-catalog-purpose-tabs"
              role="tablist"
              aria-label="Catalog purpose"
            >
              {CATALOG_PURPOSE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  className="pw-catalog-purpose-tab"
                  data-active={purposeTab === tab.id}
                  aria-selected={purposeTab === tab.id}
                  onClick={() => handlePurposeChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {subCategoryOptions.length > 1 ? (
              <div
                className="pw-catalog-subchips"
                role="tablist"
                aria-label="Catalog sub-category"
              >
                {subCategoryOptions.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    role="tab"
                    className="pw-catalog-subchip"
                    data-active={activeSubCategory === chip.id}
                    aria-selected={activeSubCategory === chip.id}
                    onClick={() => handleSubCategoryChange(chip.id)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        {visibleItems.length > 0 ? (
          <div className="pw-catalog-grid pw-catalog-grid--cards">
            {visibleItems.map((item) => (
              <CatalogItemCard
                key={item.id}
                item={item}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onItemClick={handleItemClick}
              />
            ))}
          </div>
        ) : (
          <div className="pw-catalog-empty">
            <Search size={24} className="mx-auto opacity-50" aria-hidden />
            <p>
              {isSearchActive
                ? `No elements found for “${searchQuery.trim()}”`
                : "No items in this category yet."}
            </p>
          </div>
        )}
      </div>

      <div className="pw-catalog-footer">{purposeScopedItems.length} Oando symbols</div>
    </aside>
  );
}

function CatalogThumb({ item }: { item: CatalogItem }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (item.imageUrl && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.imageUrl}
        alt=""
        className="pw-catalog-card-thumb-img"
        width={120}
        height={80}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="pw-catalog-card-thumb-fallback" aria-hidden>
      <CatalogBlockPreview item={item} />
    </div>
  );
}

function CatalogItemCard({
  item,
  compact = false,
  onDragStart,
  onDragEnd,
  onItemClick,
}: {
  item: CatalogItem;
  compact?: boolean;
  onDragStart: (event: React.DragEvent, item: CatalogItem) => void;
  onDragEnd: () => void;
  onItemClick: (item: CatalogItem) => void;
}) {
  const enriched = enrichCatalogItem(item);

  return (
    <article
      className={`pw-catalog-card${compact ? " pw-catalog-card--compact" : ""}`}
      draggable
      onDragStart={(event) => {
        event.currentTarget.setAttribute("data-dragging", "true");
        onDragStart(event, enriched);
      }}
      onDragEnd={(event) => {
        event.currentTarget.removeAttribute("data-dragging");
        onDragEnd();
      }}
    >
      <div className="pw-catalog-card-thumb">
        <CatalogThumb item={enriched} />
      </div>

      <button
        type="button"
        className="pw-catalog-card-body"
        onClick={() => onItemClick(enriched)}
        aria-label={`Add ${enriched.shortName} to canvas`}
        data-command-id="catalog.place-item"
      >
        <p className="pw-catalog-card-sku">{enriched.sku}</p>
        <p className="pw-catalog-card-name" title={enriched.name}>
          {enriched.shortName}
        </p>
        <p className="pw-catalog-card-footprint">{formatCatalogSeatFootprint(enriched)}</p>
      </button>

      <button
        type="button"
        className="pw-catalog-card-add"
        aria-label={`Quick place ${enriched.shortName}`}
        data-command-id="catalog.quick-place-item"
        onClick={() => onItemClick(enriched)}
      >
        <Plus size={14} strokeWidth={2.5} aria-hidden />
      </button>

      <div className="pw-catalog-card-tooltip" role="tooltip">
        <p className="pw-catalog-card-tooltip-dims">
          {formatCatalogDimensionsLabel(enriched)}
        </p>
        <p className="pw-catalog-card-tooltip-material">{enriched.material}</p>
        <Link
          href={enriched.catalogUrl ?? "/products"}
          className="pw-catalog-card-tooltip-link"
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          View in catalog →
        </Link>
      </div>
    </article>
  );
}
