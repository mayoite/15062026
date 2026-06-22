import type { Metadata } from "next";
import { SITE_BRAND } from "@/lib/site-data/brand";
import { SITE_CONTACT } from "@/lib/site-data/contact";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
  /** Set false to skip hreflang alternates (e.g. legal/utility pages). */
  alternates?: boolean;
};

/** Locale → BCP 47 language tag used for OG / hreflang. */
export const LOCALE_HREFLANG: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};

/**
 * Build hreflang alternates for a canonical path. The default locale (en)
 * maps to the bare path; other locales are prefixed with the locale segment.
 */
export function buildLocaleAlternates(siteUrl: string, path: string) {
  const canonical = canonicalPath(path);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    if (locale === defaultLocale) {
      languages[LOCALE_HREFLANG[locale]] = new URL(canonical, siteUrl).toString();
    } else {
      languages[LOCALE_HREFLANG[locale]] = new URL(
        `/${locale}${canonical === "/" ? "" : canonical}`,
        siteUrl,
      ).toString();
    }
  }
  // x-default points to the default-locale URL.
  languages["x-default"] = new URL(canonical, siteUrl).toString();
  return languages;
}

type PageJsonLdInput = {
  path: string;
  title: string;
  description: string;
  pageType: "WebPage" | "CollectionPage" | "ContactPage" | "ItemPage";
};

type BreadcrumbItem = {
  name: string;
  path: string;
};

/** Paths for trailingSlash routes — homepage stays `/`, others end with `/`. */
export function canonicalPath(path: string): string {
  if (!path || path === "/") return "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export function buildCanonicalUrl(siteUrl: string, path: string): string {
  return new URL(canonicalPath(path), siteUrl).toString();
}

export function buildSiteMetadata(siteUrl: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    applicationName: SITE_BRAND.companyName,
    title: {
      default: SITE_BRAND.defaultTitle,
      template: `%s | ${SITE_BRAND.titleSuffix}`,
    },
    description: SITE_BRAND.description,
    keywords: [
      "office furniture Patna",
      "premium office furniture Bihar",
      "ergonomic chairs India",
      "modular workstations Patna",
      "office furniture Bihar",
      "One&Only",
      "oando furniture",
      "office chairs Patna",
      "meeting tables Bihar",
      "office furniture Jharkhand",
      "storage solutions India",
    ],
    authors: [{ name: SITE_BRAND.companyName, url: siteUrl }],
    creator: SITE_BRAND.companyName,
    publisher: SITE_BRAND.companyName,
    category: "business",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    robots: { index: true, follow: true },
    icons: {
      icon: "/catalog-logo-sharp.webp",
      shortcut: "/catalog-logo-sharp.webp",
    },
    alternates: {
      canonical: "/",
      languages: buildLocaleAlternates(siteUrl, "/"),
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      alternateLocale: ["hi_IN", "fr_FR", "de_DE", "es_ES"],
      url: siteUrl,
      siteName: SITE_BRAND.siteName,
      title: SITE_BRAND.defaultTitle,
      description: SITE_BRAND.description,
      images: [
        {
          url: SITE_BRAND.ogImage,
          width: 1200,
          height: 630,
          alt: SITE_BRAND.defaultTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_BRAND.defaultTitle,
      description: SITE_BRAND.description,
      images: [SITE_BRAND.ogImage],
    },
  };
}

export function buildPageMetadata(siteUrl: string, input: PageMetadataInput): Metadata {
  const canonicalUrl = buildCanonicalUrl(siteUrl, input.path);
  const image = input.image || SITE_BRAND.ogImage;
  const includeAlternates = input.alternates !== false;

  return {
    metadataBase: new URL(siteUrl),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: {
      canonical: canonicalUrl,
      ...(includeAlternates ? { languages: buildLocaleAlternates(siteUrl, input.path) } : {}),
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      type: input.type || "website",
      locale: "en_IN",
      alternateLocale: ["hi_IN", "fr_FR", "de_DE", "es_ES"],
      siteName: SITE_BRAND.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function buildPageJsonLd(siteUrl: string, input: PageJsonLdInput) {
  const pageUrl = buildCanonicalUrl(siteUrl, input.path);

  return {
    "@context": "https://schema.org",
    "@type": input.pageType,
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: input.title,
    description: input.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${siteUrl}#website` },
    about: { "@id": `${siteUrl}#organization` },
  };
}

export function buildBreadcrumbJsonLd(siteUrl: string, items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(siteUrl, item.path),
    })),
  };
}

export function buildGlobalJsonLd(siteUrl: string) {
  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const localBusinessId = `${siteUrl}#localbusiness`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_BRAND.companyName,
        url: siteUrl,
        logo: `${siteUrl}/logo-v2.webp`,
        description: SITE_BRAND.organizationDescription,
        email: SITE_CONTACT.salesEmail,
        telephone: SITE_CONTACT.salesPhone,
        areaServed: SITE_CONTACT.areaServed,
        sameAs: [siteUrl, ...SITE_CONTACT.socialLinks.map((link) => link.href)],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: SITE_CONTACT.salesPhone,
            contactType: "sales",
            areaServed: "IN",
            availableLanguage: [...locales],
          },
          {
            "@type": "ContactPoint",
            telephone: SITE_CONTACT.supportPhone,
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: [...locales],
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: SITE_BRAND.siteName,
        description: SITE_BRAND.description,
        inLanguage: "en-IN",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "FurnitureStore",
        "@id": localBusinessId,
        name: SITE_BRAND.companyName,
        url: siteUrl,
        description: SITE_BRAND.localBusinessDescription,
        parentOrganization: { "@id": organizationId },
        address: {
          "@type": "PostalAddress",
          ...SITE_CONTACT.address,
        },
        geo: { "@type": "GeoCoordinates", ...SITE_CONTACT.geo },
        telephone: SITE_CONTACT.salesPhone,
        email: SITE_CONTACT.salesEmail,
        openingHours: SITE_CONTACT.openingHours,
        priceRange: SITE_CONTACT.priceRange,
        areaServed: SITE_CONTACT.areaServed,
      },
    ],
  };
}

/**
 * Standalone LocalBusiness (FurnitureStore) JSON-LD for the homepage.
 * Mirrors the entry in `buildGlobalJsonLd` but returns a single node so it
 * can be embedded alongside a WebPage node on the homepage.
 */
export function buildLocalBusinessJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FurnitureStore",
    "@id": `${siteUrl}#localbusiness`,
    name: SITE_BRAND.companyName,
    url: siteUrl,
    description: SITE_BRAND.localBusinessDescription,
    image: `${siteUrl}${SITE_BRAND.ogImage}`,
    logo: `${siteUrl}/logo-v2.webp`,
    address: {
      "@type": "PostalAddress",
      ...SITE_CONTACT.address,
    },
    geo: { "@type": "GeoCoordinates", ...SITE_CONTACT.geo },
    telephone: SITE_CONTACT.salesPhone,
    email: SITE_CONTACT.salesEmail,
    openingHours: SITE_CONTACT.openingHours,
    priceRange: SITE_CONTACT.priceRange,
    areaServed: SITE_CONTACT.areaServed,
    sameAs: SITE_CONTACT.socialLinks.map((link) => link.href),
  };
}
