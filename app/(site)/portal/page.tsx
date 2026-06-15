import { requireAuthUser } from "@/lib/auth/session";

import PortalPageView from "@/features/planner/portal/PortalPageView";

// Thin route layer only. Portal implementation lives in features/planner/portal/.
export default async function PortalPage() {
  await requireAuthUser("/portal", "planner");
  return <PortalPageView />;
}
