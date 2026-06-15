const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "").trim();
const normalizedConfiguredSiteUrl = configuredSiteUrl.replace(/\/+$/, "");
const isVercelPreviewDomain = /^https?:\/\/[^/]*\.vercel\.app$/i.test(normalizedConfiguredSiteUrl);

export const SITE_URL = (
  normalizedConfiguredSiteUrl && !isVercelPreviewDomain
    ? normalizedConfiguredSiteUrl
    : "https://oando.co.in"
).replace(/\/+$/, "");
