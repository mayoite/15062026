import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestPortalPlanViewerPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/access?next=${encodeURIComponent(`/portal/${id}`)}`);
}
