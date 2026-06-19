import { requireAuthUser } from "@/lib/auth/session";

import PortalPageView from "@/features/planner/portal/PortalPageView";
import { isPlannerDatabaseConfigured } from "@/features/planner/store/plannerPersistence";
import { listPlannerDocumentsFromStore } from "@/features/planner/store/plannerSaves";

// Thin route layer only. Portal implementation lives in features/planner/portal/.
export default async function PortalPage() {
  const user = await requireAuthUser("/portal", "planner");
  const databaseConfigured = isPlannerDatabaseConfigured();
  const plans = databaseConfigured
    ? await listPlannerDocumentsFromStore({ userId: user.id })
    : [];

  return <PortalPageView databaseConfigured={databaseConfigured} plans={plans} userName={user.name ?? null} />;
}
