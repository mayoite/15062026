import type { Metadata } from "next";
import { buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ClientBadge } from "@/components/ClientBadge";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { HomeFAQ } from "@/components/home/HomeFAQ";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
import { ABOUT_PAGE_COPY } from "@/data/site/routeCopy";
import { TRUSTED_BY_CLIENTS, TRUSTED_BY_STATS } from "@/data/site/proof";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "About One&Only",
  description:
    "Planning-led office furniture systems for modern workplaces. Learn about our approach to workspace design across Patna, Bihar, and Jharkhand.",
  path: "/about",
  image: "/images/hero/hero-2.webp",
});


export default function AboutPage() {
  const featuredClients = TRUSTED_BY_CLIENTS.slice(0, 8);

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={ABOUT_PAGE_COPY.heroTitle}
        subtitle={ABOUT_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage={DEFAULT_HERO_FALLBACK}
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="scheme-border relative aspect-16/11 overflow-hidden rounded-2xl border">
            <Image
              src="/images/hero/hero-2.webp"
              alt="Workspace delivery by One&Only"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="space-y-5">
            <p className="typ-label text-body">{ABOUT_PAGE_COPY.sectionKicker}</p>
            <h2 className="typ-section text-strong">{ABOUT_PAGE_COPY.sectionTitle}</h2>
            {ABOUT_PAGE_COPY.paragraphs.map((paragraph) => (
              <p key={paragraph} className="typ-body-sm text-body">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      <hr className="shell-accent-divider" />

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="stats-block grid grid-cols-2 gap-4 md:grid-cols-4">
            {TRUSTED_BY_STATS.map((item) => (
              <div
                key={item.label}
                className="scheme-panel scheme-border rounded-2xl border p-6 text-center"
              >
                <p className="typ-stat text-primary">{item.value}</p>
                <p className="stats-block__label mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="shell-accent-divider" />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-8 max-w-3xl">
          <p className="typ-label text-body mb-4">{ABOUT_PAGE_COPY.modelKicker}</p>
          <h2 className="typ-section text-strong">{ABOUT_PAGE_COPY.modelTitle}</h2>
          <p className="typ-body-sm text-body mt-5">
            {ABOUT_PAGE_COPY.modelDescription}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {ABOUT_PAGE_COPY.modelPillars.map((pillar) => (
            <article key={pillar.title} className="scheme-panel scheme-border rounded-2xl border p-6">
              <h3 className="typ-h3 text-strong">{pillar.title}</h3>
              <p className="page-copy-sm text-body mt-3">{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="mb-8 max-w-3xl">
            <p className="typ-label text-body mb-4">{ABOUT_PAGE_COPY.processKicker}</p>
            <h2 className="typ-section text-strong">{ABOUT_PAGE_COPY.processTitle}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {ABOUT_PAGE_COPY.processSteps.map((step, index) => (
              <article
                key={step.title}
                className="scheme-panel-soft scheme-border rounded-2xl border p-6"
              >
                <p className="typ-label text-brand mb-3">Step {index + 1}</p>
                <h3 className="typ-h3 text-strong">{step.title}</h3>
                <p className="page-copy-sm text-body mt-3">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <hr className="shell-accent-divider" />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="typ-label text-body mb-3">{ABOUT_PAGE_COPY.confidenceKicker}</p>
            <h2 className="typ-section text-strong">{ABOUT_PAGE_COPY.confidenceTitle}</h2>
          </div>
          <Link href="/trusted-by" className="btn-outline">
            {ABOUT_PAGE_COPY.confidenceCta}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {featuredClients.map((client) => (
            <ClientBadge key={client.name} {...client} />
          ))}
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y-sm">
        <RouteCtaBand
          title={ABOUT_PAGE_COPY.supportTitle}
          description={ABOUT_PAGE_COPY.supportDescription}
          actions={[
            { href: "/planning", label: ABOUT_PAGE_COPY.supportPrimaryCta, variant: "primary" },
            { href: "/downloads", label: ABOUT_PAGE_COPY.supportSecondaryCta },
          ]}
        />
      </section>

      <HomeFAQ />

      <ContactTeaser />
    </section>
  );
}
