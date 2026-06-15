import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteRoot = path.join(root, "apps", "site");
const appDir = path.join(siteRoot, "app");
const prerenderManifestPath = path.join(siteRoot, ".next", "prerender-manifest.json");
const appPathsManifestPath = path.join(siteRoot, ".next", "server", "app-paths-manifest.json");
const localCatalogPath = path.join(siteRoot, "data", "site", "localCatalogIndex.json");

function toPosix(value) {
  return value.replaceAll(path.sep, "/");
}

function walk(dir, matcher, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, matcher, results);
      continue;
    }
    if (matcher(fullPath)) {
      results.push(toPosix(path.relative(root, fullPath)));
    }
  }
  return results;
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function classifyPageFile(filePath) {
  if (filePath.startsWith("app/admin/")) return "admin";
  if (filePath.startsWith("app/planner/") || filePath.startsWith("app/planning/")) return "planner";
  if (filePath.startsWith("app/portal/")) return "portal";
  if (filePath.startsWith("app/ops/")) return "ops";
  if (filePath.startsWith("app/products/")) return "products";
  if (filePath.startsWith("app/solutions/")) return "solutions";
  return "other";
}

function classifyStaticRoute(route) {
  if (route === "/admin" || route.startsWith("/admin/")) return "admin";
  if (route === "/planner" || route === "/planning") return "planner";
  if (route === "/portal" || route.startsWith("/portal/")) return "portal";
  if (route.startsWith("/ops/")) return "ops";
  if (route === "/products" || route.startsWith("/products/")) return "products";
  if (route === "/solutions" || route.startsWith("/solutions/")) return "solutions";
  return "other";
}

function addBucketCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

const pageFiles = walk(appDir, (fullPath) => /[\\/]page\.(tsx|ts|js|jsx)$/.test(fullPath)).sort();
const routeFiles = walk(appDir, (fullPath) => /[\\/]route\.(tsx|ts|js|jsx)$/.test(fullPath)).sort();

const prerenderManifest = fs.existsSync(prerenderManifestPath) ? loadJson(prerenderManifestPath) : null;
const appPathsManifest = fs.existsSync(appPathsManifestPath) ? loadJson(appPathsManifestPath) : null;
const localCatalog = fs.existsSync(localCatalogPath) ? loadJson(localCatalogPath) : [];

const staticRoutes = prerenderManifest ? Object.keys(prerenderManifest.routes || {}).sort() : [];
const appPaths = appPathsManifest ? Object.keys(appPathsManifest).sort() : [];

const pageBuckets = {
  admin: [],
  planner: [],
  portal: [],
  ops: [],
  products: [],
  solutions: [],
  other: [],
};

for (const filePath of pageFiles) {
  pageBuckets[classifyPageFile(filePath)].push(filePath);
}

const staticBuckets = {
  admin: [],
  planner: [],
  portal: [],
  ops: [],
  products: [],
  solutions: [],
  other: [],
};

for (const route of staticRoutes) {
  staticBuckets[classifyStaticRoute(route)].push(route);
}

const dynamicPagePatterns = pageFiles
  .map((filePath) => "/" + filePath.replace(/^app\//, "").replace(/\/page\.(tsx|ts|js|jsx)$/, ""))
  .filter((route) => route.includes("["))
  .sort();

const localCatalogSlugs = new Set(
  Array.isArray(localCatalog) ? localCatalog.map((entry) => entry.slug).filter(Boolean) : [],
);
const builtProductRoutes = staticRoutes.filter((route) => /^\/products\/[^/]+\/[^/]+$/.test(route));
const builtProductSlugs = new Set(builtProductRoutes.map((route) => route.split("/").pop()));

const missingFallbackProductPages = [...localCatalogSlugs]
  .filter((slug) => !builtProductSlugs.has(slug))
  .sort();

const extraBuiltProductPages = [...builtProductSlugs]
  .filter((slug) => !localCatalogSlugs.has(slug))
  .sort();

const builtProductsByCategory = new Map();
for (const route of builtProductRoutes) {
  const [, , category] = route.split("/");
  addBucketCount(builtProductsByCategory, category);
}

const expectedSolutionRoutes = [
  "/solutions/seating",
  "/solutions/workstations",
  "/solutions/tables",
  "/solutions/storages",
  "/solutions/soft-seating",
  "/solutions/education",
];
const missingSolutionRoutes = expectedSolutionRoutes.filter((route) => !staticRoutes.includes(route));

const report = {
  generatedAt: new Date().toISOString(),
  manifests: {
    hasPrerenderManifest: Boolean(prerenderManifest),
    hasAppPathsManifest: Boolean(appPathsManifest),
  },
  pageFileCount: pageFiles.length,
  routeFileCount: routeFiles.length,
  registeredAppPathCount: appPaths.length,
  staticRouteCount: staticRoutes.length,
  pageFiles: pageBuckets,
  routeFiles,
  staticRoutes: {
    admin: staticBuckets.admin,
    planner: staticBuckets.planner,
    portal: staticBuckets.portal,
    ops: staticBuckets.ops,
    products: {
      topLevelAndCategoryRoutes: staticBuckets.products.filter((route) => !/^\/products\/[^/]+\/[^/]+$/.test(route)),
      productDetailCount: builtProductRoutes.length,
      productDetailCountByCategory: Object.fromEntries([...builtProductsByCategory.entries()].sort()),
    },
    solutions: staticBuckets.solutions,
    other: staticBuckets.other,
  },
  dynamicPagePatterns,
  reconciliation: {
    missingSolutionRoutes,
    missingFallbackProductPages,
    extraBuiltProductPages,
  },
};

console.log(JSON.stringify(report, null, 2));
