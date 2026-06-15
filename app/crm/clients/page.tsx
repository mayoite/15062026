import { requireAuthUser } from "@/lib/auth/session";
import ClientsView from "@/features/crm/ClientsView";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  await requireAuthUser("/crm/clients", "crm");
  return <ClientsView />;
}
