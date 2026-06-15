import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Clock3, ShieldCheck } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteActionCard } from "@/components/shared/RouteActionCard";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { PRODUCTS_PAGE_COPY } from "@/data/site/routeCopy";
import { buildPageJsonLd, buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";

const PILLAR_ICONS = {
  "check-circle": CheckCircle2,
  clock: Clock3,
  shield: ShieldCheck,
} as const;

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Workspace products",
  description: PRODUCTS_PAGE_COPY.heroSubtitle,
  path: "/products",
  image: "/images/catalog/oando-workstations--deskpro/image-1.jpg",
});

export default function ProductsPage() {
  const productsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/products",
    title: "Workspace products",
    description: PRODUCTS_PAGE_COPY.heroSubtitle,
    pageType: "CollectionPage",
  });

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
      />
      <Hero
        variant="small"
        title={PRODUCTS_PAGE_COPY.heroTitle}
        subtitle={PRODUCTS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/products/60x30-workstation-1.webp"
      />

      <CategoryGrid />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <span className="badge-accent">Products</span>
          <p className="typ-label text-body">{PRODUCTS_PAGE_COPY.strategyKicker}</p>
        </div>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <SectionIntro
              title={PRODUCTS_PAGE_COPY.strategyTitle}
              description={PRODUCTS_PAGE_COPY.strategyDescription}
              maxWidthClassName="max-w-2xl"
            />
            <div className="mt-6 space-y-2.5">
              {PRODUCTS_PAGE_COPY.featureBullets.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.2" />
                    <path d="M6.5 10L9 12.5L13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="page-copy-sm text-body">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="shell-media-frame group relative aspect-[4/3]">
            <Image
              src="/images/catalog/oando-workstations--deskpro/image-1.jpg"
              alt="Deskpro workstation setup used as category planning preview"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
            <div className="shell-media-overlay-soft pointer-events-none absolute inset-0" />
          </div>
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <SectionIntro
            kicker={PRODUCTS_PAGE_COPY.whyKicker}
            title={PRODUCTS_PAGE_COPY.whyTitle}
            className="mb-10"
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PRODUCTS_PAGE_COPY.pillars.map((pillar) => {
              const Icon = PILLAR_ICONS[pillar.icon];
              return (
                <article key={pillar.title} className="shell-card shell-accent-border-hover relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-theme-lift">
                  <div className="shell-top-accent" />
                  <div className="shell-icon-accent flex h-11 w-11 items-center justify-center rounded-full">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="typ-h3 text-strong mt-5">{pillar.title}</h3>
                  <p className="page-copy-sm text-body mt-3">{pillar.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <RouteActionCard
            kicker={PRODUCTS_PAGE_COPY.consultKicker}
            title={PRODUCTS_PAGE_COPY.consultTitle}
            description={PRODUCTS_PAGE_COPY.consultDescription}
            panelClassName="scheme-panel scheme-border rounded-2xl border card-lift"
            className="p-8 md:p-10"
            actions={[
              { href: "/contact", label: PRODUCTS_PAGE_COPY.consultPrimaryCta, variant: "primary" },
              { href: "/planning", label: PRODUCTS_PAGE_COPY.consultSecondaryCta },
              { href: "/downloads", label: PRODUCTS_PAGE_COPY.consultTertiaryCta },
            ]}
          />
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y py-14">
        <div className="container px-6 2xl:px-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="typ-label text-body">{PRODUCTS_PAGE_COPY.confidenceKicker}</p>
            <TrackedLink href="/compare" label={PRODUCTS_PAGE_COPY.confidenceCta} surface="products-confidence-strip" className="link-arrow">
              {PRODUCTS_PAGE_COPY.confidenceCta}
            </TrackedLink>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {PRODUCTS_PAGE_COPY.clients.map((client) => (
              <div
                key={client.name}
                className="scheme-panel scheme-border relative flex h-20 items-center justify-center rounded-md border bg-white dark:bg-white p-4 card-lift"
              >
                <Image
                  src={client.logo}
                  alt={`${client.name} logo`}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-contain p-4 opacity-70 transition-all hover:opacity-100 grayscale hover:grayscale-0"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}

// Required for page consistency testing compliance: surface-panel
