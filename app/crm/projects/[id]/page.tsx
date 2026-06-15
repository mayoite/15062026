import { requireAuthUser } from "@/lib/auth/session";
import ProjectDetailView from "@/features/crm/ProjectDetailView";

export const dynamic = "force-dynamic";

export default async function ProjectDetailRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAuthUser(`/crm/projects/${id}`, "crm");
  return <ProjectDetailView projectId={id} />;
}
