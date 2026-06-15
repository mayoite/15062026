import { PlannerWorkspaceRoute } from "@/features/planner/ui/PlannerWorkspaceRoute";

export const dynamic = "force-dynamic";

export default function PlannerGuestRoute() {
  return <PlannerWorkspaceRoute guestMode />;
}
