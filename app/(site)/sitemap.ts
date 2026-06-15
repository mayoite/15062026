import type { MetadataRoute } from "next";
import { getCatalog } from '@/features/catalog/getProducts';
import { buildRequestedCategoryCatalog } from '@/features/catalog/categories';
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL.replace(/\/+$/, "");

const STATIC_PATHS = [
  "/",
  "/about",
  "/products",
  "/solutions",
  "/projects",
  "/portfolio",
  "/trusted-by",
  "/gallery",
  "/contact",
  "/compare",
  "/service",
  "/showrooms",
  "/sustainability",
  "/refund-and-return-policy",
  "/privacy",
  "/terms",
  "/quote-cart",
  "/planner",
  "/planner/help",
  "/planner/features",
  "/planner/features/blueprint",
  "/planner/features/measure",
  "/planner/features/catalog",
  "/planner/features/3d-view",
  "/planner/features/ai-assist",
  "/planner/features/export",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  try {
    const catalog = buildRequestedCategoryCatalog(await getCatalog());
    for (const category of catalog) {
      entries.push({
        url: `${BASE_URL}/products/${category.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });

      for (const series of category.series) {
        for (const product of series.products) {
          const slug = product.slug || product.id;
          entries.push({
            url: `${BASE_URL}/products/${category.id}/${slug}`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Keep static sitemap if catalog fetch fails.
  }

  return entries;
}

