import Link from "next/link";

import { getPlannerSceneEnvelope } from "@/features/planner/lib/documentBridge";
import type { PlannerDocument } from "@/features/planner/model";

interface PortalPlanPageViewProps {
  document: PlannerDocument | null;
}

function formatTimestamp(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function PortalPlanPageView({ document }: PortalPlanPageViewProps) {
  if (!document) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10 md:px-8 md:py-12">
        <div className="rounded-[1.5rem] border border-soft bg-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">Member portal</p>
          <h1 className="mt-2 text-2xl font-semibold text-strong">Plan not found</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            This plan is missing, inaccessible, or does not belong to the current member account.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/portal/" className="btn-outline px-4 py-2 text-sm">
              Back to portal
            </Link>
            <Link href="/planner/canvas/" className="btn-primary px-4 py-2 text-sm">
              Open planner
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const scene = getPlannerSceneEnvelope(document.sceneJson);
  const items = scene?.items ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-8 md:py-12">
      <div className="mb-5">
        <Link href="/portal/" className="text-sm font-medium text-muted hover:text-strong">
          Back to portal
        </Link>
      </div>

      <header className="rounded-[1.75rem] border border-soft bg-panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">Workspace plan</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">{document.title ?? document.name}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          {document.projectName ?? document.clientName ?? "Saved workspace layout"} · Updated {formatTimestamp(document.updatedAt ?? document.createdAt)}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`/planner/canvas/?id=${encodeURIComponent(document.id ?? "")}`} className="btn-primary px-4 py-2 text-sm">
            Open in planner
          </Link>
          <Link href="/portal/" className="btn-outline px-4 py-2 text-sm">
            View all plans
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.35rem] border border-soft bg-panel p-5">
          <h2 className="text-lg font-semibold text-strong">Document summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Room</dt>
              <dd className="text-right text-strong">{document.roomWidthMm} × {document.roomDepthMm} mm</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Items</dt>
              <dd className="text-right text-strong">{document.itemCount}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Seat target</dt>
              <dd className="text-right text-strong">{document.seatTarget}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Units</dt>
              <dd className="text-right text-strong">{document.unitSystem}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="text-right text-strong">{document.status}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[1.35rem] border border-soft bg-panel p-5">
          <h2 className="text-lg font-semibold text-strong">Scene readiness</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Canonical scene</dt>
              <dd className="text-right text-strong">{scene ? "Present" : "Missing"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Room envelope</dt>
              <dd className="text-right text-strong">
                {scene ? `${scene.room.widthMm} × ${scene.room.depthMm} mm` : "Unknown"}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Scene items</dt>
              <dd className="text-right text-strong">{items.length}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt className="text-muted">Snapshot source</dt>
              <dd className="text-right text-strong">
                {scene?.fabricSnapshot ? "Fabric" : scene?.tldrawSnapshot ? "tldraw" : "None"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-6 rounded-[1.35rem] border border-soft bg-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-strong">Placed items</h2>
          <span className="rounded-full border border-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-soft">
            {items.length} entries
          </span>
        </div>

        {items.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No scene items were found in this saved document.</p>
        ) : (
          <ul className="mt-4 divide-y divide-soft">
            {items.slice(0, 16).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-strong">{item.name}</p>
                  <p className="mt-1 text-muted">{item.category}</p>
                </div>
                <div className="shrink-0 text-right text-muted">
                  <p>{item.sizeMm.widthMm} × {item.sizeMm.depthMm} mm</p>
                  <p className="mt-1">Rot {Math.round(item.rotationDeg)}°</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 16 ? (
          <p className="mt-3 text-xs text-soft">Showing the first 16 items from the saved scene.</p>
        ) : null}
      </section>
    </div>
  );
}
