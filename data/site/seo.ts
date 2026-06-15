import type { Metadata } from "next";
import { SITE_BRAND } from "@/data/site/brand";
import { SITE_CONTACT } from "@/data/site/contact";

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
};

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
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "en_IN",
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
  const canonicalUrl = new URL(input.path, siteUrl).toString();
  const image = input.image || SITE_BRAND.ogImage;

  return {
    metadataBase: new URL(siteUrl),
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonicalUrl,
      type: input.type || "website",
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
  const pageUrl = new URL(input.path, siteUrl).toString();

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
      item: new URL(item.path, siteUrl).toString(),
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
        logo: `${siteUrl}/logo.webp`,
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
            availableLanguage: ["en", "hi"],
          },
          {
            "@type": "ContactPoint",
            telephone: SITE_CONTACT.supportPhone,
            contactType: "customer support",
            areaServed: "IN",
            availableLanguage: ["en", "hi"],
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
