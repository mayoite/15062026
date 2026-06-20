/**
 * @deprecated Use `GET/POST /api/admin/catalogs/configurator` instead.
 *
 * Thin backwards-compat shim for the legacy `admin/buddy-catalog` list route.
 * Delegates to the shared configurator-catalog handlers (buddy is an alias).
 */

import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/withAuth";
import {
  createConfiguratorCatalog,
  listConfiguratorCatalog,
} from "@/lib/api/catalogAdminHandlers";

/** @deprecated List configurator catalog items. Prefer `/api/admin/catalogs/configurator`. */
export const GET = withAuth(
  async (req) => listConfiguratorCatalog(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-catalog:get", rateLimit: 60 },
);

/** @deprecated Create a configurator product. Prefer `POST /api/admin/catalogs/configurator`. */
export const POST = withAuth(
  async (req) => createConfiguratorCatalog(req as NextRequest),
  { role: "admin", rateLimitScope: "admin-catalog:post", rateLimit: 20 },
);
