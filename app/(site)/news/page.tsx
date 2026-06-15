import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { NEWS_PAGE_COPY } from "@/data/site/routeCopy";

export default function NewsPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={NEWS_PAGE_COPY.heroTitle}
        subtitle={NEWS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/dmrc-hero.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="typ-label text-body mb-4">{NEWS_PAGE_COPY.introKicker}</p>
            <h2 className="typ-section text-strong max-w-3xl">
              {NEWS_PAGE_COPY.introTitle}
            </h2>
            <p className="page-copy text-body mt-5 max-w-2xl">
              {NEWS_PAGE_COPY.introDescription}
            </p>
          </div>

          <div className="shell-card p-6 md:p-8">
            <p className="typ-label text-body mb-4">Route intent</p>
            <p className="page-copy-sm text-body">
              This page stays useful only if it remains grounded in real project themes, live support routes,
              and current product/planning direction rather than synthetic newsroom content.
            </p>
          </div>
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {NEWS_PAGE_COPY.cards.map((item) => (
              <article key={item.title} className="shell-card p-6">
                <p className="typ-label text-brand mb-3">{item.category}</p>
                <h3 className="typ-h3 text-strong">{item.title}</h3>
                <p className="page-copy-sm text-body mt-3">{item.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y">
        <div className="shell-dark-cta-panel grid gap-6 lg:grid-cols-[1.1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h2 className="typ-section text-inverse">{NEWS_PAGE_COPY.ctaTitle}</h2>
            <p className="page-copy text-inverse-body mt-4">{NEWS_PAGE_COPY.ctaDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/downloads" className="btn-primary">
              {NEWS_PAGE_COPY.primaryCta}
            </Link>
            <Link href="/contact" className="btn-outline-light">
              {NEWS_PAGE_COPY.secondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}

