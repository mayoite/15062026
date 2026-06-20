/**
 * @deprecated Use `PATCH/DELETE /api/admin/catalogs/configurator/[id]` instead.
 *
 * Thin backwards-compat shim for the legacy `admin/buddy-catalog/[id]` item
 * route. Delegates to the shared configurator-catalog handlers.
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  deleteConfiguratorCatalog,
  patchConfiguratorCatalog,
} from "@/lib/api/catalogAdminHandlers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** @deprecated Update a configurator product. Prefer `/api/admin/catalogs/configurator/[id]`. */
export const PATCH = withAuth<RouteContext>(
  async (req, _auth, context) => {
    const { id } = await context.params;
    return patchConfiguratorCatalog(req as NextRequest, id);
  },
  { role: "admin", rateLimitScope: "admin-catalog:patch", rateLimit: 40 },
);

/** @deprecated Archive a configurator product. Prefer `/api/admin/catalogs/configurator/[id]`. */
export const DELETE = withAuth<RouteContext>(
  async (_req, _auth, context) => {
    const { id } = await context.params;
    return deleteConfiguratorCatalog(id);
  },
  { role: "admin", rateLimitScope: "admin-catalog:delete", rateLimit: 40 },
);
