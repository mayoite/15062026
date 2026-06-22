import type { Metadata } from "next";
import { RepoStorePageView } from "@/components/repo-store/RepoStorePageView";
import { buildPageMetadata } from "@/lib/site-data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Repo Store",
  description:
    "Current repository map and target operating model for the Oando platform.",
  path: "/repo-store",
  image: "/logo-v2.webp",
});

export default function RepoStorePage() {
  return <RepoStorePageView />;
}
