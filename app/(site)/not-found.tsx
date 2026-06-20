import type { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/data/site/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Page Not Found (404) | One&Only",
  description:
    "The page you were looking for could not be found. Browse our office furniture catalog, workspace planner, or contact our team for help.",
  path: "/404",
  alternates: false,
});

const POPULAR_LINKS = [
  { href: "/", label: "Homepage" },
  { href: "/products", label: "Product catalog" },
  { href: "/planner", label: "Workspace planner" },
  { href: "/solutions", label: "Workspace solutions" },
  { href: "/contact", label: "Contact sales" },
  { href: "/downloads", label: "Resource desk" },
];

export default function NotFound() {
  return (
    <section className="scheme-page flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <p className="typ-label text-body mb-4">Error 404</p>
      <h1 className="typ-section text-strong mb-4">
        We could not find that page
      </h1>
      <p className="page-copy text-body mx-auto mb-10 max-w-xl">
        The page may have moved, been renamed, or no longer exists. Use the links
        below to get back on track, or contact our team for direct help.
      </p>
      <nav aria-label="Popular pages" className="flex flex-wrap items-center justify-center gap-3">
        {POPULAR_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="btn-outline">
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
