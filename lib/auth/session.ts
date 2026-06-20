/**
 * Shared server auth helpers used across all product surfaces (Planner, Configurator, CRM).
 * Wraps Supabase auth and provides guest access functionality.
 */
import { redirect } from "next/navigation";
import { createServerClient } from "@/platform/supabase/server";
import { hasPublicSupabaseEnv } from "@/platform/supabase/env";
import type { SharedSessionUser, PlannerRole } from "@/features/shared/auth/types";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export async function getOptionalUser(): Promise<SharedSessionUser | null> {
  // If Supabase env vars are not configured, there is no auth surface to query.
  if (!hasPublicSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const roleValue = user.app_metadata?.role ?? user.user_metadata?.role;
    const isAdmin =
      roleValue === "admin" ||
      Array.isArray(user.app_metadata?.roles) &&
        (user.app_metadata.roles as unknown[]).includes("admin");

    return {
      id: user.id,
      email: user.email || "",
      name:
        (user.user_metadata?.name as string | undefined) ??
        (user.email ? user.email.split("@")[0] : undefined),
      avatarUrl: user.user_metadata?.avatarUrl as string | undefined,
      role: (isAdmin ? "owner" : "member") as PlannerRole,
    };
  } catch (error) {
    // Session is invalid or expired
    console.error("getOptionalUser error:", error);
    return null;
  }
}

export async function requireAuthUser(nextPath: string, surface: "planner" | "configurator" | "crm" | "ops" = "planner"): Promise<SharedSessionUser> {
  const user = await getOptionalUser();

  if (!user) {
    redirect(buildAccessRedirect(nextPath));
  }

  // Basic CRM and Ops protection - guests and standard viewers should not access CRM or Ops
  if ((surface === "crm" || surface === "ops") && (user.role === "guest" || user.role === "viewer")) {
    redirect("/dashboard?error=unauthorized_access");
  }

  return user;
}
