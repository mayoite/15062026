import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { LEGAL_PAGE_COPY } from "@/data/site/routeCopy";
import { IMPRINT_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = IMPRINT_PAGE_METADATA;

export default function ImprintPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={LEGAL_PAGE_COPY.imprint.title}
        subtitle={LEGAL_PAGE_COPY.imprint.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/tvs-patna-enhanced.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="shell-dark-cta-panel p-7 md:p-9">
            <p className="typ-label text-inverse-muted">{LEGAL_PAGE_COPY.imprint.overviewKicker}</p>
            <h2 className="typ-section mt-3 text-inverse">
              {LEGAL_PAGE_COPY.imprint.overviewTitle}
            </h2>
            <p className="page-copy text-inverse-body mt-4">
              {LEGAL_PAGE_COPY.imprint.overviewDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                Contact office
              </Link>
              <Link href="/privacy" className="btn-outline-light">
                Privacy policy
              </Link>
            </div>
          </aside>

          <div className="grid gap-4 md:grid-cols-2">
            {LEGAL_PAGE_COPY.imprint.sections.map((section) => (
              <article
                key={section.heading}
                className="shell-card p-7 md:p-8"
              >
                <h2 className="typ-card text-strong">{section.heading}</h2>
                <div className="page-copy-sm text-body mt-4 space-y-1">
                  {section.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}


