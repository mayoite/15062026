import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { DEFAULT_HERO_FALLBACK } from "@/lib/site-data/homepage";
import { SOLUTIONS_DELIVERY_STEPS, SOLUTIONS_PAGE_COPY } from "@/lib/site-data/routeCopy";
import { SOLUTIONS_PAGE_METADATA } from "@/lib/site-data/routeMetadata";

export const metadata = SOLUTIONS_PAGE_METADATA;

export default function SolutionsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Hero
        variant="small"
        title={
          <>
            {SOLUTIONS_PAGE_COPY.heroTitleLead}{" "}
            <span className="text-accent-italic-on-dark">
              {SOLUTIONS_PAGE_COPY.heroTitleAccent}
            </span>
          </>
        }
        subtitle={SOLUTIONS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/hero-2.webp"
      />

      <section className="home-section--white w-full border-t border-theme-soft section-y-sm">
        <div className="home-shell-xl">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl">
              <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.deliveryKicker}</p>
              <h2 className="home-heading">{SOLUTIONS_PAGE_COPY.deliveryTitle}</h2>
              <p className="page-copy text-body mt-5">
                {SOLUTIONS_PAGE_COPY.deliveryDescription}
              </p>
            </div>
            <div className="shell-media-frame relative aspect-4/3">
              <Image
                src={DEFAULT_HERO_FALLBACK}
                alt="Workspace planning and delivery"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="home-section--soft w-full border-t border-b border-theme-soft section-y-sm">
        <div className="home-shell-xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {SOLUTIONS_PAGE_COPY.stats.map((item) => (
              <div key={item.label} className="home-trust-kpi home-trust-kpi--light">
                <p className="typ-stat text-primary">{item.value}</p>
                <p className="typ-label mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section--white w-full border-t border-theme-soft section-y-sm">
        <div className="home-shell-xl">
          <div className="home-frame home-frame--standard">
            <div className="mb-10 max-w-3xl">
              <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.processKicker}</p>
              <h2 className="home-heading">{SOLUTIONS_PAGE_COPY.processTitle}</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
              {SOLUTIONS_DELIVERY_STEPS.map((step, index) => (
                <article
                  key={step.title}
                  className="shell-card shell-accent-border-hover overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-theme-lift"
                >
                  <div className="scheme-border relative aspect-16/10 border-b">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <p className="typ-label text-body mb-3">Phase {index + 1}</p>
                    <h3 className="typ-h3 text-strong">{step.title}</h3>
                    <p className="page-copy text-body mt-3">{step.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section--soft w-full border-t border-b border-theme-soft section-y-sm">
        <div className="home-shell-xl">
          <div className="home-frame home-frame--standard p-7 md:p-9">
            <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.planningKicker}</p>
            <h2 className="home-heading max-w-3xl">{SOLUTIONS_PAGE_COPY.planningTitle}</h2>
            <p className="page-copy text-body mt-5 max-w-3xl">
              {SOLUTIONS_PAGE_COPY.planningDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                {SOLUTIONS_PAGE_COPY.planningPrimaryCta}
              </Link>
              <Link href="/products" className="btn-outline">
                {SOLUTIONS_PAGE_COPY.planningSecondaryCta}
              </Link>
              <Link href="/downloads" className="btn-outline">
                {SOLUTIONS_PAGE_COPY.planningTertiaryCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactTeaser />
    </div>
  );
}
