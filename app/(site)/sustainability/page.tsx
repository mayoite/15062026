import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { Newsletter } from "@/components/shared/Newsletter";
import { RouteActionCard } from "@/components/shared/RouteActionCard";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { SUSTAINABILITY_PAGE_COPY } from "@/data/site/routeCopy";
import { SUSTAINABILITY_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = SUSTAINABILITY_PAGE_METADATA;

export default function SustainabilityPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={SUSTAINABILITY_PAGE_COPY.heroTitle}
        subtitle={SUSTAINABILITY_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/products/imported/halo/image-1.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <SectionIntro
            kicker={SUSTAINABILITY_PAGE_COPY.introKicker}
            title={SUSTAINABILITY_PAGE_COPY.introTitle}
            description={SUSTAINABILITY_PAGE_COPY.introDescription}
            maxWidthClassName="max-w-2xl"
          />

          <div className="shell-card p-6 md:p-8">
            <h3 className="typ-h3 text-strong">
              {SUSTAINABILITY_PAGE_COPY.introTitleLead}
              <span className="text-brand"> {SUSTAINABILITY_PAGE_COPY.introTitleEmphasis}</span>
            </h3>
            <ul className="mt-5 space-y-4">
              {SUSTAINABILITY_PAGE_COPY.introPoints.map((point) => (
                <li key={point} className="page-copy-sm text-body shell-list-divider pb-4 last:border-b-0 last:pb-0">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {SUSTAINABILITY_PAGE_COPY.pillars.map((pillar) => (
            <article key={pillar.title} className="shell-card p-6">
              <h3 className="typ-h3 text-strong">{pillar.title}</h3>
              <p className="page-copy-sm text-body mt-3">{pillar.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="typ-section text-strong mb-6">{SUSTAINABILITY_PAGE_COPY.ecoScoreTitle}</h2>
              <p className="page-copy text-body mb-6">
                {SUSTAINABILITY_PAGE_COPY.ecoScoreDescription}
              </p>
              <ul className="page-copy text-body space-y-4">
                {SUSTAINABILITY_PAGE_COPY.ecoScoreItems.map((item) => (
                  <li key={item.index} className="flex gap-4">
                    <span className="eco-score-index">{item.index}</span>
                    <span>
                      <strong>{item.title}:</strong> {item.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="shell-card-soft space-y-8 p-10 md:p-12">
              {SUSTAINABILITY_PAGE_COPY.badges.map((badge, index) => (
                <div key={badge.title}>
                  <h3 className="typ-h3 text-strong mb-2">{badge.title}</h3>
                  <p className="page-copy-sm text-body">{badge.detail}</p>
                  {index < SUSTAINABILITY_PAGE_COPY.badges.length - 1 ? (
                    <div className="scheme-border mt-8 h-px border-t" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y">
        <SectionIntro
          kicker={SUSTAINABILITY_PAGE_COPY.commitmentsKicker}
          title={SUSTAINABILITY_PAGE_COPY.commitmentsTitle}
          className="mb-8"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {SUSTAINABILITY_PAGE_COPY.commitments.map((commitment) => (
            <article
              key={commitment.title}
              className="scheme-panel-soft scheme-border rounded-2xl border p-6"
            >
              <h3 className="typ-h3 text-strong">{commitment.title}</h3>
              <p className="page-copy-sm text-body mt-3">{commitment.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y-sm">
        <div className="shell-dark-cta-panel shell-dark-cta-panel--strong p-12">
          <div className="flex flex-col items-center justify-between gap-12 md:flex-row">
            <div className="max-w-xl">
              <h3 className="typ-h2 text-inverse mb-4">{SUSTAINABILITY_PAGE_COPY.verifiedTitle}</h3>
              <p className="page-copy text-inverse-muted">
                {SUSTAINABILITY_PAGE_COPY.verifiedDescription}
              </p>
            </div>
            <div className="surface-overlay-08 flex items-center gap-8 rounded-2xl p-8 backdrop-blur-sm">
              {SUSTAINABILITY_PAGE_COPY.verifiedLabels.map((label) => (
                <div
                  key={label}
                  className="shell-dark-chip shell-dark-chip--label h-20 w-20 justify-center rounded-full text-center"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <RouteActionCard
          title={SUSTAINABILITY_PAGE_COPY.routeNoteTitle}
          description={SUSTAINABILITY_PAGE_COPY.routeNoteDescription}
          className="mt-10 p-8 md:p-10"
          actions={[
            { href: "/downloads", label: SUSTAINABILITY_PAGE_COPY.routeNotePrimaryCta, variant: "primary" },
            { href: "/planning", label: SUSTAINABILITY_PAGE_COPY.routeNoteSecondaryCta },
          ]}
        />
      </section>

      <Newsletter />
      <ContactTeaser />
    </section>
  );
}
