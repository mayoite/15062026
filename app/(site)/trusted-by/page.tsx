import { ClientBadge } from "@/components/ClientBadge";
import { Hero } from "@/components/home/Hero";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { TRUSTED_BY_CLIENTS, TRUSTED_BY_STATS } from "@/data/site/proof";
import { TRUSTED_BY_PAGE_COPY } from "@/data/site/routeCopy";
import { TRUSTED_BY_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = TRUSTED_BY_PAGE_METADATA;

export default function TrustedByPage() {
  const sectors = Array.from(new Set(TRUSTED_BY_CLIENTS.map((client) => client.sector)));

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={TRUSTED_BY_PAGE_COPY.heroTitle}
        subtitle={TRUSTED_BY_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/franklin-hero.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="typ-label text-body mb-4">{TRUSTED_BY_PAGE_COPY.overviewKicker}</p>
            <h2 className="typ-section text-strong max-w-3xl">
              {TRUSTED_BY_PAGE_COPY.overviewTitle}
            </h2>
            <p className="page-copy text-body mt-5 max-w-2xl">
              {TRUSTED_BY_PAGE_COPY.overviewDescription}
            </p>
          </div>

          <div className="shell-card p-6 md:p-8">
            <p className="typ-label text-body mb-4">{TRUSTED_BY_PAGE_COPY.statsKicker}</p>
            <div className="grid grid-cols-2 gap-4">
              {TRUSTED_BY_STATS.map((item) => (
                <div
                  key={item.label}
                  className="shell-card-soft p-5"
                >
                  <p className="typ-stat text-primary">{item.value}</p>
                  <p className="stats-block__label mt-2">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-6">
        <div className="container px-6 2xl:px-0">
          <div className="shell-dark-cta-panel shell-dark-cta-panel--strong grid gap-8 lg:grid-cols-[0.9fr_1.1fr] p-8 md:p-10">
            <div>
              <p className="typ-label text-inverse-muted">{TRUSTED_BY_PAGE_COPY.sectorsKicker}</p>
              <h2 className="typ-section mt-4 text-inverse">{TRUSTED_BY_PAGE_COPY.sectorsTitle}</h2>
              <p className="page-copy text-inverse-body mt-4 max-w-xl">
                {TRUSTED_BY_PAGE_COPY.sectorsDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 self-start lg:justify-end">
              {sectors.map((sector) => (
                <span
                  key={sector}
                  className="shell-dark-chip shell-dark-chip--label"
                >
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <WhyChooseUs />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-8 max-w-3xl">
          <p className="typ-label text-body mb-4">{TRUSTED_BY_PAGE_COPY.rosterKicker}</p>
          <h2 className="typ-section text-strong">{TRUSTED_BY_PAGE_COPY.rosterTitle}</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUSTED_BY_CLIENTS.map((client) => (
            <ClientBadge key={client.name} {...client} />
          ))}
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}

