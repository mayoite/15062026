import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { getCatalog } from "@/features/catalog/getProducts";
import {
  buildRequestedCategoryCatalog,
  getCatalogCategoryHref,
  getCatalogCategoryLabel,
} from "@/features/catalog/categories";
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
import { PRODUCTS_PAGE_COPY } from "@/data/site/routeCopy";

const PILLAR_ICONS = {
  "check-circle": CheckCircle2,
  clock: Clock3,
  shield: ShieldCheck,
} as const;

const getCachedCatalog = unstable_cache(async () => getCatalog(), ["home-category-grid-v2"], {
  revalidate: 3600,
  tags: ["catalog"],
});

export async function CategoryGrid() {
  const requestedCatalog = buildRequestedCategoryCatalog(await getCachedCatalog());
  const { headlineLead, headlineAccent } = PRODUCTS_PAGE_COPY;

  return (
    <section className="home-section--soft w-full border-t border-b border-theme-soft section-y-sm pt-24 md:pt-28">
      <div className="home-shell-xl">
        <div className="home-frame home-frame--standard">
          <h1 className="home-heading mb-10 max-w-3xl md:mb-12">
            {headlineLead}{" "}
            <span className="text-accent-italic">{headlineAccent}</span>
          </h1>

          <div className="mb-12 grid grid-cols-1 gap-5 md:mb-14 md:grid-cols-3 md:gap-6">
            {PRODUCTS_PAGE_COPY.pillars.map((pillar) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <article
                  key={pillar.title}
                  className="shell-card shell-accent-border-hover relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-theme-lift md:p-6"
                >
                  <div className="shell-top-accent" />
                  <div className="shell-icon-accent flex h-10 w-10 items-center justify-center rounded-full">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="typ-h3 text-strong mt-4">{pillar.title}</h2>
                  <p className="page-copy-sm text-body mt-2">{pillar.detail}</p>
                </article>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 md:gap-8">
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
                  className="group home-collection-card home-collection-card--compact block"
                >
                  <Image
                    src={flagshipImage}
                    alt={categoryName}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="home-collection-card__overlay" />
                  <div className="home-collection-card__footer absolute inset-x-0 bottom-0 flex items-center justify-between gap-4">
                    <h3 className="typ-overlay-title text-inverse">{categoryName}</h3>
                    <span className="home-collection-card__arrow shrink-0" aria-hidden="true">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
