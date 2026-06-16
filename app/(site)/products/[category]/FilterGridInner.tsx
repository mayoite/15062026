"use client";

import type { CompatCategory as Category } from "@/features/catalog/getProducts";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CompareDock } from "@/components/products/CompareDock";
import { CATEGORY_ROUTE_COPY } from "@/data/site/routeCopy";
import {
  DEFAULT_FILTERS,
  buildFilterParams,
  buildFilterUrl,
  countActiveFilters,
  parseFiltersFromSearchParams,
  type ActiveFilters,
} from "@/features/catalog/filters";
import { trackSiteCtaClick } from "@/lib/analytics/siteEvents";
import { useProductCompare } from "@/lib/store/productCompare";

import {
  AccordionSection,
  ActiveChips,
  CheckList,
  ProductCard,
  SustainabilityButtons,
  Toggle,
} from "./FilterGrid.components";
import {
  buildFallbackFacets,
  type FilterResponse,
  flattenCategoryProducts,
  getProductRouteKey,
  useDebouncedValue,
} from "./FilterGrid.helpers";

const FILTER_GRID_COPY = {
  ...CATEGORY_ROUTE_COPY,
  filterTitle: CATEGORY_ROUTE_COPY.filterSummaryTitle,
  filterSubtitle: CATEGORY_ROUTE_COPY.filterSummaryDescription,
  searchLabel: "Search",
  searchPlaceholder: "Search products, materials, or series",
  clearSearchLabel: "Clear search",
  resultsTitle: "Products",
  resultsSummary: CATEGORY_ROUTE_COPY.resultsSummaryLabel,
  closeFiltersLabel: "Close filters",
} as const;

