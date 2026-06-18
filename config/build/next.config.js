const resolvedSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  process.env.URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const configuredAssetBaseUrl =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL || process.env.ASSET_BASE_URL || "";

const parsedAssetBaseUrl = (() => {
  try {
    return configuredAssetBaseUrl ? new URL(configuredAssetBaseUrl) : null;
  } catch {
    return null;
  }
})();

const useUnoptimizedImages =
  process.env.NEXT_IMAGE_UNOPTIMIZED === "1" ||
  process.env.NEXT_IMAGE_UNOPTIMIZED === "true";

const firstPartyAssetHost = process.env.NEXT_PUBLIC_ASSET_HOSTNAME?.trim();

const imageRemotePatterns = [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
];

if (firstPartyAssetHost) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: firstPartyAssetHost,
    pathname: "/**",
  });
}

if (parsedAssetBaseUrl) {
  const normalizedBasePath = parsedAssetBaseUrl.pathname.replace(/\/+$/, "");
  imageRemotePatterns.push({
    protocol: parsedAssetBaseUrl.protocol.replace(":", ""),
    hostname: parsedAssetBaseUrl.hostname,
    pathname: `${normalizedBasePath || ""}/**`,
  });
}

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-require-imports
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("fs");

const findRepoRoot = (dir) => {
  if (fs.existsSync(path.join(dir, "node_modules", "next"))) return dir;
  const parent = path.dirname(dir);
  return parent === dir ? dir : findRepoRoot(parent);
};

const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: resolvedSiteUrl,
    NEXT_PUBLIC_ASSET_BASE_URL:
      process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
      process.env.ASSET_BASE_URL ||
      "",
  },
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/workstations/configurator",
        destination: "/catalog",
        permanent: true,
      },
      {
        source: "/products/oando-chairs",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-chairs/:slug",
        destination: "/products/seating/:slug",
        permanent: true,
      },
      {
        source: "/products/oando-other-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-other-seating/:slug",
        destination: "/products/seating/:slug",
        permanent: true,
      },
      {
        source: "/products/oando-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/oando-workstations",
        destination: "/products/workstations",
        permanent: true,
      },
      {
        source: "/products/oando-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/oando-storage",
        destination: "/products/storages",
        permanent: true,
      },
      {
        source: "/products/oando-soft-seating",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/oando-collaborative",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/oando-educational",
        destination: "/products/education",
        permanent: true,
      },
      {
        source: "/products/chairs-mesh",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/chairs-others",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/cafe-seating",
        destination: "/products/seating",
        permanent: true,
      },
      {
        source: "/products/desks-cabin-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/meeting-conference-tables",
        destination: "/products/tables",
        permanent: true,
      },
      {
        source: "/products/others-1",
        destination: "/products/soft-seating",
        permanent: true,
      },
      {
        source: "/products/others-2",
        destination: "/products/seating",
        permanent: true,
      },
      // Legacy planner URLs (app/buddy-planner + app/oando-planner archived)
      { source: "/oando-planner", destination: "/planner/", permanent: true },
      { source: "/oando-planner/canvas", destination: "/planner/canvas/", permanent: true },
      { source: "/oando-planner/guest", destination: "/planner/guest/", permanent: true },
      { source: "/oando-planner/onboarding", destination: "/planner/", permanent: true },
      { source: "/oando-planner/dashboard", destination: "/dashboard/", permanent: true },
      { source: "/oando-planner/shared", destination: "/planner/canvas/", permanent: true },
      { source: "/oando-planner/login", destination: "/login/", permanent: true },
      { source: "/buddy-planner", destination: "/planner/canvas/", permanent: true },
      { source: "/buddy-planner/guest", destination: "/planner/guest/", permanent: true },
      { source: "/buddy-planner/editor", destination: "/planner/canvas/", permanent: true },
      { source: "/buddy-planner/onboarding", destination: "/planner/", permanent: true },
      { source: "/buddy-planner/dashboard", destination: "/dashboard/", permanent: true },
      { source: "/buddy-planner/login", destination: "/login/", permanent: true },
      { source: "/buddy-planner/:path*", destination: "/planner/canvas/", permanent: true },
      { source: "/oando-planner/:path*", destination: "/planner/", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    unoptimized: useUnoptimizedImages,
    remotePatterns: imageRemotePatterns,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "three", "@react-three/fiber", "@react-three/drei"], // PERF-FIX: tree-shake heavy deps,
  },
  typescript: {
    ignoreBuildErrors: false, // PERF-FIX: enforce type safety at build time
  },
  turbopack: {
    root: findRepoRoot(__dirname),
  },
};

module.exports = nextConfig;
