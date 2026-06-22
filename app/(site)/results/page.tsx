import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/analytics/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { loadResultsSnapshot } from "./resultsData";
import { ResultsHubPageView } from "./ResultsHubPageView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Results Hub",
  description: "Filesystem-backed mini site for generated test, coverage, audit, and screenshot output.",
  path: "/results",
  image: "/logo-v2.webp",
});

export default function ResultsPage() {
  const snapshot = loadResultsSnapshot();

  return <ResultsHubPageView snapshot={snapshot} />;
}
