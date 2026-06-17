import {
  Catalog_CATEGORY_ORDER,
  buildCatalogCategoryNav,
} from '@/features/catalog/categories';
import { SITE_CONTACT } from "@/data/site/contact";
import { PRODUCT_SUITE } from "@/data/site/productSuite";

export const SITE_NAV_LINKS = [
  { label: "Products", href: "/products", hasMega: true },
  { label: "Solutions", href: "/solutions" },
  { label: "Planner", href: PRODUCT_SUITE.planner.routes.landing },
  { label: "Configurator", href: PRODUCT_SUITE.configurator.routes.landing },
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
  { href: PRODUCT_SUITE.configurator.routes.landing, label: "Configurator" },
  { href: PRODUCT_SUITE.shared.routes.access, label: "Workspace access" },
  { href: "/projects", label: "Projects" },
] as const;

const productLinks = [
  { href: "/products", label: "All Products" },
  ...buildCatalogCategoryNav(Catalog_CATEGORY_ORDER),
];

export const SITE_FOOTER_NAV = [
  {
    heading: "Products",
    links: productLinks,
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
      { href: "/service", label: "After Sales" },
      { href: "/contact", label: "Contact Us" },
      { href: "/planning", label: "Planning Service" },
      { href: PRODUCT_SUITE.planner.routes.landing, label: "Space Planner" },
    ],
  },
] as const;

export const SITE_SOCIAL_LINKS = SITE_CONTACT.socialLinks;
