import Image from "next/image";
import Link from "next/link";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { CompareColumnActions } from "@/components/products/CompareColumnActions";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { getProductByUrlKey, type Product } from '@/features/catalog/getProducts';
import {
  getCatalogCategoryLabel,
  normalizeRequestedCategoryId,
} from '@/features/catalog/categories';
import {
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import { normalizeAssetPath } from "@/lib/assetPaths";
import { COMPARE_ROUTE_COPY } from "@/data/site/routeCopy";

type CompareItem = {
  productUrlKey: string;
  product: Product;
  categoryId: string;
};

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseItemKeys(rawItems: string | string[] | undefined): string[] {
  const joined = Array.isArray(rawItems) ? rawItems.join(",") : rawItems || "";
  return Array.from(
    new Set(
      joined
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

function resolveCategoryId(product: Product): string {
  return normalizeRequestedCategoryId(product.category_id) || "products";
}

function specValue(item: CompareItem, key: string): string {
  const metadata =
    item.product.metadata && typeof item.product.metadata === "object"
      ? (item.product.metadata as Record<string, unknown>)
      : {};
  const specs =
    item.product.specs && typeof item.product.specs === "object" && !Array.isArray(item.product.specs)
      ? (item.product.specs as Record<string, unknown>)
      : {};

  if (key === "category") {
    return getCatalogCategoryLabel(item.categoryId, item.categoryId);
  }
  if (key === "series") {
    return item.product.series_name || "";
  }
  if (key === "dimensions") {
    return filterMeaningfulDimensionText(
      toText(specs.dimensions) || toText(specs.dimension) || "",
    );
  }
  if (key === "materials") {
    const specMaterials = filterMeaningfulMaterialList(toList(specs.materials));
    const metadataMaterials = filterMeaningfulMaterialList(
      Array.isArray(metadata.material) ? metadata.material.map((m) => String(m)) : [],
    );
    const materials = specMaterials.length > 0 ? specMaterials : metadataMaterials;
    return materials.length > 0 ? materials.slice(0, 3).join(", ") : "";
  }
  if (key === "warranty") {
    const warrantyYears =
      typeof metadata.warrantyYears === "number" ? metadata.warrantyYears : null;
    return warrantyYears ? `${warrantyYears}-Year warranty` : "";
  }
  if (key === "certification") {
    const certifications = toList(specs.certifications);
    if (certifications.length > 0) return certifications.slice(0, 3).join(", ");
    return metadata.bifmaCertified ? "BIFMA certified" : "";
  }
  if (key === "sustainability") {
    const score =
      typeof metadata.sustainabilityScore === "number"
        ? metadata.sustainabilityScore
        : typeof specs.sustainability_score === "number"
          ? specs.sustainability_score
          : null;
    return typeof score === "number" ? `Eco score ${score}/10` : "";
  }
  if (key === "features") {
    const features = toList(specs.features);
    return features.length > 0 ? features.slice(0, 3).join(", ") : "";
  }
  return "-";
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keys = parseItemKeys(resolvedSearchParams.items);

  const items = (
    await Promise.all(
      keys.map(async (key) => {
        const product = await getProductByUrlKey(key);
        if (!product) return null;
        const categoryId = resolveCategoryId(product);
        return { productUrlKey: key, product, categoryId } satisfies CompareItem;
      }),
    )
  ).filter((item): item is CompareItem => Boolean(item));

  const allCompareRows = [
    { key: "category", label: "Category" },
    { key: "series", label: "Series" },
    { key: "dimensions", label: "Dimensions" },
    { key: "materials", label: "Materials" },
    { key: "warranty", label: "Warranty" },
    { key: "certification", label: "Certification" },
    { key: "sustainability", label: "Sustainability" },
    { key: "features", label: "Key features" },
  ] as const;

  const compareRows = allCompareRows.filter((row) =>
    row.key === "category" ||
    items.some((item) => specValue(item, row.key).trim().length > 0),
  );

  return (
    <section className="scheme-page min-h-screen bg-page pt-24">
      <div className="container px-6 py-14 2xl:px-0">
        {(() => {
          const firstItem = items[0];
          const backLabel = firstItem
            ? getCatalogCategoryLabel(firstItem.categoryId, firstItem.categoryId)
            : null;
          const backHref = firstItem ? `/products/${firstItem.categoryId}` : "/products";
          return (
            <Link
              href={backHref}
              className="typ-body-sm mb-6 inline-flex items-center gap-1.5 text-muted transition-colors hover:text-strong"
            >
              ← Back to {backLabel ?? "Products"}
            </Link>
          );
        })()}

        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <SectionIntro
              kicker={COMPARE_ROUTE_COPY.kicker}
              title={COMPARE_ROUTE_COPY.title}
              description={COMPARE_ROUTE_COPY.description}
            />
            {items.length > 0 ? (
              <div className="typ-body-sm mt-4 flex flex-wrap items-center gap-3 text-muted">
                <span className="rounded-full border border-soft bg-soft px-3 py-1">
                  {COMPARE_ROUTE_COPY.countLabel.replace("{count}", String(items.length))}
                </span>
                <span>{COMPARE_ROUTE_COPY.mobileHint}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <TrackedLink href="/products" label={COMPARE_ROUTE_COPY.browseCta} surface="compare-page" className="btn-outline">
              {COMPARE_ROUTE_COPY.browseCta}
            </TrackedLink>
            <TrackedLink href="/downloads" label={COMPARE_ROUTE_COPY.resourceDeskCta} surface="compare-page" className="btn-outline">
              {COMPARE_ROUTE_COPY.resourceDeskCta}
            </TrackedLink>
            <TrackedLink href="/contact?intent=quote&source=compare" label={COMPARE_ROUTE_COPY.primaryCta} surface="compare-page" className="btn-primary">
              {COMPARE_ROUTE_COPY.primaryCta}
            </TrackedLink>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-muted bg-soft p-8">
            <p className="typ-lead text-strong">
              {COMPARE_ROUTE_COPY.emptyTitle}
            </p>
            <p className="page-copy-sm mt-3 max-w-2xl text-muted">
              {COMPARE_ROUTE_COPY.emptyDescription}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <TrackedLink href="/products" label={COMPARE_ROUTE_COPY.emptyPrimaryCta} surface="compare-page-empty" className="btn-outline">
                {COMPARE_ROUTE_COPY.emptyPrimaryCta}
              </TrackedLink>
              <TrackedLink href="/downloads" label={COMPARE_ROUTE_COPY.emptySecondaryCta} surface="compare-page-empty" className="btn-outline">
                {COMPARE_ROUTE_COPY.emptySecondaryCta}
              </TrackedLink>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-muted">
            <table className="min-w-[760px] w-full border-collapse bg-panel">
              <thead>
                <tr>
                  <th className="typ-cta w-56 border-b border-muted bg-soft px-4 py-4 text-left text-strong">
                    Specification
                  </th>
                  {items.map((item) => {
                    const image =
                      normalizeAssetPath(item.product.images?.[0]) ||
                      normalizeAssetPath(item.product.flagship_image) ||
                      "/images/fallback/category.svg";
                    const productHref = `/products/${item.categoryId}/${item.product.slug}`;
                    return (
                      <th
                        key={item.product.id}
                        className="border-b border-l border-muted px-4 py-4 text-left align-top"
                      >
                        <Link href={productHref} className="block">
                          <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-md border border-muted bg-soft">
                            <Image
                              src={image}
                              alt={item.product.name}
                              fill
                              sizes="(max-width: 1024px) 100vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          <p className="typ-cta text-heading">{item.product.name}</p>
                        </Link>
                        <CompareColumnActions
                          productId={item.product.slug || item.product.id}
                          productName={item.product.name}
                          productHref={productHref}
                          image={image}
                          viewLabel={COMPARE_ROUTE_COPY.viewProductCta}
                          addLabel={COMPARE_ROUTE_COPY.addToQuoteCta}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row) => (
                  <tr key={row.key}>
                    <td className="typ-cta border-t border-soft bg-soft px-4 py-3 text-strong">
                      {row.label}
                    </td>
                    {items.map((item) => (
                      <td
                        key={`${item.product.id}-${row.key}`}
                        className="typ-body-sm border-l border-t border-soft px-4 py-3 text-body"
                      >
                        {specValue(item, row.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
