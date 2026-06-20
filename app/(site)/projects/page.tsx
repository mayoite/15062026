import Link from "next/link";
import { Hero } from "@/components/home/Hero";
import { ClientBadge } from "@/components/ClientBadge";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PROJECTS_PAGE_CLIENTS, PROJECTS_PAGE_COPY } from "@/data/site/routeCopy";
import { getBusinessStats } from '@/features/crm/businessStats';
import { formatKpiAsOf, formatKpiValuePlus } from "@/lib/kpiFormat";
import { PROJECTS_PAGE_METADATA } from "@/data/site/routeMetadata";

export const metadata = PROJECTS_PAGE_METADATA;

export default async function ProjectsPage() {
  const { stats, source } = await getBusinessStats();
  const clientsValue = formatKpiValuePlus(stats.clientOrganisations);
  const projectsValue = formatKpiValuePlus(stats.projectsDelivered);
  const sectorsValue = formatKpiValuePlus(stats.sectorsServed);
  const asOfLabel = formatKpiAsOf(stats.asOfDate);

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <KpiIntegrityMonitor page="projects" source={source} stats={stats} />
      <Hero
        variant="small"
        title={PROJECTS_PAGE_COPY.heroTitle}
        subtitle={PROJECTS_PAGE_COPY.heroSubtitleTemplate.replace("{clients}", clientsValue)}
        showButton={false}
        backgroundImage="/images/hero/hero-2.webp"
      />

      <section className="container-wide section-y">
        <div className="stats-block scheme-border mb-16 grid grid-cols-1 gap-6 border-b pb-16 sm:grid-cols-3">
          {[
            { id: "client-organisations", value: clientsValue, label: "Client Organisations" },
            { id: "projects-delivered", value: projectsValue, label: "Projects Delivered" },
            { id: "sectors-served", value: sectorsValue, label: "Sectors Served" },
          ].map((stat) => (
            <div key={stat.label} className="shell-card-soft px-6 py-7 text-center">
              <p data-testid={`kpi-${stat.id}-projects`} className="typ-stat text-strong mb-1">
                {stat.value}
              </p>
              <p className="stats-block__label">{stat.label}</p>
            </div>
          ))}
        </div>

        <p
          data-testid="kpi-as-of-projects"
          className="text-muted -mt-10 mb-16 text-center text-xs font-medium tracking-wide"
        >
          {asOfLabel}
        </p>

        <div className="shell-card mb-12 p-8 md:p-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="typ-label mb-3 text-body">{PROJECTS_PAGE_COPY.featuredLabel}</p>
              <h2 className="typ-section text-strong">{PROJECTS_PAGE_COPY.featuredTitle}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/trusted-by" className="btn-outline">
                Trusted by
              </Link>
              <Link href="/portfolio" className="btn-primary">
                View portfolio
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {PROJECTS_PAGE_CLIENTS.slice(0, 12).map((client) => (
              <ClientBadge key={client.name} {...client} />
            ))}
          </div>
        </div>

        <div className="scheme-border border-t pt-12">
          <p className="typ-label mb-6 text-body">{PROJECTS_PAGE_COPY.allLabel}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {PROJECTS_PAGE_CLIENTS.slice(12).map((client) => (
              <ClientBadge key={client.name} {...client} />
            ))}
          </div>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}


