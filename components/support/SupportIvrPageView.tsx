import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { VisualIVR } from "@/components/support/VisualIVR";
import { SUPPORT_IVR_PAGE_COPY } from "@/data/site/routeCopy";

export function SupportIvrPageView() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={SUPPORT_IVR_PAGE_COPY.heroTitle}
        subtitle={SUPPORT_IVR_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/hero-3.webp"
      />

      <section className="container px-6 py-18 2xl:px-0 md:py-22">
        <SectionIntro
          kicker={SUPPORT_IVR_PAGE_COPY.introKicker}
          title={SUPPORT_IVR_PAGE_COPY.introTitle}
          description={SUPPORT_IVR_PAGE_COPY.introDescription}
          className="mb-10"
          maxWidthClassName="max-w-4xl"
        />

        <div className="shell-card p-6 md:p-8">
          <VisualIVR />
        </div>

        <div className="shell-card-soft mt-8 p-6 md:p-8">
          <h3 className="typ-h3 text-strong">{SUPPORT_IVR_PAGE_COPY.noteTitle}</h3>
          <p className="page-copy-sm text-body mt-3">{SUPPORT_IVR_PAGE_COPY.noteDescription}</p>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}
