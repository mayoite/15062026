import { redirect } from "next/navigation";
import { DashboardClient } from "@/app/(site)/dashboard/DashboardClient";
import { getOptionalUser } from "@/lib/auth/session";

export default async function DashboardPage() {
  const user = await getOptionalUser();

  if (!user) {
    redirect("/access?next=%2Fdashboard");
  }

  return <DashboardClient userEmail={user.email || "workspace user"} />;
}
