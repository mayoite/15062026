"use client";
import { useState, useMemo, useEffect } from "react";
import {
  categories,
  categoryLabels,
  furnitureCatalog,
  matchesCatalogSearch,
  type CatalogItem,
  type FurnitureCategory,
} from "@/features/oando-planner/data/catalogData";
import { usePlannerStore } from "@/features/oando-planner/data/plannerStore";
import { useFavoritesStore } from "@/features/oando-planner/data/favoritesStore";
import { useDebouncedSearch } from "@/features/oando-planner/hooks/useDebouncedSearch";
import Image from "next/image"; // PERF-FIX: use next/image for optimized loading
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PLANNER_BRAND } from "@/features/oando-planner/theme/brandTokens";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    </svg>
  );
}

function CatalogItemPreview({ item }: { item: CatalogItem }) {
  const usesMissingSpriteAsset = item.iconPath.startsWith("/furniture-icons/");
  const [imageFailed, setImageFailed] = useState(usesMissingSpriteAsset);
  const initials = item.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((token) => token[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="w-12 h-12 rounded-lg bg-(--surface-inverse)/5 group-hover:bg-(--surface-inverse)/10 transition-colors flex items-center justify-center overflow-hidden">
      {imageFailed ? (
        <span
          className="text-[11px] font-semibold tracking-[0.14em]"
          style={{ color: "color-mix(in srgb, var(--text-inverse) 60%, transparent)" }}
          aria-hidden="true"
        >
          {initials}
        </span>
      ) : (
        <>{/* PERF-FIX: replaced raw <img> with next/image */}
        <Image
          src={item.iconPath}
          alt={item.name}
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
          onError={() => setImageFailed(true)}
        />
        </>
      )}
    </div>
  );
}

type TabType = "favorites" | FurnitureCategory | "all";

export function FurnitureCatalog({ readOnly = false }: { readOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const {
    value: search,
    debouncedValue: debouncedSearch,
    setValue: setSearch,
  } = useDebouncedSearch("", 180);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addFurniture = usePlannerStore((s) => s.addFurniture);
  const setTool = usePlannerStore((s) => s.setTool);
  const setActiveCatalogId = usePlannerStore((s) => s.setActiveCatalogId);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  const zoom = usePlannerStore((s) => s.zoom);

  // Favorites store
  const favorites = useFavoritesStore((s) => s.favorites);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const isFavorite = useFavoritesStore((s) => s.isFavorite);
  const hydrate = useFavoritesStore((s) => s.hydrate);

  // Hydrate favorites from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of furnitureCatalog) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  const favoritesCount = favorites.length;

  const filtered = useMemo(() => {
    const visibleItems =
      activeTab === "favorites"
        ? furnitureCatalog.filter((item) => favorites.includes(item.id))
        : furnitureCatalog.filter((item) => activeTab === "all" || item.category === activeTab);

    const sortedItems = [...visibleItems].sort((a, b) => {
      const aFav = favorites.includes(a.id) ? 1 : 0;
      const bFav = favorites.includes(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      const aStartsWith =
        debouncedSearch && a.name.toLowerCase().startsWith(debouncedSearch.toLowerCase()) ? 1 : 0;
      const bStartsWith =
        debouncedSearch && b.name.toLowerCase().startsWith(debouncedSearch.toLowerCase()) ? 1 : 0;
      if (aStartsWith !== bStartsWith) return bStartsWith - aStartsWith;

      return a.name.localeCompare(b.name);
    });

    // If favorites tab is active, show only favorited items
    return sortedItems.filter((item) => matchesCatalogSearch(item, debouncedSearch));
  }, [activeTab, debouncedSearch, favorites]);

  const handleAdd = (item: CatalogItem) => {
    if (readOnly) return;
    setActiveCatalogId(item.id);
    setTool("furniture");
  };


  const handleToggleFavorite = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    toggleFavorite(itemId);
  };

  return (
    <div
      className="h-full flex flex-col border-l backdrop-blur-xl"
      style={{
        background: "linear-gradient(180deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.9) 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        color: "var(--text-inverse)",
        boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.25)"
      }}
    >
      {/* Header */}
      <div
        className="p-3 border-b"
        style={{ borderColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-[13px] font-semibold"
            style={{ color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
          >
            Office Furniture
          </h3>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 60%, #000))",
              color: "#fff",
              boxShadow: "0 2px 8px color-mix(in srgb, var(--color-accent) 40%, transparent)"
            }}
          >
            {furnitureCatalog.length} items
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search furniture..."
            aria-label="Search furniture catalog"
            className="w-full text-[12px] px-2.5 py-2 pl-8 rounded-lg outline-none transition-all duration-300 placeholder-white/40 focus:ring-1 focus:ring-[var(--color-accent)]"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              color: "#fff",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "rgba(255, 255, 255, 0.08)",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
            }}
          />
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: "color-mix(in srgb, var(--text-inverse) 25%, transparent)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[14px]"
              style={{ color: "color-mix(in srgb, var(--text-inverse) 30%, transparent)" }}
            >
              Ã—
            </button>
          )}
        </div>
        {search.trim() && (
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
            <span
              style={{ color: "color-mix(in srgb, var(--text-inverse) 35%, transparent)" }}
            >
              {filtered.length} match{filtered.length === 1 ? "" : "es"} for &quot;{search.trim()}&quot;
            </span>
            {filtered[0] && !readOnly && (
              <button
                type="button"
                onClick={() => handleAdd(filtered[0])}
                className="rounded-md px-2 py-1 text-[10px] transition-colors"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-accent) 16%, transparent)",
                  color: "var(--text-inverse)",
                }}
              >
                Add top match
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category tabs - Favorites first */}
      <div
        className="flex flex-wrap gap-1 p-2 border-b max-h-[120px] overflow-y-auto"
        style={{ borderColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)" }}
      >
        {/* Favorites tab - always first */}
        <button
          onClick={() => setActiveTab("favorites")}
          className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1"
          style={
            activeTab === "favorites"
              ? {
                  background: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  color: "var(--text-inverse)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                }
              : {
                  background: "color-mix(in srgb, var(--surface-inverse) 3%, transparent)",
                  color: "color-mix(in srgb, var(--text-inverse) 40%, transparent)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "transparent",
                }
          }
        >
          <StarIcon filled={activeTab === "favorites"} />
          <span>Favorites</span>
          <span
            className="text-[9px]"
            style={{
              color:
                activeTab === "favorites"
                  ? "color-mix(in srgb, var(--text-inverse) 50%, transparent)"
                  : "color-mix(in srgb, var(--text-inverse) 20%, transparent)",
            }}
          >
            {favoritesCount}
          </span>
        </button>

        {/* All tab */}
        <button
          onClick={() => setActiveTab("all")}
          className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1"
          style={
            activeTab === "all"
              ? {
                  background: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  color: "var(--text-inverse)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                }
              : {
                  background: "color-mix(in srgb, var(--surface-inverse) 3%, transparent)",
                  color: "color-mix(in srgb, var(--text-inverse) 40%, transparent)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "transparent",
                }
          }
        >
          All
        </button>

        {/* Category tabs */}
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1"
            style={
              activeTab === cat
                ? {
                    background: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                    color: "var(--text-inverse)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "color-mix(in srgb, var(--color-accent) 20%, transparent)",
                  }
                : {
                    background: "color-mix(in srgb, var(--surface-inverse) 3%, transparent)",
                    color: "color-mix(in srgb, var(--text-inverse) 40%, transparent)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "transparent",
                  }
            }
          >
            <span>{categoryLabels[cat]}</span>
            <span
              className="text-[9px]"
              style={{
                color:
                  activeTab === cat
                    ? "color-mix(in srgb, var(--text-inverse) 50%, transparent)"
                    : "color-mix(in srgb, var(--text-inverse) 20%, transparent)",
              }}
            >
              {categoryCounts[cat] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Item list */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {filtered.map((item) => {
          const itemIsFavorite = isFavorite(item.id);
          return (
            <div
              key={item.id}
              onClick={readOnly ? undefined : () => handleAdd(item)}
              onKeyDown={
                readOnly
                  ? undefined
                  : (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleAdd(item);
                      }
                    }
              }
              role={readOnly ? undefined : "button"}
              tabIndex={readOnly ? undefined : 0}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-300 ease-out group hover:scale-[1.02] cursor-pointer"
              style={{ borderWidth: "1px", borderStyle: "solid", borderColor: "rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.01)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255, 255, 255, 0.1)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.01)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.02)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <CatalogItemPreview item={item} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[12px] truncate transition-colors"
                  style={{ color: "color-mix(in srgb, var(--text-inverse) 75%, transparent)" }}
                >
                  {item.name}
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "color-mix(in srgb, var(--text-inverse) 35%, transparent)" }}
                >
                  {item.widthMm}Ã—{item.depthMm}mm
                </p>
                <p
                  className="text-[9px]"
                  style={{ color: "color-mix(in srgb, var(--text-inverse) 25%, transparent)" }}
                >
                  {item.sku}
                </p>
              </div>
              {/* Favorite star button */}
              <button
                onClick={(e) => handleToggleFavorite(e, item.id)}
                aria-label={itemIsFavorite ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                className="p-1 rounded transition-colors hover:bg-white/10 z-10"
                style={{
                  color: itemIsFavorite
                    ? "var(--color-accent)"
                    : "color-mix(in srgb, var(--text-inverse) 30%, transparent)",
                }}
              >
                <StarIcon filled={itemIsFavorite} />
              </button>
              {!readOnly && (
                <span
                  className="text-[10px] font-medium transition-all duration-300 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
                  style={{ color: "var(--color-accent)" }}
                >
                  + Add
                </span>
              )}
            </div>
          );
        })}
        {/* Empty state for favorites tab */}
        {filtered.length === 0 && activeTab === "favorites" && (
          <div className="text-center py-8">
            <p className="text-[24px] mb-2 opacity-30">â­</p>
            <p
              className="text-[12px]"
              style={{ color: "color-mix(in srgb, var(--text-inverse) 30%, transparent)" }}
            >
              No favorites yet
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: "color-mix(in srgb, var(--text-inverse) 20%, transparent)" }}
            >
              Star catalog items to add them here.
            </p>
          </div>
        )}

        {/* Empty state for search with no results */}
        {filtered.length === 0 && activeTab !== "favorites" && (
          <div className="text-center py-8">
            <p className="text-[24px] mb-2 opacity-30">ðŸ”</p>
            <p
              className="text-[12px]"
              style={{ color: "color-mix(in srgb, var(--text-inverse) 30%, transparent)" }}
            >
              No items found
            </p>
            <p
              className="text-[10px] mt-1"
              style={{ color: "color-mix(in srgb, var(--text-inverse) 20%, transparent)" }}
            >
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
