"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import type {
  CompatProduct as Product,
  ProductVariant,
} from '@/features/catalog/getProducts';
import {
  ArrowLeft,
  ChevronRight,
  Share2,
  ShoppingCart,
  GitCompareArrows,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { Reviews } from "@/components/Reviews";
import { ProductGallery } from "@/components/ProductGallery";
import { loadModelViewer } from "@/lib/ui/loadModelViewer";
import {
  MODEL_VIEWER_DRACO,
  MODEL_VIEWER_KTX2,
  resolveModelViewerDecoderUrls,
} from "@/lib/ui/selfHostedAssetUrls";
import { useQuoteCart } from "@/lib/store/quoteCart";
import { useProductCompare } from "@/lib/store/productCompare";
import { CompareDock } from "@/components/products/CompareDock";
import {
  createAnonymousUserId,
  normalizeAnonymousUserId,
} from "@/lib/tracking/anonymousUserId";
import {
  sanitizeDisplayText as normalizeDisplayText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import {
  buildFilterParams,
  parseFiltersFromSearchParams,
} from '@/features/catalog/filters';
import {
  trackCompareToggled,
  trackQuoteCartAdded,
  trackSiteCtaClick,
} from "@/lib/analytics/siteEvents";
import { PDP_ROUTE_COPY } from "@/lib/site-data/routeCopy";

interface ProductViewerProps {
  product: Product;
  categoryRoute: string;
  categoryId?: string;
  categoryName: string;
  productRoute: string;
}

const LazyThreeViewer = dynamic(() => import("@/components/ThreeViewer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-soft">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
    </div>
  ),
});

export function sanitizeDisplayText(value: string): string {
  return String(value || "")
    .replace(/[\uFFFD]+/g, "")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€\u009d|â€"/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtmlAttribute(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeDisplayList(values: string[]): string[] {
  return values.map((item) => normalizeDisplayText(item)).filter(Boolean);
}

const ModelViewer = "model-viewer" as unknown as React.ComponentType<{
  src: string;
  ar?: boolean;
  "ios-src"?: string;
  "camera-controls"?: boolean;
  "shadow-intensity"?: string;
  "draco-decoder-location"?: string;
  "ktx2-transcoder-location"?: string;
  alt?: string;
  style?: React.CSSProperties;
}>;

export function ProductViewer({
  product,
  categoryRoute,
  categoryId,
  categoryName,
  productRoute,
}: ProductViewerProps) {
  const addItem = useQuoteCart((state) => state.addItem);
  const compareItems = useProductCompare((state) => state.items);
  const toggleCompareItem = useProductCompare((state) => state.toggleItem);
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";
  const cleanName = (raw: string) => {
    if (!raw) return raw;
    const m = raw.match(/^([A-Z][a-z]+(?:[- ][A-Z][a-z0-9]*)?)\1/);
    if (m && m[1]) return m[1];
    if (raw.length > 30 && !raw.includes(" ")) {
      const cap = raw.match(/^[A-Z][a-z]+/);
      if (cap) return cap[0];
    }
    return raw;
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : null,
  );
  const displayName = cleanName(normalizeDisplayText(product.name));

  const modelPath =
    selectedVariant?.threeDModelUrl ||
    product["3d_model"] ||
    product.threeDModelUrl ||
    "";
  const hasModelPath = modelPath.length > 0;

  const allImages = [
    ...(product.images || []),
    product.flagshipImage,
    ...(selectedVariant?.galleryImages || []),
    ...(product.sceneImages || []),
  ].filter(Boolean) as string[];

  const uniqueImages = Array.from(new Set(allImages));
  const _swatchFallbackImage =
    product.flagshipImage ||
    product.images?.find(Boolean) ||
    product.sceneImages?.find(Boolean) ||
    uniqueImages[0] ||
    "";
  const productImageAlt =
    (product as unknown as { altText?: string }).altText ||
    (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
    (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
    `Product image of ${displayName} in ${categoryName} category`;
  const metadataRecord = product.metadata as Record<string, unknown> | undefined;

  useEffect(() => {
    // Basic anonymous tracking for recommendations
    let userId = normalizeAnonymousUserId(localStorage.getItem("oando_user_id"));
    if (!userId) {
      userId = createAnonymousUserId();
      localStorage.setItem("oando_user_id", userId);
    }

    fetch("/api/tracking/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: product.id }),
    }).catch(console.error);
  }, [product.id]);

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // When variants change, uniqueImages will update which resets the ProductGallery index implicitly
  };

  const [is3DMode, setIs3DMode] = useState(false);
  const [isModelAvailable, setIsModelAvailable] = useState(false);
  const [isCheckingModel, setIsCheckingModel] = useState(false);
  const [isModelViewerReady, setIsModelViewerReady] = useState(false);
  const [modelViewerDecoderDirs, setModelViewerDecoderDirs] = useState<{
    draco: string;
    ktx2: string;
  }>({
    draco: MODEL_VIEWER_DRACO.localDir,
    ktx2: MODEL_VIEWER_KTX2.localDir,
  });

  useEffect(() => {
    let cancelled = false;

    if (!hasModelPath) {
      Promise.resolve().then(() => {
        setIsModelAvailable(false);
        setIsCheckingModel(false);
        setIs3DMode(false);
      });
      return;
    }

    const validateModel = async () => {
      // Optimistically allow 3D so we do not block valid models on strict HEAD failures.
      setIsModelAvailable(true);
      setIsCheckingModel(true);
      try {
        const response = await fetch(modelPath, { method: "HEAD" });
        if (!cancelled) {
          const missing = response.status === 404;
          setIsModelAvailable(!missing);
          if (missing) setIs3DMode(false);
        }
      } catch {
        if (!cancelled) {
          // Keep 3D enabled on network/head-check exceptions; runtime viewer can still load.
          setIsModelAvailable(true);
        }
      } finally {
        if (!cancelled) setIsCheckingModel(false);
      }
    };

    validateModel();
    return () => {
      cancelled = true;
    };
  }, [hasModelPath, modelPath]);

  useEffect(() => {
    if (!is3DMode || !isModelAvailable) return;
    if (typeof window === "undefined" || typeof customElements === "undefined") return;

    let cancelled = false;

    const prepareModelViewer = async () => {
      const [decoderDirs] = await Promise.all([
        resolveModelViewerDecoderUrls(),
        customElements.get("model-viewer") ? Promise.resolve() : loadModelViewer(),
      ]);

      if (cancelled) return;

      setModelViewerDecoderDirs({
        draco: decoderDirs.dracoDir,
        ktx2: decoderDirs.ktx2Dir,
      });
      setIsModelViewerReady(true);
    };

    void prepareModelViewer().catch(() => {
      if (!cancelled) setIsModelViewerReady(false);
    });

    return () => {
      cancelled = true;
    };
  }, [is3DMode, isModelAvailable]);

  const toText = (value: unknown): string => {
    if (typeof value === "string") return normalizeDisplayText(value);
    if (typeof value === "number") return String(value);
    return "";
  };
  const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return sanitizeDisplayList(value.map((item) => String(item)));
  };
  const routeKey = (product.slug || product.id || "").trim();
  const compareId = `compare-${categoryId || "products"}-${routeKey}`;
  const inCompare = compareItems.some((item) => item.id === compareId);
  const rawFrom = searchParams.get("from");
  const normalizedFrom = rawFrom?.trim().replace(/^\?/, "").slice(0, 1500) || "";
  const parsedFrom = normalizedFrom
    ? buildFilterParams(
        parseFiltersFromSearchParams(new URLSearchParams(normalizedFrom)),
      ).toString()
    : "";
  const encodedFrom = parsedFrom ? encodeURIComponent(parsedFrom) : "";
  const categoryRouteWithContext = parsedFrom
    ? `${categoryRoute}?${parsedFrom}`
    : categoryRoute;
  const productRouteWithContext = encodedFrom
    ? `${productRoute}?from=${encodedFrom}`
    : productRoute;

  const rawSpecs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};

  const overview = normalizeDisplayText(
    product.detailedInfo?.overview || product.description || "",
  );
  const dimensions = filterMeaningfulDimensionText(
    toText(rawSpecs.dimensions) ||
      toText(rawSpecs.dimension) ||
      product.detailedInfo?.dimensions ||
      "",
  );
  const specMaterials = filterMeaningfulMaterialList(toStringList(rawSpecs.materials));
  const finishOptions = toStringList(rawSpecs.finish_options);
  const primaryMaterials = filterMeaningfulMaterialList(
    sanitizeDisplayList(product.detailedInfo?.materials?.filter(Boolean) || []),
  );
  const materials =
    specMaterials.length > 0
      ? specMaterials
      : primaryMaterials.length > 0
        ? primaryMaterials
        : [];
  const features = sanitizeDisplayList(
    product.detailedInfo?.features?.filter(
      (f: string) => f && f !== "MANUFACTURING" && f !== "Sustainability",
    ) || [],
  );
  const useCases = sanitizeDisplayList(
    Array.isArray(product.metadata?.useCase)
      ? product.metadata.useCase
      : toStringList(rawSpecs.use_case),
  );
  const warrantyYears = product.metadata?.warrantyYears;
  const warrantyRaw = toText(rawSpecs.warranty_text);
  const warrantyText = warrantyYears
    ? `${warrantyYears}-Year Warranty`
    : warrantyRaw;
  const certifications = sanitizeDisplayList([
    ...toStringList(rawSpecs.certifications),
    ...toStringList(metadataRecord?.certifications),
    ...(product.metadata?.bifmaCertified ? ["BIFMA Certified"] : []),
  ]);
  const certificationText = certifications.join(", ");
  const sustainabilityText =
    typeof product.metadata?.sustainabilityScore === "number"
      ? `Eco Score ${product.metadata.sustainabilityScore}/10`
      : toText(rawSpecs.sustainability_text);
  const quickConfig =
    toText(rawSpecs.configuration) ||
    toText(rawSpecs.type);
  const shortOverview = (() => {
    if (!overview) return "";
    const clean = overview.replace(/\s+/g, " ").trim();
    const sentenceMatch = clean.match(/^[^.!?]+[.!?]\s*[^.!?]*[.!?]?/);
    if (sentenceMatch?.[0]) return sentenceMatch[0].trim();
    return clean.length > 180 ? `${clean.slice(0, 180).trim()}...` : clean;
  })();
  const fullOverview =
    overview && shortOverview && overview !== shortOverview ? overview : "";
  const specRows = [
    { label: "Dimensions", value: dimensions },
    ...(materials.length > 0
      ? [
          {
            label: "Materials",
            value: materials.slice(0, 3).join(", "),
          },
        ]
      : []),
    ...(finishOptions.length > 0
      ? [
          {
            label: "Finish Options",
            value: finishOptions.slice(0, 3).join(", "),
          },
        ]
      : []),
    { label: "Warranty", value: warrantyText },
    { label: "Certification", value: certificationText },
    { label: "Configuration", value: quickConfig },
    {
      label: "Use Case",
      value: useCases.length > 0 ? useCases.slice(0, 3).join(", ") : "",
    },
    { label: "Sustainability", value: sustainabilityText },
  ].filter((row) => row.value);
  const formatSpecLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const toSpecText = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return sanitizeDisplayList(value.map((v) => String(v))).join(", ");
    if (typeof value === "object") return "";
    return normalizeDisplayText(String(value));
  };
  const inlineSpecs = (() => {
    const entries: Array<{ label: string; value: string }> = [];
    const seen = new Set<string>();
    const blocked = new Set([
      "category",
      "subcategory",
      "dimensions",
      "materials",
      "finish_options",
      "features",
      "documents",
      "document_titles",
      "certifications",
      "warranty_text",
      "warranty_years",
      "bifma_certified",
      "price_range",
      "overview_sections",
      "dimension_sections",
      "sustainability_text",
      "sustainability_score",
    ]);

    const addEntriesFromObject = (source: unknown) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) return;
      for (const [rawKey, rawValue] of Object.entries(
        source as Record<string, unknown>,
      )) {
        const key = rawKey.toLowerCase();
        if (blocked.has(key) || seen.has(key)) continue;
        const value = toSpecText(rawValue);
        if (!value) continue;
        entries.push({ label: formatSpecLabel(rawKey), value });
        seen.add(key);
      }
    };

    addEntriesFromObject(product.specs);
    addEntriesFromObject(
      metadataRecord?.specifications,
    );
    return entries.slice(0, 16);
  })();

  const hasReturnContext = Boolean(parsedFrom);
  const returnLabel = hasReturnContext
    ? PDP_ROUTE_COPY.ctas.returnToResults
    : PDP_ROUTE_COPY.ctas.returnToCategory;
  const useCasePreview = useCases.slice(0, 4);
  const materialPreview = materials.slice(0, 3).join(", ");
  const finishPreview = finishOptions.slice(0, 3).join(", ");
  const summaryCards = [
    { label: PDP_ROUTE_COPY.summary.bestFor, value: useCasePreview.join(", ") },
    { label: PDP_ROUTE_COPY.ctas.configuration, value: quickConfig },
    { label: PDP_ROUTE_COPY.summary.dimensions, value: dimensions },
    {
      label:
        materials.length > 0
          ? PDP_ROUTE_COPY.summary.materials
          : finishOptions.length > 0
            ? "Finish Options"
            : PDP_ROUTE_COPY.summary.materials,
      value: materials.length > 0 ? materialPreview : finishPreview,
    },
  ].filter((card) => card.value);
  const primarySummaryCards = summaryCards.slice(0, 3);
  const secondarySummaryCards = summaryCards.slice(3);
  const assuranceCards = [
    warrantyText ? { label: "Warranty", value: warrantyText } : null,
    certificationText ? { label: "Certification", value: certificationText } : null,
    sustainabilityText ? { label: "Sustainability", value: sustainabilityText } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const handleAddToQuote = () => {
    trackQuoteCartAdded({
      pathname,
      surface: "pdp",
      productId: routeKey,
    });
    addItem({
      id: `quote-${product.slug || product.id}`,
      name: displayName,
      image: uniqueImages[0],
      href: productRouteWithContext,
      qty: 1,
    });
  };
  const handleCompareToggle = () => {
    trackCompareToggled({
      pathname,
      surface: "pdp",
      categoryId: categoryId || "products",
      productId: routeKey,
      nextState: inCompare ? "removed" : "added",
    });
    toggleCompareItem({
      id: compareId,
      productUrlKey: routeKey,
      categoryId: categoryId || "products",
      name: displayName,
      image: uniqueImages[0],
      href: productRouteWithContext,
    });
  };

  return (
    <section className="pdp-page scheme-page min-h-screen pb-24 pt-24 sm:pb-28">
      {/* Breadcrumb bar */}
      <div className="border-b border-theme-soft bg-panel/88 backdrop-blur-xl">
        <div className="pdp-breadcrumb home-shell-xl flex min-h-11 items-center gap-1.5 py-2">
          <Link
            href="/products"
            className="hover:text-strong transition-colors"
          >
            Products
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={categoryRouteWithContext}
            className="hover:text-strong transition-colors"
          >
            {categoryName}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-strong font-semibold">
            {displayName}
          </span>
        </div>
      </div>

      <div className="home-shell-xl pt-6 lg:pt-8">
        <div className="pdp-shell-grid">
        {/* Left: image gallery */}
          <div className="pdp-media-pane">
            <div className="pdp-media-stack">
          <div className="pdp-media-card">
            <ProductGallery
              images={uniqueImages}
              productName={displayName}
            />
          </div>
          {/* 3D viewer toggle wrapper */}
          {hasModelPath && (
            <div className="pdp-viewer-panel group">
              <div className="absolute left-5 top-5 z-20 flex items-center gap-3">
                <span className="pdp-card-label text-muted">
                  3D Viewer
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isModelAvailable) return;
                    if (!is3DMode) setIsModelViewerReady(false);
                    setIs3DMode((prev) => !prev);
                  }}
                  aria-pressed={is3DMode}
                  disabled={!isModelAvailable}
                  className={clsx(
                    "pdp-chip pdp-chip--viewer-toggle bg-panel/90 px-3 py-1.5 backdrop-blur focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isModelAvailable
                      ? "text-strong hover:bg-inverse hover:text-inverse transition-colors"
                      : "text-subtle cursor-not-allowed",
                  )}
                >
                  {is3DMode ? PDP_ROUTE_COPY.ctas.viewImage : PDP_ROUTE_COPY.ctas.view3d}
                </button>
              </div>
              {!isModelAvailable && !isCheckingModel && (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                  <p className="typ-overline text-muted">
                    {PDP_ROUTE_COPY.ctas.modelUnavailable}
                  </p>
                </div>
              )}
              {isCheckingModel && (
                <div className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center">
                  <p className="typ-overline text-muted">
                    {PDP_ROUTE_COPY.ctas.modelChecking}
                  </p>
                </div>
              )}

              {is3DMode && isModelAvailable ? (
                <div className="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-transparent">
                  <div className="hidden h-full w-full md:block">
                    <LazyThreeViewer
                      modelUrl={modelPath}
                      fallback={
                        <Image
                          src={uniqueImages[0]}
                          alt={productImageAlt}
                          width={1200}
                          height={900}
                          className="w-full h-full object-contain"
                        />
                      }
                    />
                  </div>
                  <div className="block h-full w-full md:hidden">
                    {isModelViewerReady ? (
                      <ModelViewer
                        src={modelPath}
                        ar
                        ios-src={modelPath.replace(".glb", ".usdz")}
                        camera-controls
                        shadow-intensity="1"
                        draco-decoder-location={modelViewerDecoderDirs.draco}
                        ktx2-transcoder-location={modelViewerDecoderDirs.ktx2}
                        alt={`3D model of ${displayName}`}
                        style={{ width: "100%", height: "100%" }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-soft">
                        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                !isCheckingModel &&
                isModelAvailable && (
                  <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-soft bg-panel/88 px-4 py-3 text-sm text-muted shadow-sm backdrop-blur">
                    Toggle into the interactive model to inspect the chair from all sides.
                  </div>
                )
              )}
            </div>
          )}
        </div>
          </div>

        {/* Right: details panel */}
          <div className="pdp-detail-pane">
          <div className="pdp-detail-shell">
            {/* Title block */}
            <div className="pdp-section">
              <Link
                href={categoryRouteWithContext}
                className="pdp-action-label mb-4 inline-flex items-center gap-2 text-muted transition-all duration-200 hover:text-strong hover:gap-3"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {returnLabel}
              </Link>
              <p className="pdp-section-label mb-3">Collection</p>
              <h1 className="pdp-title mb-5 text-strong">
                {displayName}
              </h1>
              {shortOverview ? (
                <p className="max-w-prose text-sm font-light leading-relaxed text-body sm:text-base">
                  {shortOverview}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2.5">
                {warrantyText ? (
                  <span className="pdp-chip pdp-chip--soft px-2.5 border-l-2 border-l-[var(--color-primary)]">
                    {warrantyText}
                  </span>
                ) : null}
                {product.metadata?.bifmaCertified && (
                  <span className="pdp-chip pdp-chip--solid px-2.5 border-l-2 border-l-[var(--color-ocean-boat-blue-500)]">
                    BIFMA Certified
                  </span>
                )}
                {typeof product.metadata?.sustainabilityScore === "number" && (
                  <span className="pdp-chip pdp-chip--success px-2.5 border-l-2 border-l-[var(--color-accent-green)]">
                    Eco Score {product.metadata.sustainabilityScore}/10
                  </span>
                )}
              </div>
              <div className="pdp-summary-panel mt-7">
                {primarySummaryCards.length > 0 ? (
                  <>
                    <p className="mb-2 text-sm font-semibold text-strong">
                      Project snapshot
                    </p>
                    <p className="mb-4 text-sm leading-relaxed text-muted">
                      Core facts for quick technical and commercial assessment.
                    </p>
                    <div className="pdp-summary-grid">
                      {primarySummaryCards.map((card) => (
                        <div
                          key={card.label}
                          className="pdp-summary-card"
                        >
                          <p className="pdp-card-label mb-1.5">
                            {card.label}
                          </p>
                          <p className="text-sm leading-relaxed text-strong font-medium">
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {secondarySummaryCards.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {secondarySummaryCards.map((card) => (
                      <span
                        key={card.label}
                        className="pdp-inline-pill"
                      >
                        <span className="font-semibold text-strong">
                          {card.label}:
                        </span>{" "}
                        {card.value}
                      </span>
                    ))}
                  </div>
                ) : null}
                {assuranceCards.length > 0 ? (
                  <div className="mt-5 border-t border-soft pt-5">
                    <p className="pdp-card-label mb-3">Verified product facts</p>
                    <div className="pdp-assurance-grid">
                      {assuranceCards.map((item) => (
                        <div
                          key={item.label}
                          className="pdp-assurance-item"
                        >
                          <span className="font-semibold text-strong">
                            {item.label}:
                          </span>{" "}
                          {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Variant swatches */}
            {product.variants && product.variants.length > 0 && (
              <div className="pdp-section pdp-divider">
                <div className="flex items-center justify-between mb-4">
                  <p className="pdp-section-label">
                    {PDP_ROUTE_COPY.ctas.configuration}
                  </p>
                  <span className="text-muted text-xs">
                    {product.variants.length} options
                  </span>
                </div>
                <div className="pdp-variant-grid mb-4">
                  {product.variants.map((variant: ProductVariant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        type="button"
                        key={variant.id}
                        onClick={() => handleVariantChange(variant)}
                        title={variant.variantName}
                        aria-label={`Select ${variant.variantName} variant`}
                        aria-pressed={isSelected}
                        className={clsx(
                          "pdp-swatch-button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isSelected
                            ? "border-strong ring-2 ring-strong ring-offset-2 scale-110"
                            : "border-soft hover:border-muted hover:scale-105",
                        )}
                      >
                        {/* PERF-FIX: replaced raw <img> with next/image */}
                        <Image
                          src={
                            variant.galleryImages?.[0] || product.flagshipImage || ""
                          }
                          alt={`${variant.variantName} finish preview for ${displayName}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover scale-150"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            if (!el.dataset.fallback) {
                              el.dataset.fallback = "1";
                              el.style.visibility = "hidden";
                            }
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-strong">
                      Selected:
                    </span>{" "}
                    {selectedVariant.variantName}
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="pdp-section">
              <div className="pdp-cta-panel">
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-strong">
                    Take the next step
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Add this chair to your shortlist, send a direct enquiry, or move into planning support.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToQuote}
                  className="pdp-cta-primary group mb-2 flex w-full items-center justify-between"
                >
                  <span className="pdp-action-label">
                    {PDP_ROUTE_COPY.ctas.addToQuote}
                  </span>
                  <ShoppingCart className="w-4 h-4" />
                </button>
                {routeKey ? (
                  <button
                    type="button"
                    onClick={handleCompareToggle}
                    className={clsx(
                      "group mb-2 flex w-full items-center justify-between rounded-2xl border px-6 py-4 transition-colors",
                      inCompare
                        ? "border-primary bg-primary text-white hover:bg-primary-hover"
                        : "border-soft text-body hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    <span className="pdp-action-label">
                      {inCompare
                        ? PDP_ROUTE_COPY.ctas.addedToCompare
                        : PDP_ROUTE_COPY.ctas.addToCompare}
                    </span>
                    <GitCompareArrows className="w-4 h-4" />
                  </button>
                ) : null}
                <Link
                  href="/contact"
                  onClick={() =>
                    trackSiteCtaClick({
                      href: "/contact",
                      label: PDP_ROUTE_COPY.ctas.requestQuote,
                      pathname,
                      surface: "pdp",
                    })
                  }
                  className="pdp-cta-secondary group mb-2 flex w-full items-center justify-between"
                >
                  <span className="pdp-action-label">
                    {PDP_ROUTE_COPY.ctas.requestQuote}
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                </Link>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/planning"
                    onClick={() =>
                      trackSiteCtaClick({
                        href: "/planning",
                        label: PDP_ROUTE_COPY.ctas.planning,
                        pathname,
                        surface: "pdp",
                      })
                    }
                    className="pdp-cta-secondary group flex items-center justify-between"
                  >
                    <span className="pdp-action-label">
                      {PDP_ROUTE_COPY.ctas.planning}
                    </span>
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/downloads"
                    onClick={() =>
                      trackSiteCtaClick({
                        href: "/downloads",
                        label: PDP_ROUTE_COPY.ctas.resourceDesk,
                        pathname,
                        surface: "pdp",
                      })
                    }
                    className="pdp-cta-secondary group flex items-center justify-between"
                  >
                    <span className="pdp-action-label">
                      {PDP_ROUTE_COPY.ctas.resourceDesk}
                    </span>
                    <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
                <div className="mt-4 border-t border-soft pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                    aria-label={PDP_ROUTE_COPY.ctas.copyLink}
                    className="pdp-copy-link inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {PDP_ROUTE_COPY.ctas.copyLink}
                  </button>
                  <p className="mt-3 text-xs text-muted">
                    Final commercial terms, lead time, and delivery scope are confirmed before order placement.
                  </p>
                </div>
              </div>
            </div>

            {useCasePreview.length > 0 && (
              <div className="mt-8 border-t border-soft pt-7">
                <h2 className="typ-h3 mb-4 text-strong">
                  {PDP_ROUTE_COPY.summary.useCases}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {useCasePreview.map((useCase) => (
                    <span
                      key={useCase}
                      className="rounded-full border border-soft bg-panel px-3 py-1.5 text-xs font-medium text-body"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="pdp-section pdp-divider">
              <h2 className="typ-h3 mb-4 text-strong">
                {PDP_ROUTE_COPY.ctas.specifications}
              </h2>
              <div className="pdp-spec-table mb-7">
                {specRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`pdp-spec-row ${index % 2 === 0 ? "bg-panel" : "bg-soft/70"}`}
                  >
                    <span className="pdp-card-label w-28 shrink-0 pt-0.5 text-subtle">
                      {row.label}
                    </span>
                    <span className="text-sm leading-relaxed text-strong font-medium">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pdp-details-stack">
                {features.length > 0 && (
                  <details className="pdp-disclosure" open>
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">
                        {PDP_ROUTE_COPY.ctas.keyFeatures}
                      </span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <ul className="grid gap-3">
                        {features.slice(0, 8).map((f: string, i: number) => (
                          <li
                            key={i}
                            className="pdp-feature-item flex min-h-full items-start gap-3 rounded-2xl border border-soft bg-soft px-4 py-3 text-sm leading-relaxed text-body"
                          >
                            <span className="text-subtle mt-0.5 shrink-0">-</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                {inlineSpecs.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">
                        {PDP_ROUTE_COPY.ctas.technicalDetails}
                      </span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="pdp-inline-spec-grid grid gap-3">
                        {inlineSpecs.map((row) => (
                          <div
                            key={row.label}
                            className="rounded-2xl border border-soft bg-panel p-4"
                          >
                            <span className="pdp-card-label mb-2 block">
                              {row.label}
                            </span>
                            <span className="text-sm leading-relaxed text-body">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {fullOverview ? (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Overview</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="rounded-2xl border border-soft bg-soft px-4 py-4 text-sm leading-relaxed text-body">
                        {fullOverview}
                      </div>
                    </div>
                  </details>
                ) : null}

                {materials.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Materials</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="flex flex-wrap gap-2">
                        {materials.map((material) => (
                          <span
                            key={material}
                            className="rounded-full border border-soft bg-soft px-3 py-1.5 text-xs text-body"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {finishOptions.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Finish Options</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="flex flex-wrap gap-2">
                        {finishOptions.map((finish) => (
                          <span
                            key={finish}
                            className="rounded-full border border-soft bg-soft px-3 py-1.5 text-xs text-body"
                          >
                            {finish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="home-shell-xl pb-24 pt-12">
        <Reviews productId={product.id} />
      </div>
      <CompareDock />
    </section>
  );
}

