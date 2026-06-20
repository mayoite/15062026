/**
 * GET/POST /api/admin/catalogs/[type]
 *
 * Canonical, parameterized catalog-admin route. Replaces the three duplicate
 * configurator-catalog trees (`admin/buddy-catalog`, `admin/configurator-catalog`,
 * `admin/planner-catalog`) and the separate `admin/catalog` tree.
 *
 * Path params:
 *   - `type`: `standard` | `configurator` | `buddy` (buddy aliases configurator)
 *
 * Query (GET):
 *   - standard:     `page`, `limit`, `category`, `search`, `visible`
 *   - configurator: `category`, `active`
 *
 * Auth: `admin` role required (enforced by `withAuth`).
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  createConfiguratorCatalog,
  createStandardCatalog,
  listConfiguratorCatalog,
  listStandardCatalog,
  resolveCatalogType,
} from "@/lib/api/catalogAdminHandlers";

type RouteContext = {
  params: Promise<{ type: string }>;
};

/**
 * List catalog items of the given type. Admin only.
 */
export const GET = withAuth<RouteContext>(
  async (req, _auth, context) => {
    const { type: rawType } = await context.params;
    const type = resolveCatalogType(rawType);
    if (type === "standard") return listStandardCatalog(req);
    return listConfiguratorCatalog(req);
  },
  { role: "admin", rateLimitScope: "admin-catalogs:get", rateLimit: 60 },
);

/**
 * Create a catalog item of the given type. Admin only.
 */
export const POST = withAuth<RouteContext>(
  async (req, _auth, context) => {
    const { type: rawType } = await context.params;
    const type = resolveCatalogType(rawType);
    if (type === "standard") return createStandardCatalog(req as NextRequest);
    return createConfiguratorCatalog(req as NextRequest);
  },
  { role: "admin", rateLimitScope: "admin-catalogs:post", rateLimit: 20 },
);
