import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { SITE_CONTACT } from "@/lib/site-data/contact";
import {
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
} from "@/lib/site-data/routeCopy";
import { SERVICE_PAGE_METADATA } from "@/lib/site-data/routeMetadata";

export const metadata = SERVICE_PAGE_METADATA;

export default function ServicePage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={SERVICE_PAGE_COPY.heroTitle}
        subtitle={SERVICE_PAGE_COPY.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/usha-hero.webp"
      />

      <section className="w-full section-y">
        <div className="container px-6 2xl:px-0">
          <SectionIntro
            kicker={SERVICE_PAGE_COPY.frameworkKicker}
            title={SERVICE_PAGE_COPY.frameworkTitle}
            className="mb-12"
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {SERVICE_PAGE_PILLARS.map((item) => (
              <article key={item.title} className="shell-card p-6">
                <h3 className="typ-h3 text-strong">{item.title}</h3>
                <p className="page-copy text-body mt-3">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scheme-section-soft scheme-border w-full border-y section-y">
        <div className="container px-6 2xl:px-0">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <SectionIntro
                kicker={SERVICE_PAGE_COPY.channelsKicker}
                title={SERVICE_PAGE_COPY.channelsTitle}
              />
              <div className="mt-6 space-y-4">
                {SERVICE_PAGE_CHANNELS.map((channel) => {
                  if (channel.kind === "supportPhone") {
                    const phone = SITE_CONTACT.supportPhone;
                    return (
                      <a
                        key={channel.label}
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="shell-card shell-accent-border-hover block px-5 py-4"
                      >
                        <p className="typ-label text-body">{channel.label}</p>
                        <p className="typ-h3 text-strong mt-1">{phone}</p>
                      </a>
                    );
                  }

                  if (channel.kind === "salesEmail") {
                    const email = SITE_CONTACT.salesEmail;
                    return (
                      <a
                        key={channel.label}
                        href={`mailto:${email}`}
                        className="shell-card shell-accent-border-hover block px-5 py-4"
                      >
                        <p className="typ-label text-body">{channel.label}</p>
                        <p className="typ-h3 text-strong mt-1">{email}</p>
                      </a>
                    );
                  }

                  return (
                    <a
                      key={channel.label}
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shell-card shell-accent-border-hover block px-5 py-4"
                    >
                      <p className="typ-label text-body">{channel.label}</p>
                      <p className="typ-h3 text-strong mt-1">{channel.value}</p>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="shell-card p-6">
              <p className="typ-label text-body mb-3">{SERVICE_PAGE_COPY.supportKicker}</p>
              <p className="page-copy text-body">
                {SERVICE_PAGE_COPY.supportDescription}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackedLink href="/contact" label={SERVICE_PAGE_COPY.primaryCta} surface="service-support-card" className="btn-primary">
                  {SERVICE_PAGE_COPY.primaryCta}
                </TrackedLink>
                <TrackedLink href="/tracking" label={SERVICE_PAGE_COPY.secondaryCta} surface="service-support-card" className="btn-outline">
                  {SERVICE_PAGE_COPY.secondaryCta}
                </TrackedLink>
                <TrackedLink href="/downloads" label={SERVICE_PAGE_COPY.tertiaryCta} surface="service-support-card" className="btn-outline">
                  {SERVICE_PAGE_COPY.tertiaryCta}
                </TrackedLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-6 md:py-10">
        <div className="container px-6 2xl:px-0">
          <RouteCtaBand
            kicker={SERVICE_PAGE_COPY.supportDeskKicker}
            title={SERVICE_PAGE_COPY.supportDeskTitle}
            description={SERVICE_PAGE_COPY.supportDeskDescription}
            actions={[
              { href: "/downloads", label: SERVICE_PAGE_COPY.tertiaryCta },
              { href: "/contact", label: SERVICE_PAGE_COPY.primaryCta, variant: "primary" },
            ]}
          />
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}