export function AdvancedFilterGridInner({
  category,
  categoryId,
}: {
  category: Category;
  categoryId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const compareItems = useProductCompare((state) => state.items);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerOpenButtonRef = useRef<HTMLButtonElement>(null);
  const wasDrawerOpenRef = useRef(false);

  const filters = useMemo(
    () => parseFiltersFromSearchParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const isSeriesEnabled = categoryId !== "seating";
  const effectiveFilters = useMemo(
    () => (isSeriesEnabled ? filters : { ...filters, series: "all" }),
    [filters, isSeriesEnabled],
  );
  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const updateFilters = useCallback(
    (next: Partial<ActiveFilters>, options?: { replace?: boolean }) => {
      const currentFilters = parseFiltersFromSearchParams(
        new URLSearchParams(searchParams.toString()),
      );
      const updated = { ...currentFilters, ...next } as ActiveFilters;
      const nextUrl = buildFilterUrl(pathname, updated);
      if (typeof window !== "undefined") {
        window.history.replaceState(window.history.state, "", nextUrl);
      }
      if (options?.replace) {
        router.replace(nextUrl, { scroll: false });
        return;
      }
      router.push(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch === filters.query) return;
    updateFilters({ query: debouncedSearch }, { replace: true });
  }, [debouncedSearch, filters.query, updateFilters]);

  useEffect(() => {
    if (isSeriesEnabled || filters.series === "all") return;
    updateFilters({ series: "all" }, { replace: true });
  }, [filters.series, isSeriesEnabled, updateFilters]);

  const fallbackProducts = useMemo(() => flattenCategoryProducts(category), [category]);
  const fallbackFacets = useMemo(
    () => buildFallbackFacets(categoryId, fallbackProducts),
    [categoryId, fallbackProducts],
  );

  const filterQueryString = useMemo(
    () => buildFilterParams(effectiveFilters).toString(),
    [effectiveFilters],
  );
  const hasFilterQuery = filterQueryString.length > 0;
  const compareQuery = useMemo(
    () => compareItems.map((item) => item.productUrlKey).filter(Boolean).join(","),
    [compareItems],
  );

  const apiQueryString = useMemo(() => {
    const params = new URLSearchParams(filterQueryString);
    params.set("category", categoryId);
    return params.toString();
  }, [categoryId, filterQueryString]);

  const { data, isLoading, isFetching, error } = useQuery<FilterResponse>({
    queryKey: ["category-products", categoryId, apiQueryString],
    queryFn: async () => {
      const response = await fetch(`/api/products/filter/?${apiQueryString}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Filter request failed: ${response.status}`);
      return (await response.json()) as FilterResponse;
    },
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    gcTime: 300_000,
  });

  const shouldUseFallbackData = !hasFilterQuery || Boolean(data) || Boolean(error);
  const filteredProducts = useMemo(
    () => shouldUseFallbackData ? (data?.products ?? fallbackProducts) : [],
    [data?.products, fallbackProducts, shouldUseFallbackData],
  );
  const navigableProducts = useMemo(
    () => filteredProducts.filter((product) => getProductRouteKey(product).length > 0),
    [filteredProducts],
  );
  const options = shouldUseFallbackData ? (data?.facets ?? fallbackFacets) : fallbackFacets;
  const allProducts = shouldUseFallbackData
    ? (data?.meta.catalogTotal ?? fallbackProducts.length)
    : fallbackProducts.length;
  const isInitialFilteredLoad = isLoading && hasFilterQuery && !data && !error;

  const showFeatureFilters =
    options.featureAvailability.hasHeadrest ||
    options.featureAvailability.isHeightAdjustable ||
    options.featureAvailability.bifmaCertified ||
    options.featureAvailability.isStackable;

  const toggleArray = useCallback(
    (key: "subcategory" | "priceRange" | "material", value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateFilters({ [key]: next });
    },
    [filters, updateFilters],
  );

  const removeChip = useCallback(
    (key: string, value?: string | number) => {
      if (key === "subcategory" || key === "priceRange" || key === "material") {
        const current = filters[key] as string[];
        updateFilters({ [key]: current.filter((v) => v !== value) });
      } else if (
        key === "hasHeadrest" ||
        key === "isHeightAdjustable" ||
        key === "bifmaCertified" ||
        key === "isStackable"
      ) {
        updateFilters({ [key]: false });
      } else if (key === "series") {
        updateFilters({ series: "all" });
      } else if (key === "query") {
        setSearchInput("");
        updateFilters({ query: "" }, { replace: true });
      } else if (key === "ecoMin") {
        updateFilters({ ecoMin: null });
      }
    },
    [filters, updateFilters],
  );

  const clearAll = useCallback(() => {
    setSearchInput("");
    updateFilters(DEFAULT_FILTERS, { replace: true });
  }, [updateFilters]);

  const activeCount = countActiveFilters(effectiveFilters);
  const compareHref = compareQuery
    ? `/compare?items=${encodeURIComponent(compareQuery)}`
    : "/compare";
  const compareLabel =
    compareItems.length > 0
      ? FILTER_GRID_COPY.compareActiveLabel.replace("{count}", String(compareItems.length))
      : FILTER_GRID_COPY.compareIdleLabel;
  const shouldUseContentVisibility = navigableProducts.length >= 20;
  const gridIntrinsicBlockSizePx = Math.max(3200, navigableProducts.length * 420);

  useEffect(() => {
    if (!drawerOpen) {
      if (wasDrawerOpenRef.current) drawerOpenButtonRef.current?.focus();
      wasDrawerOpenRef.current = false;
      return;
    }

    wasDrawerOpenRef.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      if (!drawerRef.current) return;
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
        "button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      );
      firstFocusable?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!drawerRef.current) return;
      if (event.key === "Escape") {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const sidebar = (
    <aside className="space-y-0">
          <div className="border-b border-[color:var(--border-soft)] px-4 py-4">
        <h2 className="filter-ui-title">
          {FILTER_GRID_COPY.filterTitle}
        </h2>
        <p className="filter-ui-subtitle mt-1">
          {FILTER_GRID_COPY.filterSubtitle}
        </p>
      </div>

      <ActiveChips
        filters={effectiveFilters}
        onRemove={removeChip}
        onClearAll={clearAll}
        total={activeCount}
      />

      <AccordionSection title={FILTER_GRID_COPY.searchLabel} defaultOpen>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={FILTER_GRID_COPY.searchPlaceholder}
            className="input-search pl-9 pr-10"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label={FILTER_GRID_COPY.clearSearchLabel}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-heading"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </AccordionSection>

      {isSeriesEnabled ? (
        <AccordionSection title="Series" count={options.series.length} defaultOpen>
          <select
            className="select-filter"
            value={filters.series}
            onChange={(event) => updateFilters({ series: event.target.value })}
          >
            <option value="all">All series</option>
            {options.series.map((series) => (
              <option key={series} value={series}>
                {series}
              </option>
            ))}
          </select>
        </AccordionSection>
      ) : null}

      <AccordionSection title="Subcategory" count={options.subcategory.length} defaultOpen>
        <CheckList
          options={options.subcategory}
          selected={filters.subcategory}
          onToggle={(value) => toggleArray("subcategory", value)}
        />
      </AccordionSection>

      <AccordionSection title="Price" count={options.priceRange.length}>
        <CheckList
          options={options.priceRange}
          selected={filters.priceRange}
          onToggle={(value) => toggleArray("priceRange", value)}
        />
      </AccordionSection>

      <AccordionSection title="Material" count={options.material.length}>
        <CheckList
          options={options.material}
          selected={filters.material}
          onToggle={(value) => toggleArray("material", value)}
        />
      </AccordionSection>

      {showFeatureFilters ? (
        <AccordionSection title="Features">
          <div className="space-y-2">
            {options.featureAvailability.hasHeadrest ? (
              <Toggle
                label="With headrest"
                checked={filters.hasHeadrest}
                onChange={(value) => updateFilters({ hasHeadrest: value })}
              />
            ) : null}
            {options.featureAvailability.isHeightAdjustable ? (
              <Toggle
                label="Height adjustable"
                checked={filters.isHeightAdjustable}
                onChange={(value) => updateFilters({ isHeightAdjustable: value })}
              />
            ) : null}
            {options.featureAvailability.bifmaCertified ? (
              <Toggle
                label="BIFMA certified"
                checked={filters.bifmaCertified}
                onChange={(value) => updateFilters({ bifmaCertified: value })}
              />
            ) : null}
            {options.featureAvailability.isStackable ? (
              <Toggle
                label="Stackable"
                checked={filters.isStackable}
                onChange={(value) => updateFilters({ isStackable: value })}
              />
            ) : null}
          </div>
        </AccordionSection>
      ) : null}

      <AccordionSection title="Sustainability">
        <SustainabilityButtons
          selected={filters.ecoMin}
          onSelect={(value) => updateFilters({ ecoMin: value })}
        />
      </AccordionSection>
    </aside>
  );

  return (
    <section className="container-wide pb-8 pt-6">
      <div className="grid gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18.5rem_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-sm border border-[color:var(--border-soft)] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            {sidebar}
          </div>
        </div>

        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border-soft)] pb-4">
            <div>
              <p className="filter-ui-title">
                {FILTER_GRID_COPY.resultsTitle}
              </p>
              <p className="filter-ui-subtitle mt-1">
                {FILTER_GRID_COPY.resultsSummary
                  .replace("{shown}", String(navigableProducts.length))
                  .replace("{total}", String(allProducts))}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                ref={drawerOpenButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="btn-outline lg:hidden"
                aria-expanded={drawerOpen}
                aria-controls="category-filter-drawer"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeCount > 0 ? (
                  <span className="ml-1 rounded-full bg-[color:var(--surface-inverse)] px-2 py-0.5 text-[11px] text-white">
                    {activeCount}
                  </span>
                ) : null}
              </button>

              <Link
                href={compareHref}
                className="btn-outline"
                onClick={() =>
                  trackSiteCtaClick({
                    href: compareHref,
                    pathname,
                    surface: "category-grid",
                    label: "open-compare",
                  })}
              >
                <Filter className="h-4 w-4" />
                {compareLabel}
              </Link>
            </div>
          </div>

          {isInitialFilteredLoad ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-sm border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] aspect-[4/5]" />
              ))}
            </div>
          ) : navigableProducts.length === 0 ? (
            <div className="rounded-sm border border-dashed border-[color:var(--border-muted)] bg-[color:var(--surface-soft)] px-6 py-10 text-center">
              <p className="text-base text-heading">
                {CATEGORY_ROUTE_COPY.emptyTitle}
              </p>
              <p className="mt-2 text-sm text-muted">
                {CATEGORY_ROUTE_COPY.emptyDescription}
              </p>
              {activeCount > 0 ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="btn-outline mt-5"
                >
                  {CATEGORY_ROUTE_COPY.clearFiltersCta}
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
              style={
                shouldUseContentVisibility
                  ? {
                      contentVisibility: "auto",
                      containIntrinsicBlockSize: `${gridIntrinsicBlockSizePx}px`,
                    }
                  : undefined
              }
            >
              {navigableProducts.map((product) => (
                <ProductCard
                  key={getProductRouteKey(product)}
                  product={product}
                  categoryId={categoryId}
                  categoryName={category.name}
                  contextQueryString={filterQueryString}
                />
              ))}
            </div>
          )}

          {isFetching && !isInitialFilteredLoad ? (
            <p className="text-xs text-muted">
              Updating results...
            </p>
          ) : null}
        </div>
      </div>

      {drawerOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="category-filter-drawer"
            ref={drawerRef}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto bg-white shadow-[0_20px_80px_rgba(15,23,42,0.24)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={FILTER_GRID_COPY.filterTitle}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--border-soft)] px-4 py-4">
              <div>
                <p className="filter-ui-title">
                  {FILTER_GRID_COPY.filterTitle}
                </p>
                <p className="filter-ui-subtitle mt-1">
                  {FILTER_GRID_COPY.filterSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full border border-[color:var(--border-soft)] p-2 text-muted hover:text-heading"
                aria-label={FILTER_GRID_COPY.closeFiltersLabel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sidebar}

            <div className="sticky bottom-0 border-t border-[color:var(--border-soft)] bg-white px-4 py-4">
              <div className="flex gap-3">
                {activeCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      clearAll();
                      setDrawerOpen(false);
                    }}
                    className="flex-1 h-11 border border-[color:var(--border-muted)] text-sm text-strong rounded-sm hover:bg-[color:var(--surface-soft)] transition-colors"
                  >
                    Clear all
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 h-11 rounded-sm bg-[color:var(--surface-inverse)] text-sm font-normal text-white transition-colors hover:bg-[color:var(--surface-inverse-soft)]"
                >
                  {CATEGORY_ROUTE_COPY.drawerResultsCta.replace(
                    "{count}",
                    String(navigableProducts.length),
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
      <CompareDock />
    </section>
  );
}
