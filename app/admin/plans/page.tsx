"use client";

import AdminPlansPageView from "@/features/planner/admin/AdminPlansPageView";

// Thin route layer only. Admin implementation lives in features/planner/admin/.
export default function PlansManagement() {
  return <AdminPlansPageView />;
}
