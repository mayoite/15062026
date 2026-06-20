/**
 * PATCH/DELETE /api/admin/catalogs/[type]/[id]
 *
 * Canonical, parameterized catalog-admin item route. Replaces the duplicate
 * `[id]` routes under `admin/catalog`, `admin/buddy-catalog`,
 * `admin/configurator-catalog`, and `admin/planner-catalog`.
 *
 * Path params:
 *   - `type`: `standard` | `configurator` | `buddy` (buddy aliases configurator)
 *   - `id`:   catalog item id
 *
 * Behavior:
 *   - standard: PATCH = full update; DELETE = hard delete
 *   - configurator: PATCH = full update or `{ active }` toggle;
 *     DELETE = soft archive (active=false)
 *
 * Auth: `admin` role required (enforced by `withAuth`).
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  deleteConfiguratorCatalog,
  deleteStandardCatalog,
  patchConfiguratorCatalog,
  patchStandardCatalog,
  resolveCatalogType,
} from "@/lib/api/catalogAdminHandlers";

type RouteContext = {
  params: Promise<{ type: string; id: string }>;
};

/**
 * Update a catalog item of the given type by id. Admin only.
 */
export const PATCH = withAuth<RouteContext>(
  async (req, _auth, context) => {
    const { type: rawType, id } = await context.params;
    const type = resolveCatalogType(rawType);
    if (type === "standard") return patchStandardCatalog(req as NextRequest, id);
    return patchConfiguratorCatalog(req as NextRequest, id);
  },
  { role: "admin", rateLimitScope: "admin-catalogs:patch", rateLimit: 40 },
);

/**
 * Delete (or soft-archive) a catalog item of the given type by id. Admin only.
 */
export const DELETE = withAuth<RouteContext>(
  async (_req, _auth, context) => {
    const { type: rawType, id } = await context.params;
    const type = resolveCatalogType(rawType);
    if (type === "standard") return deleteStandardCatalog(id);
    return deleteConfiguratorCatalog(id);
  },
  { role: "admin", rateLimitScope: "admin-catalogs:delete", rateLimit: 15 },
);
