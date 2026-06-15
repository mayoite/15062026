import { redirect } from "next/navigation";
import { ChooseProductPage } from "@/features/shared/entry/ChooseProductPage";
import { getOptionalUser } from "@/lib/auth/session";

export default async function ChooseProductRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const guestMode = resolvedSearchParams?.mode === "guest";

  if (!user && !guestMode) {
    redirect("/access?next=%2Fchoose-product");
  }

  return <ChooseProductPage guestMode={guestMode} authenticated={Boolean(user)} />;
}
