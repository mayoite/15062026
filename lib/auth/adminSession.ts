import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

export async function requireAdminUser(nextPath = "/admin") {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildAccessRedirect(nextPath, "/admin"));
  }

  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  if (role !== "admin") {
    redirect("/dashboard?error=unauthorized_admin_access");
  }

  return user;
}
