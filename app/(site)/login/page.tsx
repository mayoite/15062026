import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { getOptionalUser } from "@/lib/auth/session";
import { SuiteLoginPage } from "@/features/shared/entry/SuiteLoginPage";

export default async function LoginPage({
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
      eyebrow="One&Only Workspace"
      title="Sign in to continue to your workspace."
      description="Access Planner, Configurator, dashboard, and member-only routes from one account. After sign-in you return directly to the page that sent you here."
      guestHref="/choose-product?mode=guest"
      backHref="/choose-product"
      backLabel="Back to product chooser"
    />
  );
}
