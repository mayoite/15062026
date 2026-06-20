/**
 * @deprecated Use `GET /api/admin/catalogs/standard` instead.
 *
 * Thin backwards-compat shim for the legacy `admin/catalog` list route. Delegates
 * to the shared {@link listStandardCatalog} handler so existing clients keep
 * working while the canonical parameterized route is preferred.
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  createStandardCatalog,
  listStandardCatalog,
} from "@/lib/api/catalogAdminHandlers";

/** @deprecated List standard catalog items. Prefer `/api/admin/catalogs/standard`. */
export const GET = withAuth(
  async (req) => listStandardCatalog(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-catalog:get", rateLimit: 60 },
);

/** @deprecated Create a standard catalog item. Prefer `POST /api/admin/catalogs/standard`. */
export const POST = withAuth(
  async (req) => createStandardCatalog(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-catalog:post", rateLimit: 20 },
);

