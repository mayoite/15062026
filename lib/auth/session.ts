/**
 * Shared server auth helpers used across all product surfaces (Planner, Configurator, CRM).
 * Wraps Supabase auth and provides guest access functionality.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Client, Account } from "node-appwrite";
import { getAppwriteRuntimeConfig } from '@/platform/appwrite/client';
import type { SharedSessionUser, PlannerRole } from "@/features/shared/auth/types";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export async function getOptionalUser(): Promise<SharedSessionUser | null> {
  const config = getAppwriteRuntimeConfig();
  if (!config.isConfigured) return null;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(`a_session_${config.projectId}`);

  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  try {
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setSession(sessionCookie.value);

    const account = new Account(client);
    const user = await account.get();

    return {
      id: user.$id,
      email: user.email || "",
      name: user.name,
      avatarUrl: user.prefs?.avatarUrl,
      role: (user.labels?.includes("admin") ? "owner" : "member") as PlannerRole,
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
