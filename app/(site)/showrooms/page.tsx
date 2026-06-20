import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { FeaturedCarousel } from "@/components/home/FeaturedCarousel";
import { BrandStatement } from "@/components/home/BrandStatement";
import { CollaborationSection } from "@/components/home/CollaborationSection";
import { ClientQuote } from "@/components/home/ClientQuote";
import { Teaser } from "@/components/home/Teaser";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import {
  SHOWROOMS_CLIENTS,
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
} from "@/data/site/routeCopy";
import { getBusinessStats } from '@/features/crm/businessStats';
import { formatKpiAsOf, formatKpiValuePlus } from "@/lib/kpiFormat";
import { SHOWROOMS_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = SHOWROOMS_PAGE_METADATA;

export default async function ShowroomsPage() {
  const { stats } = await getBusinessStats();
  const asOfLabel = formatKpiAsOf(stats.asOfDate);

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={SHOWROOMS_PAGE_COPY.heroTitle}
        subtitle={SHOWROOMS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/dmrc-hero.webp"
      />

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <p className="typ-label text-body">{SHOWROOMS_PAGE_COPY.trustedKicker}</p>
            <p className="typ-label text-body">{asOfLabel}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="shell-card-soft px-6 py-5">
              <p className="typ-stat text-strong">{formatKpiValuePlus(stats.clientOrganisations)}</p>
              <p className="text-body mt-2 text-sm font-medium">Client organisations</p>
            </div>
            <div className="shell-card-soft px-6 py-5">
              <p className="typ-stat text-strong">{formatKpiValuePlus(stats.projectsDelivered)}</p>
              <p className="text-body mt-2 text-sm font-medium">Projects delivered</p>
            </div>
            <div className="shell-card-soft px-6 py-5">
              <p className="typ-stat text-strong">{formatKpiValuePlus(stats.sectorsServed)}</p>
              <p className="text-body mt-2 text-sm font-medium">Sectors served</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <div className="shell-card p-8 md:p-10">
            <p className="typ-label mb-3 text-body">{SHOWROOMS_PAGE_COPY.aboutKicker}</p>
            <h2 className="typ-section max-w-3xl text-strong">{SHOWROOMS_PAGE_COPY.aboutTitle}</h2>
            <p className="page-copy mt-4 max-w-3xl text-body">
              {SHOWROOMS_PAGE_COPY.aboutDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <p className="typ-label mb-5 text-body">{SHOWROOMS_PAGE_COPY.clientsKicker}</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SHOWROOMS_CLIENTS.map((client) => (
              <div
                key={client}
                className="shell-card px-4 py-3 text-sm font-semibold text-strong"
              >
                {client}
              </div>
            ))}
          </div>
          <Link href="/trusted-by" className="link-arrow mt-6">
            {SHOWROOMS_PAGE_COPY.clientsCta}
          </Link>
        </div>
      </section>

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <p className="typ-label mb-5 text-body">{SHOWROOMS_PAGE_COPY.highlightsKicker}</p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SHOWROOMS_HIGHLIGHTS.map((item) => (
              <article key={item.title} className="shell-card-soft p-6">
                <h3 className="typ-h3 text-strong">{item.title}</h3>
                <p className="page-copy-sm text-body mt-3">{item.detail}</p>
              </article>
            ))}
          </div>
          <Link href="/portfolio" className="link-arrow mt-6">
            {SHOWROOMS_PAGE_COPY.highlightsCta}
          </Link>
        </div>
      </section>

      <FeaturedCarousel />
      <BrandStatement />
      <CollaborationSection />
      <Teaser
        title={SHOWROOMS_PAGE_COPY.sustainabilityTitle}
        subtitle={SHOWROOMS_PAGE_COPY.sustainabilitySubtitle}
        description={SHOWROOMS_PAGE_COPY.sustainabilityDescription}
        linkText={SHOWROOMS_PAGE_COPY.sustainabilityCta}
        linkUrl="/sustainability"
        imageSrc="/images/projects/OMC-Porbandar/IMG_3498.webp"
        imageAlt="Sustainable office furniture project"
        lightMode
      />
      <ClientQuote />

      <ContactTeaser />
    </section>
  );
}


