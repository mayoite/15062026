import { requireAuthUser } from "@/lib/auth/session";
import QuotesView from "@/features/crm/QuotesView";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  await requireAuthUser("/crm/quotes", "crm");
  return <QuotesView />;
}
