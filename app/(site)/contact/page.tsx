import type { Metadata } from "next";
import { ContactPageView } from "@/components/contact/ContactPageView";
import { CONTACT_PAGE_COPY } from "@/lib/site-data/routeCopy";
import { buildPageMetadata } from "@/lib/site-data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Contact us",
  description: CONTACT_PAGE_COPY.heroSubtitle,
  path: "/contact",
  image: "/images/hero/tvs-patna-enhanced.webp",
});

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const intent = firstValue(resolvedSearchParams.intent);
  const source = firstValue(resolvedSearchParams.source);

  return <ContactPageView intent={intent} source={source} />;
}
