import Link from "next/link";
import { Briefcase, GraduationCap, Users } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { JobCard } from "@/components/career/JobCard";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { CAREER_PAGE_COPY, CAREER_PAGE_JOBS } from "@/lib/site-data/routeCopy";

const CAREER_PILLAR_ICONS = {
  users: Users,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
} as const;

export function CareerPageView() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={CAREER_PAGE_COPY.heroTitle}
        subtitle={CAREER_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/tvs-patna-enhanced.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-12 max-w-4xl space-y-5">
          <p className="typ-label text-body">{CAREER_PAGE_COPY.introKicker}</p>
          <h2 className="typ-section text-strong">{CAREER_PAGE_COPY.introTitle}</h2>
          <p className="page-copy text-body">{CAREER_PAGE_COPY.introDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {CAREER_PAGE_COPY.pillars.map((pillar) => {
            const Icon = CAREER_PILLAR_ICONS[pillar.icon];
            return (
              <article key={pillar.title} className="shell-card p-7">
                <Icon className="mb-4 h-8 w-8 text-primary" />
                <h3 className="typ-h3 text-strong">{pillar.title}</h3>
                <p className="page-copy-sm text-body mt-3">{pillar.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="mb-8 max-w-3xl">
            <p className="typ-label text-body mb-4">{CAREER_PAGE_COPY.processKicker}</p>
            <h2 className="typ-section text-strong">{CAREER_PAGE_COPY.processTitle}</h2>
            <p className="page-copy text-body mt-5">{CAREER_PAGE_COPY.processDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CAREER_PAGE_COPY.processSteps.map((step, index) => (
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

      <section className="container px-6 2xl:px-0 section-y">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="typ-section text-strong">{CAREER_PAGE_COPY.openingsTitle}</h2>
          <p className="typ-label text-body">
            {CAREER_PAGE_COPY.openingsAvailableTemplate.replace("{count}", String(CAREER_PAGE_JOBS.length))}
          </p>
        </div>

        <div className="space-y-4">
          {CAREER_PAGE_JOBS.map((job) => (
            <JobCard
              key={`${job.title}-${job.department}`}
              title={job.title}
              department={job.department}
              location={job.location}
            />
          ))}
        </div>

        <div className="shell-card mt-10 p-6">
          <h3 className="typ-h3 text-strong">{CAREER_PAGE_COPY.fallbackTitle}</h3>
          <p className="page-copy-sm text-body mt-3 max-w-2xl">
            {CAREER_PAGE_COPY.fallbackDescription}
          </p>
          <a href={`mailto:${CAREER_PAGE_COPY.careersEmail}`} className="link-arrow mt-5">
            {CAREER_PAGE_COPY.careersEmail}
          </a>
        </div>
      </section>

      <section className="container px-6 2xl:px-0 section-y-sm">
        <div className="shell-dark-cta-panel grid gap-6 lg:grid-cols-[1.1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <h2 className="typ-section text-inverse">{CAREER_PAGE_COPY.supportTitle}</h2>
            <p className="page-copy text-inverse-body mt-4">{CAREER_PAGE_COPY.supportDescription}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">
              {CAREER_PAGE_COPY.supportPrimaryCta}
            </Link>
            <Link href="/planning" className="btn-outline-light">
              {CAREER_PAGE_COPY.supportSecondaryCta}
            </Link>
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}
