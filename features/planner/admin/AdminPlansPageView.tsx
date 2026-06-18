"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, RefreshCw } from "lucide-react";

type AdminPlanSummary = {
  id: string;
  title: string;
  project_name: string | null;
  client_name: string | null;
  item_count: number;
  room_width_mm: number;
  room_depth_mm: number;
  status: "draft" | "active" | "archived";
  review_status: "pending" | "approved";
  created_at: string;
  updated_at: string;
};

type PlansResponse = {
  plans: AdminPlanSummary[];
  pagination: { page: number; limit: number; total: number; pages: number };
  source: string;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function statusLabel(status: AdminPlanSummary["status"]) {
  if (status === "active") return "Approved";
  if (status === "archived") return "Archived";
  return "Draft";
}

export default function AdminPlansPageView() {
  const [plans, setPlans] = useState<AdminPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/plans?limit=50&sortBy=updated_at&sortOrder=desc");
      if (!response.ok) {
        throw new Error(`Failed to load plans (${response.status})`);
      }
      const payload = (await response.json()) as PlansResponse;
      setPlans(payload.plans ?? []);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadPlans().finally(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [loadPlans]);

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Admin review</p>
          <h1 className="text-2xl font-semibold text-strong">Planner plans</h1>
          <p className="mt-1 text-sm text-muted">
            Triage saved planner documents and open Fabric-derived scene data.
          </p>
        </div>
        <button
          type="button"
          className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"
          onClick={() => void loadPlans()}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
          Refresh
        </button>
      </div>

      {source === "unconfigured" ? (
        <div className="rounded-xl border border-soft bg-panel p-4 text-sm text-muted">
          Database storage is not configured. Plan review will appear here once persistence is enabled.
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading plans…
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-soft bg-panel p-6 text-sm text-muted">
          No plans found yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-soft bg-panel">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-soft bg-subtle text-xs uppercase tracking-wide text-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-b border-soft last:border-b-0">
                  <td className="px-4 py-3">
                    <Link href={`/admin/plans/${plan.id}`} className="font-medium text-strong hover:underline">
                      {plan.title}
                    </Link>
                    <p className="text-xs text-soft">{plan.project_name ?? plan.client_name ?? "No project metadata"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {plan.room_width_mm} × {plan.room_depth_mm} mm
                  </td>
                  <td className="px-4 py-3 text-muted">{plan.item_count}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-subtle px-2 py-1 text-xs text-muted">
                      {statusLabel(plan.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatTimestamp(plan.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
