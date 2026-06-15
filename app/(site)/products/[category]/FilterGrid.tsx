"use client";

import type {
  CompatCategory as Category,
  CompatProduct as Product,
} from '@/features/catalog/getProducts';
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Search as SearchIcon,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Filter,
  ShoppingCart,
  GitCompareArrows,
} from "lucide-react";
import {
  useState,
  useMemo,
  useCallback,
  Suspense,
  useEffect,
  useRef,
} from "react";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";
import { useQuoteCart } from "@/lib/store/quoteCart";
import { useProductCompare } from "@/lib/store/productCompare";
import { CompareDock } from "@/components/products/CompareDock";
import {
  DEFAULT_FILTERS,
  PRICE_RANGES,
  SUSTAINABILITY_THRESHOLDS,
  buildFilterParams,
  buildFilterUrl,
  countActiveFilters,
  parseFiltersFromSearchParams,
  type ActiveFilters,
  type SortOption,
} from '@/features/catalog/filters';
import { hasVerifiedHeadrest, hasVerifiedHeightAdjustable } from '@/features/catalog/traits';
import {
  sanitizeDisplayText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import {
  trackCompareToggled,
  trackQuoteCartAdded,
  trackSiteCtaClick,
} from "@/lib/analytics/siteEvents";
import { normalizeAssetPath } from "@/lib/assetPaths";
import { CATEGORY_ROUTE_COPY } from "@/data/site/routeCopy";

// Types

interface FlatProduct extends Product {
  seriesId: string;
  seriesName: string;
  altText?: string;
}

function normalizeToken(value?: string | null): string {
  return sanitizeDisplayText(String(value || "")).toLowerCase();
}

function dedupePriority(product: FlatProduct): number {
  const slug = String(product.slug || "").trim();
  let score = 0;
  if (slug.startsWith("oando-")) score += 4;
  if (slug.includes("--")) score += 2;
  if (product.metadata?.source === "oando.co.in") score += 1;
  return score;
}

function dedupeFlatProducts(products: FlatProduct[]): FlatProduct[] {
  const bestByKey = new Map<string, FlatProduct>();

  for (const product of products) {
    const key = `${normalizeToken(product.name)}|${normalizeToken(product.metadata?.subcategory || "")}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, product);
      continue;
    }

    if (dedupePriority(product) > dedupePriority(existing)) {
      bestByKey.set(key, product);
    }
  }

  return Array.from(bestByKey.values());
}

const IMAGE_PLACEHOLDER_PATTERNS = [
  /assets_placeholder/i,
  /fallback\/category\.webp$/i,
  /\.svg$/i,
];

function isUsableImagePath(path: string): boolean {
  const value = path.trim();
  if (!value) return false;
  if (IMAGE_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    return false;
  }
  return true;
}

function buildImageCandidates(product: Pick<FlatProduct, "images" | "flagshipImage">): string[] {
  const raw = [
    normalizeAssetPath(product.flagshipImage),
    ...(Array.isArray(product.images)
      ? product.images.map((image) => normalizeAssetPath(String(image || "").trim()))
      : []),
  ].filter(Boolean);

  const unique = Array.from(new Set(raw));
  const preferred = unique.filter(isUsableImagePath);
  return preferred.length > 0 ? preferred : unique;
}

function toTextList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function toInlineSpec(value: string, max = 72): string {
  const normalized = sanitizeDisplayText(value);
  if (!normalized) return "";
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}

function getDisplayDimensions(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const specDimensions = typeof specs.dimensions === "string" ? specs.dimensions : "";
  const normalizedSpecDimensions = filterMeaningfulDimensionText(specDimensions);
  if (normalizedSpecDimensions) return toInlineSpec(normalizedSpecDimensions, 68);

  const detailed = typeof product.detailedInfo?.dimensions === "string"
    ? product.detailedInfo.dimensions
    : "";
  return toInlineSpec(filterMeaningfulDimensionText(detailed), 68);
}

function getDisplayMaterials(product: FlatProduct): string {
  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const sourceMaterials = filterMeaningfulMaterialList(toTextList(specs.materials));
  if (sourceMaterials.length > 0) {
    return toInlineSpec(sourceMaterials.slice(0, 2).join(", "), 68);
  }

  const detailed = filterMeaningfulMaterialList(toTextList(product.detailedInfo?.materials));
  return toInlineSpec(detailed.slice(0, 2).join(", "), 68);
}

function getDisplayUseCase(product: FlatProduct): string {
  const metadataUseCase = Array.isArray(product.metadata?.useCase)
    ? product.metadata?.useCase
    : [];
  if (metadataUseCase.length > 0) {
    return toInlineSpec(metadataUseCase.slice(0, 2).join(", "), 68);
  }

  const specs = product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
    ? (product.specs as Record<string, unknown>)
    : {};
  const specsUseCase = toTextList(specs.use_case);
  return toInlineSpec(specsUseCase.slice(0, 2).join(", "), 68);
}

function getProductSignals(product: FlatProduct): string[] {
  const signals: string[] = [];

  if (hasVerifiedHeadrest(product)) signals.push("With headrest");
  if (product.metadata?.isHeightAdjustable) signals.push("Height adjustable");
  if (product.metadata?.isStackable) signals.push("Stackable");
  if (Array.isArray(product.variants) && product.variants.length > 1) {
    signals.push(`${product.variants.length} configurations`);
  }

  return signals.slice(0, 3);
}

// Helpers
interface FilterResponse {
  products: FlatProduct[];
  total: number;
  facets: {
    series: string[];
    subcategory: string[];
    material: string[];
    priceRange: string[];
    ecoMin: { min: number; max: number };
    featureAvailability: {
      hasHeadrest: boolean;
      isHeightAdjustable: boolean;
      bifmaCertified: boolean;
      isStackable: boolean;
    };
  };
  meta: {
    categoryId: string;
    catalogTotal: number;
  };
}

function fallbackAltText(productName: string, categoryName: string): string {
  return sanitizeDisplayText(
    `Product image of ${productName} in ${categoryName} category`,
  ).slice(0, 140);
}

function getProductRouteKey(product: Pick<FlatProduct, "slug" | "id">): string {
  const slugValue = typeof product.slug === "string" ? product.slug.trim() : "";
  if (slugValue) return slugValue;
  const idValue = typeof product.id === "string" ? product.id.trim() : "";
  return idValue;
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

function flattenCategoryProducts(category: Category): FlatProduct[] {
  const flattened = category.series.flatMap((series) =>
    series.products.map((product) => ({
      ...product,
      seriesId: series.id,
      seriesName: series.name,
      altText:
        (product as unknown as { altText?: string; alt_text?: string }).altText ||
        (product as unknown as { altText?: string; alt_text?: string }).alt_text ||
        (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
        (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
        fallbackAltText(product.name, category.name),
    })),
  );
  return dedupeFlatProducts(flattened);
}

function buildFallbackFacets(
  categoryId: string,
  products: FlatProduct[],
): FilterResponse["facets"] {
  const specsRecord = (product: FlatProduct): Record<string, unknown> =>
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};

  const uniqueSorted = (values: string[]) =>
    Array.from(
      new Set(
        values
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

  const subcategoryValues = products
    .map((product) =>
      sanitizeDisplayText(
        String(
          product.metadata?.subcategory ||
            specsRecord(product).subcategory ||
            "",
        ),
      ),
    )
    .filter(Boolean);

  const materialValues = products.flatMap((product) => {
    const metadataMaterials = Array.isArray(product.metadata?.material)
      ? product.metadata?.material.map((value) => sanitizeDisplayText(String(value)))
      : [];
    if (metadataMaterials.length > 0) return metadataMaterials.filter(Boolean);

    const rawSpecsMaterials = specsRecord(product).materials;
    return Array.isArray(rawSpecsMaterials)
      ? rawSpecsMaterials
          .map((value) => sanitizeDisplayText(String(value)))
          .filter(Boolean)
      : [];
  });

  const priceRangeSet = new Set(
    products
      .map((product) => {
        const specs = specsRecord(product);
        return String(
          product.metadata?.priceRange ||
            specs.priceRange ||
            specs.price_range ||
            "",
        )
          .trim()
          .toLowerCase();
      })
      .filter((value) => PRICE_RANGES.includes(value as (typeof PRICE_RANGES)[number])),
  );

  const ecoScores = products
    .map((product) => product.metadata?.sustainabilityScore)
    .filter((score): score is number => typeof score === "number");
  const hasHeadrestCount = products.filter((product) => hasVerifiedHeadrest(product)).length;
  const heightAdjCount = products.filter((product) =>
    hasVerifiedHeightAdjustable(product),
  ).length;
  const bifmaCount = products.filter((product) => product.metadata?.bifmaCertified).length;
  const stackableCount = products.filter((product) => product.metadata?.isStackable).length;

  return {
    series:
      categoryId === "seating"
        ? []
        : uniqueSorted(products.map((product) => product.seriesName)),
    subcategory: uniqueSorted(subcategoryValues),
    material: uniqueSorted(materialValues),
    priceRange: PRICE_RANGES.filter((range) => priceRangeSet.has(range)),
    ecoMin: {
      min: ecoScores.length > 0 ? Math.min(...ecoScores) : 0,
      max: ecoScores.length > 0 ? Math.max(...ecoScores) : 10,
    },
    featureAvailability: {
      hasHeadrest: hasHeadrestCount > 0,
      isHeightAdjustable: heightAdjCount > 0,
      bifmaCertified: bifmaCount > 0,
      isStackable: stackableCount > 0,
    },
  };
}

// Accordion section

function AccordionSection({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[color:var(--border-soft)] last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group"
        aria-expanded={open}
      >
        <span className="filter-ui-heading group-hover:text-heading transition-colors flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <span className="filter-ui-count">
              {count}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUp className="text-muted w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="text-muted w-3.5 h-3.5" />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// Multi-checkbox list

function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length)
    return (
      <p className="text-muted text-xs italic">No options available</p>
    );
  return (
    <ul className="space-y-1.5">
      {options.map((opt) => (
        <li key={opt}>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-3.5 h-3.5 accent-[color:var(--text-heading)] rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
            <span className="text-sm text-body group-hover:text-heading transition-colors capitalize">
              {opt}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function SustainabilityButtons({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "px-3 py-1.5 text-xs rounded-sm border transition-all font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          selected === null
            ? "bg-accent1 border-accent1 text-heading"
            : "bg-white text-body border-[color:var(--border-muted)] hover:border-[color:var(--border-strong)]",
        )}
      >
        Any
      </button>
      {SUSTAINABILITY_THRESHOLDS.map((threshold) => (
        <button
          key={threshold}
          type="button"
          onClick={() => onSelect(selected === threshold ? null : threshold)}
          className={clsx(
            "px-3 py-1.5 text-xs rounded-sm border transition-all font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selected === threshold
              ? "bg-accent1 border-accent1 text-heading"
              : "bg-white text-body border-[color:var(--border-muted)] hover:border-[color:var(--border-strong)]",
          )}
        >
          &gt;= {threshold}
        </button>
      ))}
    </div>
  );
}

// Feature toggle

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
      <span className="text-sm text-body">{label}</span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative w-9 h-5 rounded-full transition-colors flex items-center shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-accent1" : "bg-[color:var(--surface-hover)]",
        )}
      >
        <span
          className={clsx(
            "absolute w-3.5 h-3.5 bg-white rounded-full shadow transition-all",
            checked ? "left-[18px]" : "left-[3px]",
          )}
        />
      </button>
    </label>
  );
}

// Product card

function ProductCard({
  product,
  categoryId,
  categoryName,
  contextQueryString,
}: {
  product: FlatProduct;
  categoryId: string;
  categoryName: string;
  contextQueryString: string;
}) {
  const addItem = useQuoteCart((state) => state.addItem);
  const compareItems = useProductCompare((state) => state.items);
  const toggleCompareItem = useProductCompare((state) => state.toggleItem);
  const imageCandidates = buildImageCandidates(product);
  const [imgIndex, setImgIndex] = useState(0);
  const imgSrc =
    imageCandidates[imgIndex] ||
    imageCandidates[0] ||
    "/images/fallback/category.svg";
  const displayName = sanitizeDisplayText(product.name);
  const ecoScore = product.metadata?.sustainabilityScore || 0;
  const routeKey = getProductRouteKey(product);
  const compareId = `compare-${categoryId}-${routeKey}`;
  const inCompare = compareItems.some((item) => item.id === compareId);
  const baseHref = `/products/${categoryId}/${routeKey}`;
  const productHref = contextQueryString
    ? `${baseHref}?from=${encodeURIComponent(contextQueryString)}`
    : baseHref;
  const imageAlt =
    product.altText ||
    (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
    (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
    fallbackAltText(displayName, categoryName);
  const categoryLabel = toInlineSpec(categoryName, 40);
  const dimensions = getDisplayDimensions(product);
  const materials = getDisplayMaterials(product);
  const useCase = getDisplayUseCase(product);
  const productSignals = getProductSignals(product);
  const description = sanitizeDisplayText(product.description || "");
  const factRows = [
    { label: "Series", value: sanitizeDisplayText(product.seriesName) },
    { label: "Use", value: useCase },
    { label: "Dimensions", value: dimensions },
    { label: "Materials", value: materials },
  ].filter((row) => row.value);

  return (
    <article className="catalog-card group">
        <button
          type="button"
          onClick={() => {
            trackCompareToggled({
              pathname: window.location.pathname,
              surface: "category-grid-card",
              categoryId,
              productId: routeKey,
              nextState: inCompare ? "removed" : "added",
            });
            toggleCompareItem({
              id: compareId,
              productUrlKey: routeKey,
              categoryId,
              name: displayName,
              image: imgSrc,
              href: productHref,
            });
          }}
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        className={clsx(
          "catalog-card__compare",
          inCompare
            ? "catalog-card__compare--active"
            : "catalog-card__compare--idle",
        )}
      >
        <GitCompareArrows className="h-3 w-3" />
        {inCompare ? "Compared" : "Compare"}
      </button>

      <Link href={productHref} className="block">
        <div className="catalog-card__media">
          <Image
            src={imgSrc}
            alt={imageAlt}
            loading="lazy"
            width={1200}
            height={900}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="h-full w-full object-contain p-4 sm:p-5 transition-transform duration-500 group-hover:scale-[1.02]"
            onError={() =>
              setImgIndex((current) =>
                current + 1 < imageCandidates.length ? current + 1 : current,
              )
            }
          />
          <div className="catalog-card__badge-row">
            {product.metadata?.bifmaCertified ? (
              <span className="catalog-card__badge">BIFMA</span>
            ) : null}
            {ecoScore > 0 ? (
              <span className="catalog-card__badge">Eco {ecoScore}/10</span>
            ) : null}
          </div>
        </div>
        <div className="catalog-card__body">
          <div className="catalog-card__topline">
            <p className="catalog-card__eyebrow">
              {categoryLabel}
            </p>
            {product.metadata?.bifmaCertified ? (
              <span className="catalog-card__pill">BIFMA</span>
            ) : null}
          </div>
          <div className="space-y-2.5">
            <h3 className="catalog-card__title">
              {displayName}
            </h3>
            {description ? (
              <p className="catalog-card__description line-clamp-3">
                {description}
              </p>
            ) : null}
          </div>
          <div className="catalog-card__signal-row" aria-hidden={productSignals.length === 0 || undefined}>
            {productSignals.map((signal) => (
              <span key={signal} className="catalog-card__signal">
                {signal}
              </span>
            ))}
          </div>
          <div className="catalog-card__fact-grid">
            {factRows.map((row) => (
              <div key={row.label} className="catalog-card__fact">
                <span className="catalog-card__fact-label">{row.label}</span>
                <span className="catalog-card__fact-value">{row.value}</span>
              </div>
            ))}
          </div>
          <div className="catalog-card__actions">
            <span className="catalog-card__link">
              Open specs
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </Link>
      <div className="px-5 pb-5 pt-0">
          <button
            type="button"
            onClick={() => {
              trackQuoteCartAdded({
                pathname: window.location.pathname,
                surface: "category-grid-card",
                productId: routeKey,
              });
              addItem({
                id: `quote-${product.slug || product.id}`,
                name: displayName,
                image: imgSrc,
                href: productHref,
                qty: 1,
              });
            }}
            className="btn-outline w-full text-xs"
          >
          <ShoppingCart className="h-3.5 w-3.5" />
          Add to Quote
        </button>
      </div>
    </article>
  );
}

// Active filter chips

function ActiveChips({
  filters,
  onRemove,
  onClearAll,
  total,
}: {
  filters: ActiveFilters;
  onRemove: (key: string, value?: string | number) => void;
  onClearAll: () => void;
  total: number;
}) {
  if (total === 0) return null;
  const chips: { label: string; key: string; value?: string | number }[] = [];
  if (filters.query.trim()) {
    chips.push({
      label: `${CATEGORY_ROUTE_COPY.activeSearchLabel}: ${filters.query.trim()}`,
      key: "query",
      value: filters.query.trim(),
    });
  }
  if (filters.series !== "all")
    chips.push({ label: `Series: ${filters.series}`, key: "series" });
  filters.subcategory.forEach((v) =>
    chips.push({ label: `Subcategory: ${v}`, key: "subcategory", value: v }),
  );
  filters.priceRange.forEach((v) =>
    chips.push({ label: `Price: ${v}`, key: "priceRange", value: v }),
  );
  filters.material.forEach((v) =>
    chips.push({ label: v, key: "material", value: v }),
  );
  if (filters.hasHeadrest)
    chips.push({ label: "With headrest", key: "hasHeadrest" });
  if (filters.isHeightAdjustable)
    chips.push({ label: "Height adjustable", key: "isHeightAdjustable" });
  if (filters.bifmaCertified)
    chips.push({ label: "BIFMA certified", key: "bifmaCertified" });
  if (filters.isStackable)
    chips.push({ label: "Stackable", key: "isStackable" });
  if (typeof filters.ecoMin === "number")
    chips.push({ label: `Eco >= ${filters.ecoMin}`, key: "ecoMin", value: filters.ecoMin });

  return (
    <div className="border-b border-[color:var(--border-soft)] py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="filter-ui-label">
          {CATEGORY_ROUTE_COPY.activeFiltersLabel}
        </span>
        <span className="text-xs text-muted">
          {CATEGORY_ROUTE_COPY.activeCountLabel.replace("{count}", String(total))}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={`${chip.key}-${chip.value ?? ""}`}
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            className="flex items-center gap-1.5 bg-accent1 text-heading text-xs px-2.5 py-1 rounded-sm hover:bg-accent2 transition-colors"
          >
            <span className="capitalize">{chip.label}</span>
            <X className="w-3 h-3" />
          </button>
        ))}
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-muted hover:text-heading underline transition-colors ml-1"
        >
          {CATEGORY_ROUTE_COPY.clearFiltersCta}
        </button>
      </div>
    </div>
  );
}

// Inner component using useSearchParams

function AdvancedFilterGridInner({
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
    () =>
      shouldUseFallbackData
        ? (data?.products ?? fallbackProducts)
        : [],
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
    (
      key: "subcategory" | "priceRange" | "material",
      value: string,
    ) => {
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
      if (
        key === "subcategory" ||
        key === "priceRange" ||
        key === "material"
      ) {
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
      ? CATEGORY_ROUTE_COPY.compareActiveLabel.replace(
          "{count}",
          String(compareItems.length),
        )
      : CATEGORY_ROUTE_COPY.compareIdleLabel;
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
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  // Sidebar content shared between desktop and drawer
  const renderSidebarContent = (uiOptions: { showHeaderClearAll: boolean }) => (
    <div className="bg-white border border-[color:var(--border-muted)] rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[color:var(--border-soft)] flex items-center justify-between">
        <span className="typ-label text-muted flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="filter-ui-count">
              {activeCount}
            </span>
          )}
        </span>
        {uiOptions.showHeaderClearAll && activeCount > 0 && (
          <button
            onClick={clearAll}
            className="typ-label text-primary hover:text-primary-hover transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Series */}
      {options.series.length > 1 && (
        <AccordionSection
          title="Series"
          count={filters.series !== "all" ? 1 : 0}
          defaultOpen
        >
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => updateFilters({ series: "all" })}
              className={clsx(
                "w-full text-left text-sm py-1.5 px-2 rounded-sm transition-colors",
                filters.series === "all"
                  ? "bg-accent1 text-heading font-normal"
                  : "text-body hover:bg-[color:var(--surface-soft)]",
              )}
            >
              All Series
            </button>
            {options.series.map((seriesName) => (
              <button
                key={seriesName}
                type="button"
                onClick={() => updateFilters({ series: seriesName })}
                className={clsx(
                  "w-full text-left text-sm py-1.5 px-2 rounded-sm transition-colors",
                  filters.series === seriesName
                    ? "bg-accent1 text-heading font-normal"
                    : "text-body hover:bg-[color:var(--surface-soft)]",
                )}
              >
                {seriesName}
              </button>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Material */}
      {options.subcategory.length > 0 && (
        <AccordionSection
          title="Subcategory"
          count={filters.subcategory.length}
          defaultOpen={filters.subcategory.length > 0}
        >
          <CheckList
            options={options.subcategory}
            selected={filters.subcategory}
            onToggle={(v) => toggleArray("subcategory", v)}
          />
        </AccordionSection>
      )}

      {options.priceRange.length > 0 && (
        <AccordionSection
          title="Price Range"
          count={filters.priceRange.length}
          defaultOpen={filters.priceRange.length > 0}
        >
          <CheckList
            options={options.priceRange}
            selected={filters.priceRange}
            onToggle={(v) => toggleArray("priceRange", v)}
          />
        </AccordionSection>
      )}

      {options.material.length > 1 && (
        <AccordionSection
          title="Material"
          count={filters.material.length}
          defaultOpen={filters.material.length > 0}
        >
          <CheckList
            options={options.material}
            selected={filters.material}
            onToggle={(v) => toggleArray("material", v)}
          />
        </AccordionSection>
      )}

      <AccordionSection
        title="Sustainability"
        count={typeof filters.ecoMin === "number" ? 1 : 0}
        defaultOpen={typeof filters.ecoMin === "number"}
      >
        <SustainabilityButtons
          selected={filters.ecoMin}
          onSelect={(ecoMin) => updateFilters({ ecoMin })}
        />
      </AccordionSection>

      {/* Feature Toggles */}
      {showFeatureFilters && (
        <AccordionSection
          title="Features"
          count={
            (filters.hasHeadrest ? 1 : 0) +
            (filters.isHeightAdjustable ? 1 : 0) +
            (filters.bifmaCertified ? 1 : 0) +
            (filters.isStackable ? 1 : 0)
          }
        >
          <div className="space-y-1">
            {options.featureAvailability.hasHeadrest && (
              <Toggle
                label="With Headrest"
                checked={filters.hasHeadrest}
                onChange={(v) => updateFilters({ hasHeadrest: v })}
              />
            )}
            {options.featureAvailability.isHeightAdjustable && (
              <Toggle
                label="Height Adjustable"
                checked={filters.isHeightAdjustable}
                onChange={(v) => updateFilters({ isHeightAdjustable: v })}
              />
            )}
            {options.featureAvailability.bifmaCertified && (
              <Toggle
                label="BIFMA Certified"
                checked={filters.bifmaCertified}
                onChange={(v) => updateFilters({ bifmaCertified: v })}
              />
            )}
            {options.featureAvailability.isStackable && (
              <Toggle
                label="Stackable"
                checked={filters.isStackable}
                onChange={(v) => updateFilters({ isStackable: v })}
              />
            )}
          </div>
        </AccordionSection>
      )}

    </div>
  );

  return (
    <section
      className="w-full bg-[color:var(--surface-soft)]"
      aria-label={`${category.name} product catalog`}
    >
      <div className="w-full border-b border-[color:var(--border-muted)] bg-[color:var(--surface-soft)]">
        <div className="container-wide flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-body">
            <Link
              href="/products"
              className="font-medium text-strong transition-colors hover:text-primary"
            >
              {CATEGORY_ROUTE_COPY.browseAllCta}
            </Link>
            <span className="text-subtle hidden md:inline">/</span>
            <span>{allProducts} products in this category</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
              <Link href="/downloads" className="btn-outline text-xs">
                {CATEGORY_ROUTE_COPY.resourceDeskCta}
              </Link>
              {compareItems.length > 0 ? (
                <Link
                  href={compareHref}
                  className="btn-outline text-xs"
                  onClick={() =>
                    trackSiteCtaClick({
                      href: compareHref,
                      label: compareLabel,
                      pathname: pathname || "",
                      surface: "category-toolbar",
                    })
                  }
                >
                  {compareLabel}
                </Link>
              ) : (
                <p className="text-xs text-muted">
                  {compareLabel}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Top toolbar */}
      <div className="w-full bg-white border-b border-[color:var(--border-muted)] sticky top-16 z-20">
        <div className="container-wide py-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="typ-label text-muted">{CATEGORY_ROUTE_COPY.filterSummaryTitle}</p>
              <p className="mt-1 text-sm text-body">
                {CATEGORY_ROUTE_COPY.filterSummaryDescription}
              </p>
            </div>
            <p className="text-xs font-medium text-muted">
              {CATEGORY_ROUTE_COPY.resultsSummaryLabel
                .replace("{shown}", String(navigableProducts.length))
                .replace("{total}", String(allProducts))}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Mobile filter button */}
            <button
              ref={drawerOpenButtonRef}
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-2 h-10 px-3 bg-white border border-[color:var(--border-muted)] rounded-sm text-sm text-strong hover:border-[color:var(--border-strong)] transition-colors shrink-0"
              aria-label="Open filters"
              aria-expanded={drawerOpen}
              aria-controls="mobile-filter-drawer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeCount > 0 && (
                <span className="filter-ui-count">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1 w-full">
              <SearchIcon className="text-muted absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder={`Search ${category.name.toLowerCase()}...`}
                aria-label={`Search ${category.name}`}
                className="w-full h-10 pl-9 pr-8 bg-white border border-[color:var(--border-muted)] rounded-sm text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:border-primary transition-colors"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Clear search"
                >
                  <X className="text-muted hover:text-strong w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Count + Sort */}
            <div className="flex items-center gap-3 shrink-0">
              <span
                aria-live="polite"
                aria-atomic="true"
                className="text-xs text-muted font-medium whitespace-nowrap"
              >
                {isInitialFilteredLoad
                  ? "Filtering products..."
                  : CATEGORY_ROUTE_COPY.resultsSummaryLabel
                      .replace("{shown}", String(navigableProducts.length))
                      .replace("{total}", String(allProducts))}
              </span>
              <select
                aria-label="Sort products"
                className="h-10 px-3 bg-white border border-[color:var(--border-muted)] rounded-sm text-sm text-strong focus:outline-none focus:border-[color:var(--border-strong)]"
                value={filters.sort}
                onChange={(e) =>
                  updateFilters({ sort: e.target.value as SortOption })
                }
              >
                <option value="az">Name A-Z</option>
                <option value="za">Name Z-A</option>
                <option value="ecoDesc">Eco Score High-Low</option>
                <option value="ecoAsc">Eco Score Low-High</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          <ActiveChips
            filters={effectiveFilters}
            onRemove={removeChip}
            onClearAll={clearAll}
            total={activeCount}
          />
          {isFetching && (
            <p className="text-muted pt-2 text-xs">Refreshing products...</p>
          )}
          {error && (
            <p className="pt-2 text-xs text-red-600">
              {CATEGORY_ROUTE_COPY.filterFallbackMessage}
            </p>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="container-wide py-8 flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 self-start sticky top-32">
          {renderSidebarContent({ showHeaderClearAll: true })}
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {isLoading && filteredProducts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="h-[24rem] rounded-sm border border-[color:var(--border-soft)] bg-white animate-pulse"
                />
              ))}
            </div>
          ) : navigableProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-12 h-12 rounded-full bg-[color:var(--surface-muted)] flex items-center justify-center mb-4">
                <SearchIcon className="text-muted w-5 h-5" />
              </div>
              <p className="mb-1 text-base font-normal text-strong">
                {CATEGORY_ROUTE_COPY.emptyTitle}
              </p>
              <p className="text-muted text-sm mb-4">
                {CATEGORY_ROUTE_COPY.emptyDescription}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={clearAll}
                  className="btn-outline text-sm"
                >
                  {CATEGORY_ROUTE_COPY.emptyPrimaryCta}
                </button>
                <Link href="/products" className="btn-outline text-sm">
                  {CATEGORY_ROUTE_COPY.emptySecondaryCta}
                </Link>
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
              style={
                shouldUseContentVisibility
                  ? {
                      contentVisibility: "auto",
                      containIntrinsicSize: `auto ${gridIntrinsicBlockSizePx}px`,
                    }
                  : undefined
              }
            >
              {navigableProducts.map((product) => (
                <div
                  key={getProductRouteKey(product)}
                  className={clsx(
                    "transition-all duration-300",
                    !shouldUseContentVisibility && "animate-fadein",
                  )}
                >
                  <ProductCard
                    product={product}
                    categoryId={categoryId}
                    categoryName={category.name}
                    contextQueryString={filterQueryString}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            ref={drawerRef}
            id="mobile-filter-drawer"
            tabIndex={-1}
            className="fixed inset-y-0 left-0 z-[65] flex w-[88vw] max-w-sm flex-col overflow-y-auto bg-[color:var(--surface-soft)] shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Filter products"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-[color:var(--border-muted)] bg-white">
              <span className="text-sm font-normal text-heading flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {activeCount > 0 && (
                  <span className="filter-ui-count">
                    {activeCount}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="min-h-11 min-w-11 inline-flex items-center justify-center"
              >
                <X className="w-5 h-5 text-muted hover:text-heading" />
              </button>
            </div>
            <div className="p-4">{renderSidebarContent({ showHeaderClearAll: false })}</div>
            <div className="sticky bottom-0 relative bg-white border-t border-[color:var(--border-soft)] p-4 flex gap-2">
              <div className="absolute left-4 top-0 -translate-y-full rounded-t-md bg-white/95 px-3 py-2 text-xs text-muted shadow-sm">
                {CATEGORY_ROUTE_COPY.drawerResultsHint}
              </div>
              {activeCount > 0 && (
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
              )}
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
        </>
      )}
      <CompareDock />
    </section>
  );
}

// Exported wrapper with Suspense for useSearchParams

export function FilterGrid({
  category,
  categoryId,
}: {
  category: Category;
  categoryId: string;
}) {
  return (
    <Suspense
      fallback={
        <div className="text-muted w-full h-64 flex items-center justify-center text-sm">
          Loading products...
        </div>
      }
    >
      <AdvancedFilterGridInner category={category} categoryId={categoryId} />
    </Suspense>
  );
}
