import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteActionCard } from "@/components/shared/RouteActionCard";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { SITE_CONTACT, buildWhatsAppHref } from "@/data/site/contact";
import { DOWNLOADS_PAGE_COPY, DOWNLOADS_RESOURCE_CATEGORIES } from "@/data/site/routeCopy";

export const metadata: Metadata = {
  title: DOWNLOADS_PAGE_COPY.metadataTitle,
  description: DOWNLOADS_PAGE_COPY.metadataDescription,
};

export default function DownloadsPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={DOWNLOADS_PAGE_COPY.heroTitle}
        subtitle={DOWNLOADS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/hero-3.webp"
      />

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <SectionIntro
            kicker={DOWNLOADS_PAGE_COPY.resourceKicker}
            title={DOWNLOADS_PAGE_COPY.resourceTitle}
            description={DOWNLOADS_PAGE_COPY.resourceDescription}
            className="mb-10"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {DOWNLOADS_RESOURCE_CATEGORIES.map((item) => (
              <article key={item.title} className="shell-card-soft p-6">
                <h3 className="typ-h3 text-strong">{item.title}</h3>
                <p className="page-copy-sm text-body mt-3">{item.detail}</p>
                <TrackedLink href={item.href} label={item.cta} surface="downloads-resource-card" className="link-arrow mt-5">
                  {item.cta}
                </TrackedLink>
              </article>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="shell-dark-cta-panel shell-dark-cta-panel--strong p-6 md:p-8">
              <p className="typ-label text-inverse-muted mb-3">{DOWNLOADS_PAGE_COPY.processKicker}</p>
              <h3 className="typ-h2 text-inverse">{DOWNLOADS_PAGE_COPY.processTitle}</h3>
              <div className="mt-8 space-y-5">
                {DOWNLOADS_PAGE_COPY.processSteps.map((step, index) => (
                  <div key={step.title} className="dark-panel-step">
                    <span className="dark-panel-step__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="typ-h3 text-inverse">{step.title}</h4>
                      <p className="page-copy-sm text-inverse-body mt-2 max-w-2xl">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="shell-card-soft p-6 md:p-8">
              <p className="typ-label text-body mb-3">{DOWNLOADS_PAGE_COPY.noteTitle}</p>
              <p className="page-copy text-body">{DOWNLOADS_PAGE_COPY.noteBody}</p>
              <ul className="page-copy-sm text-body mt-6 space-y-3">
                {DOWNLOADS_PAGE_COPY.notePoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <RouteActionCard
            kicker={DOWNLOADS_PAGE_COPY.urgentKicker}
            title={DOWNLOADS_PAGE_COPY.resourceTitle}
            description={DOWNLOADS_PAGE_COPY.urgentDescription}
            className="mt-10 p-6 md:p-8"
            actions={[
              { href: "/contact", label: DOWNLOADS_PAGE_COPY.primaryCta, variant: "primary" },
              { href: `mailto:${SITE_CONTACT.salesEmail}`, label: DOWNLOADS_PAGE_COPY.secondaryCta },
              {
                href: buildWhatsAppHref(
                  "Hi, I need a product catalog or technical sheet pack for my workspace project.",
                ),
                label: DOWNLOADS_PAGE_COPY.tertiaryCta,
              },
            ]}
          />
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}
