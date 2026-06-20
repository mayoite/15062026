/**
 * Thin planner-auth server helpers used by route entrypoints and planner surfaces.
 * If this grows beyond auth gating and redirect wiring, move the feature-owned logic under features/planner/.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOptionalUser } from "@/lib/auth/session";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { hasPublicSupabaseEnv } from "@/platform/supabase/env";

export async function getOptionalPlannerUser() {
  return await getOptionalUser();
}

const ANONYMOUS_USER = {
  id: "anonymous",
  email: "anonymous@example.com",
  name: "Anonymous User",
  role: "anonymous",
} as const;

function isGuestAllowedPath(nextPath: string): boolean {
  const normalized = nextPath.replace(/\/$/, "") || "/";
  return (
    normalized === "/planner" ||
    normalized.startsWith("/planner/guest") ||
    normalized.startsWith("/planner/canvas") ||
    normalized.startsWith("/planner/help") ||
    normalized.startsWith("/planner/features") ||
    // Legacy paths still linked in bookmarks and old emails
    normalized === "/oando-planner" ||
    normalized.startsWith("/oando-planner/guest") ||
    normalized.startsWith("/oando-planner/canvas") ||
    normalized.startsWith("/oando-planner/onboarding") ||
    normalized.startsWith("/buddy-planner/guest") ||
    normalized.startsWith("/buddy-planner/editor") ||
    normalized === "/buddy-planner"
  );
}

export async function requirePlannerUser(nextPath = "/dashboard") {
  const cookieStore = await cookies();
  const isGuest = cookieStore.has(PLANNER_GUEST_COOKIE);

  // Guest pass + guest-allowed path → return guest user
  if (isGuest && isGuestAllowedPath(nextPath)) {
    return {
      id: "guest",
      email: "guest@example.com",
      name: "Guest User",
    };
  }

  // If Supabase is not configured, return an anonymous user
  // This allows the planner to render in fallback mode without env vars
  if (!hasPublicSupabaseEnv()) {
    console.warn(
      "Supabase not configured. Rendering planner in anonymous mode."
    );
    return ANONYMOUS_USER;
  }

  try {
    const user = await getOptionalPlannerUser();

    if (!user) {
      // On guest-allowed paths, never redirect — fall back to anonymous
      // so the planner canvas still renders in read-only/guest mode.
      if (isGuestAllowedPath(nextPath)) {
        return ANONYMOUS_USER;
      }
      redirect(buildAccessRedirect(nextPath));
    }

    return user;
  } catch (error) {
    // Catch any unexpected errors from auth
    console.warn("Failed to get planner user, falling back to anonymous:", error);
    return ANONYMOUS_USER;
  }
}