import { unstable_cache } from "next/cache";
import Link from "next/link";
import { CategoryImage } from "@/components/home/CategoryImage";
import { getCatalog } from '@/features/catalog/getProducts';
import {
  buildRequestedCategoryCatalog,
  getCatalogCategoryHref,
  getCatalogCategoryLabel,
} from '@/features/catalog/categories';
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
import { PRODUCTS_PAGE_COPY } from "@/data/site/routeCopy";

const getCachedCatalog = unstable_cache(async () => getCatalog(), ["home-category-grid-v2"], {
  revalidate: 3600,
  tags: ["catalog"],
});

export async function CategoryGrid() {
  const requestedCatalog = buildRequestedCategoryCatalog(await getCachedCatalog());

  return (
    <section className="scheme-page w-full py-20 md:py-28">
      <div className="container px-6 2xl:px-0">
        <div className="mb-12 max-w-2xl md:mb-16">
          <p className="typ-label mb-3 text-brand">
            {PRODUCTS_PAGE_COPY.rangeKicker}
          </p>
          <h2 className="typ-section max-w-xl text-strong">
            {PRODUCTS_PAGE_COPY.rangeTitle}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {requestedCatalog.map((category) => {
            const allProducts = category.series.flatMap((series) => series.products);
            const categoryName = getCatalogCategoryLabel(category.id, category.name);
            const categoryHref = getCatalogCategoryHref(category.id);
            const firstProductWithImage = allProducts.find(
              (product) => (product.images && product.images.length > 0) || product.flagshipImage,
            );
            const flagshipImage =
              firstProductWithImage?.images?.[0] ||
              firstProductWithImage?.flagshipImage ||
              DEFAULT_HERO_FALLBACK;

            return (
              <Link
                key={category.id}
                href={categoryHref}
                className="shell-card group relative block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-theme-lift"
              >
                <div className="scheme-section-soft scheme-border relative aspect-square overflow-hidden border-b">
                  <CategoryImage src={flagshipImage} alt={categoryName} />
                  <div className="absolute inset-0 transition-colors duration-500 group-hover:surface-overlay-inverse-12" />
                </div>

                <div className="flex items-center justify-between gap-4 px-5 py-5 md:px-6 md:py-6">
                  <div>
                    <h3 className="typ-section text-strong transition-colors duration-200 group-hover:text-primary">
                      {categoryName}
                    </h3>
                    <p className="page-copy-sm mt-1 text-body">
                      {allProducts.length} products
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 text-subtle transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}




