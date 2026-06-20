import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Hero } from "@/components/home/Hero";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";

const SOLUTION_COPY: Record<string, { title: string; description: string }> = {
  seating: {
    title: "Seating Solutions",
    description: "Ergonomic seating solutions for focused and collaborative work.",
  },
  workstations: {
    title: "Workstation Solutions",
    description:
      "Modular workstation systems for growing teams and evolving office layouts.",
  },
  tables: {
    title: "Table Solutions",
    description:
      "Meeting, cabin, and training table solutions for modern office workflows.",
  },
  storages: {
    title: "Storage Solutions",
    description: "Secure and flexible storage systems for organized workplaces.",
  },
  "soft-seating": {
    title: "Soft Seating Solutions",
    description:
      "Lounge and collaborative seating solutions for breakout and reception areas.",
  },
  education: {
    title: "Education Solutions",
    description:
      "Furniture solutions for classrooms, libraries, hostels, and auditoriums.",
  },
};

type SolutionsParams = Promise<{ category: string }>;

function getSolutionEntry(category: string) {
  return SOLUTION_COPY[category];
}

export function generateStaticParams() {
  return Object.keys(SOLUTION_COPY).map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: SolutionsParams;
}): Promise<Metadata> {
  const { category } = await params;
  const entry = getSolutionEntry(category);

  if (!entry) {
    return buildPageMetadata(SITE_URL, {
      title: "Solutions",
      description: "Tailored furniture solutions for every industry.",
      path: "/solutions",
    });
  }

  return buildPageMetadata(SITE_URL, {
    title: entry.title,
    description: `${entry.description} Built for offices in Patna, Bihar and across India.`,
    path: `/solutions/${category}`,
  });
}

export default async function SolutionsCategoryPage({
  params,
}: {
  params: SolutionsParams;
}) {
  const { category } = await params;
  const entry = getSolutionEntry(category);

  if (!entry) {
    notFound();
  }

  return (
    <section className="scheme-page flex min-h-screen flex-col items-center">
      <Hero
        variant="small"
        title={entry.title}
        subtitle={entry.description}
        showButton={false}
        backgroundImage="/images/hero/hero-2.webp"
      />

      <section className="container px-6 2xl:px-0 section-y">
        <SectionIntro
          kicker="Solution category"
          title={entry.title}
          description={`${entry.description} Browse the live product catalog or speak with the planning desk for a workspace layout aligned to this category.`}
          className="mb-10"
        />

        <div className="flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary">
            Browse products
          </Link>
          <Link href="/solutions" className="btn-outline">
            All solutions
          </Link>
          <Link href="/contact" className="btn-outline">
            Contact planning desk
          </Link>
        </div>
      </section>

      <ContactTeaser />
    </section>
  );
}
