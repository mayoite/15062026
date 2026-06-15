import { requireAuthUser } from "@/lib/auth/session";
import ProjectsView from "@/features/crm/ProjectsView";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireAuthUser("/crm/projects", "crm");
  return <ProjectsView />;
}
