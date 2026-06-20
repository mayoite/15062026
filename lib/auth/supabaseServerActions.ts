"use server";

import { createServerClient } from "@/platform/supabase/server";
import { hasPublicSupabaseEnv } from "@/platform/supabase/env";
import { getCustomerSafeAuthError } from "@/lib/auth/customerSafeAuthError";

type AuthActionResult = { success: true } | { success: false; error: string };

function notConfiguredError(): string {
  return getCustomerSafeAuthError(new Error("missing_supabase_env"));
}

export async function loginWithSupabase(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!hasPublicSupabaseEnv()) {
    return { success: false, error: notConfiguredError() };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getCustomerSafeAuthError(error) };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getCustomerSafeAuthError(error) };
  }
}

export async function signupWithSupabase(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!hasPublicSupabaseEnv()) {
    return { success: false, error: notConfiguredError() };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { success: false, error: getCustomerSafeAuthError(error) };
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getCustomerSafeAuthError(error) };
  }
}

export async function signOutFromSupabase(): Promise<{ success: boolean }> {
  if (!hasPublicSupabaseEnv()) {
    return { success: true };
  }

  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (_error) {
    return { success: false };
  }
}
