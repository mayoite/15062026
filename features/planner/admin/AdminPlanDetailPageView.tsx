"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";

import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import { buildPlannerCanvasHref } from "@/features/planner/admin/plannerAdminLinks";
import {
  getPlannerSceneEnvelope,
  type PlannerSceneEnvelope,
  type PlannerJsonValue,
} from "@/features/planner/model";

type AdminPlanDetail = {
  id: string;
  title: string;
  project_name: string | null;
  client_name: string | null;
  prepared_by: string | null;
  room_width_mm: number;
  room_depth_mm: number;
  seat_target: number;
  unit_system: string;
  item_count: number;
  thumbnail_url: string | null;
  scene_json: unknown;
  status: "draft" | "active" | "archived";
  review_status: "pending" | "approved";
  created_at: string;
  updated_at: string;
};

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function sceneReadiness(scene: PlannerSceneEnvelope | null) {
  if (!scene) {
    return {
      hasScene: false,
      hasFabricSnapshot: false,
      itemCount: 0,
      roomLabel: "Unknown",
    };
  }

  const fabricSnapshot = (scene as PlannerSceneEnvelope & { fabricSnapshot?: unknown }).fabricSnapshot;
  return {
    hasScene: true,
    hasFabricSnapshot: Boolean(fabricSnapshot),
    itemCount: scene.items.length,
    roomLabel: `${scene.room.widthMm} × ${scene.room.depthMm} mm`,
  };
}

export default function AdminPlanDetailPageView() {
  const params = useParams<{ id: string }>();
  const planId = params?.id?.trim() ?? "";

  const [plan, setPlan] = useState<AdminPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPlan = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/plans/${encodeURIComponent(planId)}`),
      );
      if (!response.ok) {
        throw new Error(`Failed to load plan (${response.status})`);
      }
      const payload = (await response.json()) as { plan: AdminPlanDetail };
      setPlan(payload.plan);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadPlan();
    });
    return () => {
      cancelled = true;
    };
  }, [loadPlan]);

  const scene = useMemo(
    () => (plan ? getPlannerSceneEnvelope(plan.scene_json as PlannerJsonValue) : null),
    [plan],
  );
  const readiness = useMemo(() => sceneReadiness(scene), [scene]);

  const updateStatus = useCallback(async (status: AdminPlanDetail["status"]) => {
    if (!planId) return;
    setSaving(true);
    setStatusMessage(null);
    setError(null);
    try {
      const response = await browserApiFetch(
        apiPath(`/api/admin/plans/${encodeURIComponent(planId)}`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to update plan (${response.status})`);
      }
      const payload = (await response.json()) as { plan: AdminPlanDetail };
      setPlan(payload.plan);
      setStatusMessage(`Plan marked as ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update plan");
    } finally {
      setSaving(false);
    }
  }, [planId]);

  if (!planId) {
    return <div className="p-8 text-sm text-muted">Missing plan id.</div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <Link href="/admin/plans" className="mb-4 inline-flex items-center gap-2 text-sm text-muted hover:text-strong">
        <ArrowLeft size={14} aria-hidden />
        Back to plans
      </Link>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading plan…
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800" role="status">
          <Check size={14} className="mr-1 inline" aria-hidden />
          {statusMessage}
        </div>
      ) : null}

      {plan ? (
        <div className="space-y-6">
          <header className="rounded-xl border border-soft bg-panel p-5">
            <p className="text-xs uppercase tracking-wide text-soft">Plan review</p>
            <h1 className="mt-1 text-2xl font-semibold text-strong">{plan.title}</h1>
            <p className="mt-2 text-sm text-muted">
              {plan.project_name ?? "No project"} · {plan.client_name ?? "No client"} · Updated {formatTimestamp(plan.updated_at)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={buildPlannerCanvasHref(plan.id)}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ExternalLink size={14} aria-hidden />
                Open in canvas
              </Link>
              <button
                type="button"
                className="btn-outline disabled:opacity-60"
                disabled={saving || plan.status === "active"}
                onClick={() => void updateStatus("active")}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn-outline disabled:opacity-60"
                disabled={saving || plan.status === "draft"}
                onClick={() => void updateStatus("draft")}
              >
                Mark draft
              </button>
              <button
                type="button"
                className="btn-outline disabled:opacity-60"
                disabled={saving || plan.status === "archived"}
                onClick={() => void updateStatus("archived")}
              >
                Archive
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-soft bg-panel p-4">
              <h2 className="text-sm font-semibold text-strong">Document summary</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Room</dt>
                  <dd>{plan.room_width_mm} × {plan.room_depth_mm} mm</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Items</dt>
                  <dd>{plan.item_count}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Seat target</dt>
                  <dd>{plan.seat_target}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Units</dt>
                  <dd>{plan.unit_system}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Status</dt>
                  <dd>{plan.status}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-soft bg-panel p-4">
              <h2 className="text-sm font-semibold text-strong">Fabric scene readiness</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Canonical scene</dt>
                  <dd>{readiness.hasScene ? "Present" : "Missing"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Fabric snapshot</dt>
                  <dd>{readiness.hasFabricSnapshot ? "Present" : "Missing"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Scene items</dt>
                  <dd>{readiness.itemCount}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Scene room</dt>
                  <dd>{readiness.roomLabel}</dd>
                </div>
              </dl>
            </div>
          </section>

          {scene?.items?.length ? (
            <section className="rounded-xl border border-soft bg-panel p-4">
              <h2 className="text-sm font-semibold text-strong">Scene items</h2>
              <ul className="mt-3 divide-y divide-soft text-sm">
                {scene.items.slice(0, 12).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-2">
                    <span className="text-strong">{item.name}</span>
                    <span className="text-muted">
                      {item.category} · {item.sizeMm.widthMm} × {item.sizeMm.depthMm} mm
                    </span>
                  </li>
                ))}
              </ul>
              {scene.items.length > 12 ? (
                <p className="mt-2 text-xs text-soft">Showing first 12 of {scene.items.length} items.</p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-xl border border-soft bg-panel p-4">
            <h2 className="text-sm font-semibold text-strong">Scene JSON</h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg bg-subtle p-3 text-xs text-muted">
              {JSON.stringify(plan.scene_json, null, 2)}
            </pre>
          </section>
        </div>
      ) : null}
    </div>
  );
}
