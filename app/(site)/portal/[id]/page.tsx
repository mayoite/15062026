import { requireAuthUser } from "@/lib/auth/session";

import PortalPlanPageView from "@/features/planner/portal/PortalPlanPageView";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Thin route layer only. Portal viewer stub — wire to features/planner when implemented.
export default async function PortalPlanViewerPage({ params }: PageProps) {
  const resolvedParams = await params;
  await requireAuthUser(`/portal/${resolvedParams.id}`, "planner");
  return <PortalPlanPageView />;
}
