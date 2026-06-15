import Image from "next/image";
import Link from "next/link";
import type { BusinessStats } from "@/lib/types/businessStats";
import { formatKpiValuePlus } from "@/lib/kpiFormat";
import { HOMEPAGE_TRUST_CONTENT } from "@/data/site/homepage";

interface TrustStripProps {
  stats: BusinessStats;
  embedded?: boolean;
  showLogos?: boolean;
  dark?: boolean;
}

export function TrustStrip({
  stats,
  embedded = false,
  showLogos = true,
}: TrustStripProps) {
  const items = [
    {
      value: formatKpiValuePlus(stats.yearsExperience),
      label: "Years of experience",
      testId: "kpi-years-experience",
    },
    {
      value: formatKpiValuePlus(stats.projectsDelivered),
      label: "Projects completed",
      testId: "kpi-projects-delivered",
    },
    {
      value: formatKpiValuePlus(stats.clientOrganisations),
      label: "Corporate clients",
      testId: "kpi-client-organisations",
    },
    {
      value: formatKpiValuePlus(stats.locationsServed),
      label: "Locations serviced",
    },
  ];

  const content = (
    <>
      <div className="stats-block grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map(({ value, label, testId }) => (
          <div
            key={label}
            className="scheme-panel scheme-border rounded-2xl border p-6 text-center"
            {...(testId ? { "data-testid": testId } : {})}
          >
            <p className="typ-stat text-primary">{value}</p>
            <p className="stats-block__label mt-2">{label}</p>
          </div>
        ))}
      </div>

      {showLogos ? (
        <div className="home-hero-trust-bar mt-10 border-t border-theme-soft pt-8">
          <p className="home-hero-trust-bar__label">{HOMEPAGE_TRUST_CONTENT.logoLabel}</p>
          <ul className="home-hero-trust-bar__logos flex flex-wrap items-center gap-x-5 gap-y-3.5">
            {HOMEPAGE_TRUST_CONTENT.logos.map((logo) => (
              <li key={logo.name} className="shrink-0">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={84}
                  height={24}
                  className="home-hero-trust-bar__logo h-6 w-auto max-w-[5.25rem] object-contain"
                />
              </li>
            ))}
          </ul>
          <Link href="/portfolio" className="home-inline-link mt-4 inline-flex items-center gap-1.5">
            {HOMEPAGE_TRUST_CONTENT.projectsCta}
          </Link>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <section className="scheme-section-soft scheme-border w-full border-y section-y">
      <div className="container px-6 2xl:px-0">{content}</div>
    </section>
  );
}
