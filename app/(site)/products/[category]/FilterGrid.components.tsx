"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronUp, GitCompareArrows, ShoppingCart, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import clsx from "clsx";

import { CATEGORY_ROUTE_COPY } from "@/data/site/routeCopy";
import { SUSTAINABILITY_THRESHOLDS, type ActiveFilters } from "@/features/catalog/filters";
import { trackCompareToggled, trackQuoteCartAdded } from "@/lib/analytics/siteEvents";
import { sanitizeDisplayText } from "@/lib/displayText";
import { useProductCompare } from "@/lib/store/productCompare";
import { useQuoteCart } from "@/lib/store/quoteCart";

import {
  buildImageCandidates,
  fallbackAltText,
  type FlatProduct,
  getDisplayDimensions,
  getDisplayMaterials,
  getDisplayUseCase,
  getProductRouteKey,
  getProductSignals,
  toInlineSpec,
} from "./FilterGrid.helpers";

export function AccordionSection({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: ReactNode;
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
          {count !== undefined && count > 0 ? (
            <span className="filter-ui-count">
              {count}
            </span>
          ) : null}
        </span>
        {open ? (
          <ChevronUp className="text-muted w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="text-muted w-3.5 h-3.5" />
        )}
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length) {
    return (
      <p className="text-muted text-xs italic">No options available</p>
    );
  }
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

export function SustainabilityButtons({
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

export function Toggle({
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

export function ProductCard({
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
          {productSignals.length > 0 ? (
            <div className="catalog-card__signal-row" aria-hidden={undefined}>
              {productSignals.slice(0, 3).map((signal) => (
                <span key={signal} className="catalog-card__signal">
                  {signal}
                </span>
              ))}
            </div>
          ) : null}
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

export function ActiveChips({
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
  if (filters.series !== "all") chips.push({ label: `Series: ${filters.series}`, key: "series" });
  filters.subcategory.forEach((v) =>
    chips.push({ label: `Subcategory: ${v}`, key: "subcategory", value: v }),
  );
  filters.priceRange.forEach((v) =>
    chips.push({ label: `Price: ${v}`, key: "priceRange", value: v }),
  );
  filters.material.forEach((v) =>
    chips.push({ label: v, key: "material", value: v }),
  );
  if (filters.hasHeadrest) chips.push({ label: "With headrest", key: "hasHeadrest" });
  if (filters.isHeightAdjustable) chips.push({ label: "Height adjustable", key: "isHeightAdjustable" });
  if (filters.bifmaCertified) chips.push({ label: "BIFMA certified", key: "bifmaCertified" });
  if (filters.isStackable) chips.push({ label: "Stackable", key: "isStackable" });
  if (typeof filters.ecoMin === "number") {
    chips.push({ label: `Eco >= ${filters.ecoMin}`, key: "ecoMin", value: filters.ecoMin });
  }

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
