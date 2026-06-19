import { requireAuthUser } from "@/lib/auth/session";

import PortalPlanPageView from "@/features/planner/portal/PortalPlanPageView";
import { loadPlannerDocumentFromStore } from "@/features/planner/store/plannerSaves";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Thin route layer only. Portal viewer stub — wire to features/planner when implemented.
export default async function PortalPlanViewerPage({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await requireAuthUser(`/portal/${resolvedParams.id}`, "planner");
  const plan = await loadPlannerDocumentFromStore(resolvedParams.id, user.id);
  return <PortalPlanPageView document={plan} />;
}
