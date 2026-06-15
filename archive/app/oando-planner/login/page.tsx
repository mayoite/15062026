import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { getOptionalUser } from "@/lib/auth/session";
import { SuiteLoginPage } from "@/features/shared/entry/SuiteLoginPage";

export default async function PlannerLoginPage({
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
      title="Sign in to open Planner member mode."
      description="Member mode restores save, export, and return-to-dashboard continuity. You will be redirected back to your planner route after login."
      guestHref="/planner/guest"
      backHref="/planner"
      backLabel="Back to planner"
    />
  );
}
