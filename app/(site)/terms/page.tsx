import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
import { LEGAL_PAGE_COPY } from "@/data/site/routeCopy";
import { TERMS_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = TERMS_PAGE_METADATA;

export default function TermsPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={LEGAL_PAGE_COPY.terms.title}
        subtitle={LEGAL_PAGE_COPY.terms.heroSubtitle}
        showButton={false}
        backgroundImage={DEFAULT_HERO_FALLBACK}
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="shell-card-soft p-7 md:p-9">
            <p className="typ-label text-brand">{LEGAL_PAGE_COPY.terms.overviewKicker}</p>
            <h2 className="typ-section text-strong mt-3">
              {LEGAL_PAGE_COPY.terms.overviewTitle}
            </h2>
            <p className="page-copy text-body mt-4">
              {LEGAL_PAGE_COPY.terms.overviewDescription}
            </p>
            <div className="scheme-border mt-8 border-t pt-6">
              <p className="page-copy-sm text-body">
                Use this page together with the refund, privacy, and service routes when a client
                needs clear guidance on commercial handling, support scope, or warranty-backed
                follow-up.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/refund-and-return-policy" className="btn-primary">
                View refund policy
              </Link>
              <Link href="/service" className="btn-outline">
                Service and support
              </Link>
            </div>
          </aside>

          <div className="space-y-4">
            {LEGAL_PAGE_COPY.terms.sections.map((section, index) => (
              <article
                key={section.heading}
                className={`${index === 0 ? "shell-dark-cta-panel" : "shell-card"} p-7 md:p-8`}
              >
                <h2 className={`typ-card ${index === 0 ? "text-inverse" : "text-strong"}`}>
                  {section.heading}
                </h2>
                <p
                  className={`page-copy-sm mt-3 ${
                    index === 0 ? "text-inverse-body" : "text-body"
                  }`}
                >
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}



