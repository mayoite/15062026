export {
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildGlobalJsonLd,
  buildPageJsonLd,
  buildPageMetadata,
  buildSiteMetadata,
  canonicalPath,
} from "@/lib/site-data/seo";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

export type ItemListEntry = {
  name: string;
  item: string;
};

export type PageJsonLdInput = {
  path: string;
  title: string;
  description: string;
  pageType: "WebPage" | "CollectionPage" | "ContactPage" | "ItemPage";
};

export type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
};

export type ProductJsonLdInput = {
  name: string;
  description: string;
  url: string;
  image: string;
};

export function buildFAQJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildItemListJsonLd(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: entry.name,
      item: entry.item,
    })),
  };
}

export function buildOpenGraph(data: {
  title: string;
  description: string;
  url: string;
  image: string;
}) {
  return {
    title: data.title,
    description: data.description,
    url: data.url,
    images: [data.image],
  };
}

export function buildOrganizationJsonLd(data: {
  name: string;
  url: string;
  logo: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: data.name,
    url: data.url,
    logo: data.logo,
  };
}

export function buildProductJsonLd(data: {
  name: string;
  description: string;
  url: string;
  image: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description,
    url: data.url,
    image: data.image,
  };
}
