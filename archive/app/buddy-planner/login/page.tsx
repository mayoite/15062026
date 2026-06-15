import { redirect } from "next/navigation";

import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { getOptionalUser } from "@/lib/auth/session";
import { SuiteLoginPage } from "@/features/shared/entry/SuiteLoginPage";

export default async function BuddyLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(
    typeof resolvedSearchParams?.next === "string"
      ? resolvedSearchParams.next
      : undefined,
  );

  if (user) {
    redirect(nextPath);
  }

  return (
    <SuiteLoginPage
      eyebrow="Planner Member Access"
      title="Sign in to open the workspace planner."
      description="Member mode restores save, export, and return-to-dashboard continuity on the unified planner canvas."
      guestHref="/planner/guest"
      backHref="/planner"
      backLabel="Back to planner"
    />
  );
}
