import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { DEFAULT_HERO_FALLBACK } from "@/data/site/homepage";
import { SOLUTIONS_DELIVERY_STEPS, SOLUTIONS_PAGE_COPY } from "@/data/site/routeCopy";
import { SOLUTIONS_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = SOLUTIONS_PAGE_METADATA;

export default function SolutionsPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={SOLUTIONS_PAGE_COPY.heroTitle}
        subtitle={SOLUTIONS_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/hero-2.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.deliveryKicker}</p>
            <h2 className="typ-section text-strong max-w-3xl">{SOLUTIONS_PAGE_COPY.deliveryTitle}</h2>
            <p className="page-copy text-body mt-4">
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
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="stats-block grid grid-cols-2 gap-4 md:grid-cols-4">
            {SOLUTIONS_PAGE_COPY.stats.map((item) => (
              <div
                key={item.label}
                className="shell-card p-5 text-center"
              >
                <p className="typ-stat text-primary">{item.value}</p>
                <p className="stats-block__label mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <div className="mb-10">
            <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.processKicker}</p>
            <h2 className="typ-section text-strong">{SOLUTIONS_PAGE_COPY.processTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SOLUTIONS_DELIVERY_STEPS.map((step, index) => (
              <article
                key={step.title}
                className="shell-card overflow-hidden"
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
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="shell-card p-7 md:p-9">
            <p className="typ-label text-body mb-4">{SOLUTIONS_PAGE_COPY.planningKicker}</p>
            <h2 className="typ-section text-strong max-w-3xl">{SOLUTIONS_PAGE_COPY.planningTitle}</h2>
            <p className="page-copy text-body mt-4 max-w-3xl">
              {SOLUTIONS_PAGE_COPY.planningDescription}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
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
    </section>
  );
}


