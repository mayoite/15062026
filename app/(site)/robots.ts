import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

const BASE_URL = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: [`${BASE_URL.replace(/\/+$/, "")}/sitemap.xml`],
    host: BASE_URL.replace(/\/+$/, ""),
  };
}

