import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { PLANNER_GUEST_COOKIE } from "./lib/auth/constants"

/** Canonical planner paths only — legacy /oando-planner/* and /buddy-planner/* 301 in next.config.js */
const PLANNER_GUEST_PATHS = ["/planner", "/planner/guest", "/planner/canvas"];

/** next-intl locale negotiation/rewrite middleware (i18n layer). */
const intlMiddleware = createIntlMiddleware(routing);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isPlannerGuestAllowedPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);
  return PLANNER_GUEST_PATHS.some((path) => {
    if (normalizedPathname === path) return true;
    if (path === "/planner") return false;
    return normalizedPathname.startsWith(`${path}/`);
  });
}

export function isProtectedPath(pathname: string): boolean {
  const normalizedPathname = normalizePathname(pathname);

  if (
    normalizedPathname === "/dashboard" ||
    normalizedPathname.startsWith("/dashboard/") ||
    normalizedPathname === "/portal" ||
    normalizedPathname.startsWith("/portal/") ||
    normalizedPathname === "/admin" ||
    normalizedPathname.startsWith("/admin/") ||
    normalizedPathname === "/crm" ||
    normalizedPathname.startsWith("/crm/") ||
    normalizedPathname === "/ops" ||
    normalizedPathname.startsWith("/ops/")
  ) {
    return true;
  }

  return false;
}

/**
 * NEXT.JS 16 PROXY
 * Must be named 'proxy' and placed at the root of the project.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── i18n layer ────────────────────────────────────────────────────────────
  // Run next-intl locale negotiation first. If it rewrites/redirects (e.g. to
  // add a locale prefix or honor the NEXT_LOCALE cookie), return that response
  // and skip the security/auth logic below. A plain `next()` falls through.
  const intlResponse = undefined; // Bypassed: locales resolved in request.ts via cookies/headers to support prefixless dynamic translations
  if (intlResponse && !(intlResponse as NextResponse).headers.get("x-middleware-next")) {
    return intlResponse;
  }

  const isProtected = isProtectedPath(pathname);
  const hasPlannerGuestPass = request.cookies.has(PLANNER_GUEST_COOKIE);
  const allowPlannerGuest = hasPlannerGuestPass && isPlannerGuestAllowedPath(pathname);

  // OPTIMIZATION: Check if any Appwrite auth cookies exist.
  // This prevents expensive network calls for completely anonymous traffic on public pages.
  const hasAuthCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith("a_session_"));

  // Short-circuit: If they have no auth cookies, are not a guest, and the route is protected -> Boot them immediately.
  if (!hasAuthCookies && !allowPlannerGuest && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/access";
    redirectUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(redirectUrl);
  }

  // STRICT GUEST ENFORCEMENT — /planner/guest (legacy planner URLs 301 here first)
  if (
    !hasAuthCookies &&
    (allowPlannerGuest ||
      pathname.startsWith("/planner/guest") ||
      request.headers.get("referer")?.includes("/guest"))
  ) {
    const isMutationMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
    const isServerAction = request.headers.has("next-action");
    
    const isBlockedApi = 
      pathname.startsWith("/api/plans") || 
      pathname.includes("/export") || 
      pathname.includes("/import") || 
      pathname.includes("/publish") ||
      pathname.includes("/share") ||
      pathname.includes("/persist");

    if (isBlockedApi || (isMutationMethod && isServerAction)) {
      return NextResponse.json(
        { error: "Guest users cannot perform save, import, export, publish, or share actions." },
        { status: 403 }
      );
    }
  }

  // The actual session validation is handled by getOptionalUser() in session.ts
  // at the page/layout level. The edge proxy just does a fast cookie existence check.
  
  // If the i18n middleware produced a passthrough `next()` response (e.g. it set
  // the x-next-intl-locale header without rewriting), reuse it so the header is
  // preserved; otherwise create a fresh response.
  const response = intlResponse ?? NextResponse.next({ request });

  // ── Security Headers ──────────────────────────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com https://cdn.tldraw.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://openrouter.ai https://www.google-analytics.com https://unpkg.com https://cdn.tldraw.com",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  );

  return response;
}

export const config = {
  matcher: [
    // i18n locale-prefixed paths and the root, handled by the next-intl layer.
    "/",
    "/(hi|fr|de|es)/:path*",
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimisation)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (images, fonts, etc.)
     * - API routes and internal Vercel paths (handled outside i18n)
     */
    "/((?!_next|_vercel|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$).*)",
  ],
};

