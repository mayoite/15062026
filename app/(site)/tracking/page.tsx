import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { TRACKING_PAGE_COPY } from "@/data/site/routeCopy";

export default function TrackingPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={TRACKING_PAGE_COPY.heroTitle}
        subtitle={TRACKING_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/titan-hero.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <SectionIntro
            kicker={TRACKING_PAGE_COPY.introKicker}
            title={TRACKING_PAGE_COPY.introTitle}
            description={TRACKING_PAGE_COPY.introDescription}
            maxWidthClassName="max-w-2xl"
          />

          <div className="shell-card p-6 md:p-8">
            <h3 className="typ-h3 text-strong">{TRACKING_PAGE_COPY.referenceTitle}</h3>
            <ul className="mt-5 space-y-4">
              {TRACKING_PAGE_COPY.referenceItems.map((item) => (
                <li
                  key={item}
                  className="page-copy-sm text-body shell-list-divider pb-4 last:border-b-0 last:pb-0"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <SectionIntro title={TRACKING_PAGE_COPY.lanesTitle} className="mb-8" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {TRACKING_PAGE_COPY.lanes.map((lane) => (
              <article key={lane.title} className="shell-card p-6">
                <h3 className="typ-h3 text-strong">{lane.title}</h3>
                <p className="page-copy-sm text-body mt-3">{lane.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y">
        <RouteCtaBand
          title={TRACKING_PAGE_COPY.supportTitle}
          description={TRACKING_PAGE_COPY.supportDescription}
          actions={[
            { href: "/service", label: TRACKING_PAGE_COPY.primaryCta, variant: "primary" },
            { href: "/contact", label: TRACKING_PAGE_COPY.secondaryCta },
            { href: "/downloads", label: TRACKING_PAGE_COPY.tertiaryCta },
          ]}
        />
      </section>

      <ContactTeaser />
    </section>
  );
}
