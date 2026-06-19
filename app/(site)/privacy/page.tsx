import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { LEGAL_PAGE_COPY } from "@/data/site/routeCopy";
import { SITE_CONTACT } from "@/data/site/contact";

const COOKIE_ROWS = [
  {
    name: "oando_cookie_consent",
    category: "Essential",
    purpose: "Stores your cookie preference so we do not ask on every visit.",
    duration: "180 days",
  },
  {
    name: "oando_seo_landing",
    category: "Analytics & attribution",
    purpose: "Stores the landing page path for attribution reporting.",
    duration: "180 days",
  },
  {
    name: "oando_seo_referrer",
    category: "Analytics & attribution",
    purpose: "Stores the referring URL or source site.",
    duration: "180 days",
  },
  {
    name: "oando_seo_source",
    category: "Analytics & attribution",
    purpose: "Stores the traffic source such as direct, Google, or LinkedIn.",
    duration: "180 days",
  },
  {
    name: "oando_seo_medium",
    category: "Analytics & attribution",
    purpose: "Stores the traffic medium such as referral, none, or campaign medium.",
    duration: "180 days",
  },
  {
    name: "oando_seo_campaign",
    category: "Analytics & attribution",
    purpose: "Stores the UTM campaign value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_term",
    category: "Analytics & attribution",
    purpose: "Stores the UTM term value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_content",
    category: "Analytics & attribution",
    purpose: "Stores the UTM content value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_locale",
    category: "Analytics & attribution",
    purpose: "Stores the current site locale for attribution context.",
    duration: "180 days",
  },
] as const;

export default function PrivacyPage() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={LEGAL_PAGE_COPY.privacy.title}
        subtitle={LEGAL_PAGE_COPY.privacy.heroSubtitle}
        showButton={false}
        backgroundImage="/images/hero/hero-3.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="shell-dark-cta-panel p-7 md:p-9">
            <p className="typ-label text-inverse-muted">{LEGAL_PAGE_COPY.privacy.overviewKicker}</p>
            <h2 className="typ-section mt-3 text-inverse">{LEGAL_PAGE_COPY.privacy.overviewTitle}</h2>
            <p className="page-copy text-inverse-body mt-4">
              {LEGAL_PAGE_COPY.privacy.overviewDescription}
            </p>

            <div className="legal-aside-divider">
              <h3 className="typ-label text-inverse-muted">
                {LEGAL_PAGE_COPY.privacy.commitmentsTitle}
              </h3>
              <ul className="text-inverse-body mt-4 space-y-3 text-sm leading-7">
                {LEGAL_PAGE_COPY.privacy.commitments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                Contact team
              </Link>
              <Link href="/downloads" className="btn-outline-light">
                Open Resource Desk
              </Link>
            </div>
          </aside>

          <div className="shell-card p-7 md:p-9">
            <div className="space-y-6">
              {LEGAL_PAGE_COPY.privacy.intro.map((paragraph) => (
                <p key={paragraph} className="page-copy text-body">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="scheme-border mt-10 grid gap-8 border-t pt-10 md:grid-cols-2">
              <article className="space-y-4">
                <h2 className="typ-card text-strong">How we use your information</h2>
                <p className="page-copy-sm text-body">
                  We use submitted information to respond to quote requests, follow up on workspace
                  enquiries, improve service quality, and maintain internal records of sales and
                  support conversations.
                </p>
                <p className="page-copy-sm text-body">
                  We do not sell your personal information. We may disclose information when
                  required by law, to investigate misuse, or to maintain and secure our services.
                </p>
              </article>

              <article className="space-y-4">
                <h2 className="typ-card text-strong">Links and security</h2>
                <p className="page-copy-sm text-body">
                  Our website may link to external websites. Their privacy practices are separate
                  from ours, so you should review their policies before sharing information there.
                </p>
                <p className="page-copy-sm text-body">
                  We use reasonable technical and organisational measures to protect the information
                  we collect. No system can guarantee absolute security, but we take steps to
                  reduce risk and restrict unnecessary access.
                </p>
              </article>
            </div>

            <div className="shell-card-soft mt-10 overflow-hidden">
              <div className="px-6 py-6 md:px-8">
                <h2 className="typ-card text-strong">
                  Cookies, tags, and similar technologies
                </h2>
                <p className="page-copy-sm text-body mt-3">
                  We use one essential cookie to remember your consent choice and optional analytics
                  and attribution cookies to record landing page, referrer, and UTM parameters when
                  you accept them in the cookie banner.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="legal-cookie-table">
                  <thead>
                    <tr>
                      <th>Cookie</th>
                      <th>Category</th>
                      <th>Purpose</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COOKIE_ROWS.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.category}</td>
                        <td>{row.purpose}</td>
                        <td>{row.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="scheme-border mt-10 flex flex-col gap-4 border-t pt-8 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="typ-card text-strong">Questions about privacy?</h2>
                <p className="page-copy-sm text-body mt-2">
                  For privacy questions or requests, email{" "}
                  <a
                    href={`mailto:${SITE_CONTACT.salesEmail}`}
                    className="font-semibold text-primary transition-colors hover:text-primary-hover"
                  >
                    {SITE_CONTACT.salesEmail}
                  </a>
                  . The latest version of this policy will always be published on this page.
                </p>
              </div>
              <Link href="/contact" className="btn-outline">
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}


