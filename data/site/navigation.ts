import { SITE_CONTACT } from "@/data/site/contact";
import { PRODUCT_SUITE } from "@/data/site/productSuite";

export const SITE_NAV_LINKS = [
  { label: "Products", href: "/products", hasMega: true },
  { label: "Solutions", href: "/solutions" },
  { label: "Planner", href: PRODUCT_SUITE.planner.routes.landing },
  { label: "Projects", href: "/projects" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Trusted by", href: "/trusted-by" },
  { label: "About", href: "/about" },
  { label: "Sustainability", href: "/sustainability" },
] as const;

export const SITE_CTA_LINKS = [
  { label: "Get Quote", href: "/contact", variant: "primary" as const },
  { label: "View Products", href: "/products", variant: "outline" as const },
] as const;

export const SITE_NAV_FEATURED_CARDS = [
  {
    title: "Ergonomic Seating",
    description: "Mesh chairs and premium seating for long working hours.",
    href: "/products/seating",
    image: "/images/products/imported/fluid/image-1.webp",
  },
  {
    title: "Modular Workstations",
    description: "Scalable desking systems for growing teams.",
    href: "/products/workstations",
    image: "/images/products/imported/cabin/image-1.webp",
  },
  {
    title: "Need Help Choosing?",
    description: "Use AI-assisted search to find the right furniture faster.",
    href: "/products",
    image: "/images/products/imported/cocoon/image-1.webp",
  },
] as const;

export const SITE_NAV_SEARCH_FALLBACK_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/solutions", label: "Solutions" },
  { href: PRODUCT_SUITE.planner.routes.landing, label: "Planner" },
  { href: PRODUCT_SUITE.shared.routes.access, label: "Workspace access" },
  { href: "/projects", label: "Projects" },
] as const;

type FooterLink = { href: string; label: string };

function normalizeFooterHref(href: string): string {
  if (href.length > 1 && href.endsWith("/")) return href.slice(0, -1);
  return href;
}

/** Drop duplicate destinations across footer columns (first label wins). */
function buildFooterNav(
  sections: { heading: string; links: readonly FooterLink[] }[],
): { heading: string; links: FooterLink[] }[] {
  const globalSeen = new Set<string>();

  return sections
    .map((section) => ({
      heading: section.heading,
      links: section.links.filter((link) => {
        const key = normalizeFooterHref(link.href);
        if (globalSeen.has(key)) return false;
        globalSeen.add(key);
        return true;
      }),
    }))
    .filter((section) => section.links.length > 0);
}

export const SITE_FOOTER_NAV = buildFooterNav([
  {
    heading: "Products",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/solutions", label: "Solutions" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/trusted-by", label: "Trusted By" },
      { href: "/projects", label: "Projects" },
      { href: "/portfolio", label: "Portfolio" },
      { href: "/sustainability", label: "Sustainability" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: PRODUCT_SUITE.planner.routes.landing, label: "Workspace Planner" },
      { href: "/contact", label: "Contact" },
      { href: "/service", label: "After Sales" },
      { href: "/showrooms", label: "Showrooms" },
    ],
  },
  {
    heading: "Workspace",
    links: [
      { href: PRODUCT_SUITE.shared.routes.access, label: "Access" },
      { href: PRODUCT_SUITE.shared.routes.login, label: "Login" },
      { href: PRODUCT_SUITE.shared.routes.chooser, label: "Choose Product" },
      { href: PRODUCT_SUITE.shared.routes.dashboard, label: "Dashboard" },
      { href: PRODUCT_SUITE.planner.routes.portal, label: "Member Portal" },
      { href: PRODUCT_SUITE.admin.routes.landing, label: "Admin" },
      { href: "/ops/customer-queries", label: "Ops" },
    ],
  },
]);

export const SITE_SOCIAL_LINKS = SITE_CONTACT.socialLinks;
