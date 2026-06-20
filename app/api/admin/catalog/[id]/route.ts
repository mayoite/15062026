/**
 * @deprecated Use `PATCH/DELETE /api/admin/catalogs/standard/[id]` instead.
 *
 * Thin backwards-compat shim for the legacy `admin/catalog/[id]` item route.
 * Delegates to the shared standard-catalog handlers.
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  deleteStandardCatalog,
  patchStandardCatalog,
} from "@/lib/api/catalogAdminHandlers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** @deprecated Update a standard catalog item. Prefer `/api/admin/catalogs/standard/[id]`. */
export const PATCH = withAuth<RouteContext>(
  async (req, _auth, context) => {
    const { id } = await context.params;
    return patchStandardCatalog(req as NextRequest, id);
  },
  { role: "admin", rateLimitScope: "admin-catalog:patch", rateLimit: 20 },
);

/** @deprecated Delete a standard catalog item. Prefer `/api/admin/catalogs/standard/[id]`. */
export const DELETE = withAuth<RouteContext>(
  async (_req, _auth, context) => {
    const { id } = await context.params;
    return deleteStandardCatalog(id);
  },
  { role: "admin", rateLimitScope: "admin-catalog:delete", rateLimit: 15 },
);
