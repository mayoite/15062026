import type { ReactNode } from 'react';
import AdminLayoutShell from '@/features/planner/admin/AdminLayoutShell';
import { requireAdminUser } from '@/lib/auth/adminSession';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdminUser("/admin");

  return (
    <AdminLayoutShell>{children}</AdminLayoutShell>
  );
}
