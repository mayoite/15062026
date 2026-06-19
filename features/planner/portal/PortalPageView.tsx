import Link from "next/link";

import type { PlannerSaveSummary } from "@/features/planner/store/plannerSaves";

interface PortalPageViewProps {
  databaseConfigured: boolean;
  plans: PlannerSaveSummary[];
  userName?: string | null;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function PortalPageView({
  databaseConfigured,
  plans,
  userName,
}: PortalPageViewProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-12">
      <header className="rounded-[1.75rem] border border-soft bg-panel p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-soft">Member portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-strong">
          {userName ? `${userName}'s plans` : "Your saved plans"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Review saved workspace layouts, reopen them in the planner, and share the current room setup with your team.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/planner/canvas/" className="btn-primary px-4 py-2 text-sm">
            Open planner
          </Link>
          <Link href="/dashboard/" className="btn-outline px-4 py-2 text-sm">
            Back to dashboard
          </Link>
        </div>
      </header>

      {!databaseConfigured ? (
        <section className="mt-6 rounded-[1.5rem] border border-soft bg-panel p-6 text-sm text-muted">
          Planner storage is not configured yet, so no published portal plans are available in this environment.
        </section>
      ) : plans.length === 0 ? (
        <section className="mt-6 rounded-[1.5rem] border border-soft bg-panel p-6">
          <h2 className="text-lg font-semibold text-strong">No saved plans yet</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Start a workspace in the planner and save it to create a portal-ready plan history for this account.
          </p>
          <div className="mt-5">
            <Link href="/planner/canvas/" className="btn-primary px-4 py-2 text-sm">
              Create a plan
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-strong">Saved layouts</h2>
              <p className="text-sm text-muted">{plans.length} plan{plans.length === 1 ? "" : "s"} available</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.id} className="rounded-[1.35rem] border border-soft bg-panel p-5 shadow-theme-soft">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-soft">Workspace plan</p>
                    <h3 className="mt-2 truncate text-lg font-semibold text-strong">{plan.name}</h3>
                    <p className="mt-1 truncate text-sm text-muted">
                      {plan.project_name ?? plan.client_name ?? "No project metadata"}
                    </p>
                  </div>
                  <span className="rounded-full border border-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-soft">
                    {plan.item_count} items
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-subtle px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-soft">Room</dt>
                    <dd className="mt-1 text-strong">
                      {plan.room_width_mm} × {plan.room_depth_mm} mm
                    </dd>
                  </div>
                  <div className="rounded-xl bg-subtle px-3 py-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-soft">Updated</dt>
                    <dd className="mt-1 text-strong">{formatTimestamp(plan.updated_at)}</dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={`/portal/${plan.id}`} className="btn-primary px-4 py-2 text-sm">
                    View details
                  </Link>
                  <Link href={`/planner/canvas/?id=${encodeURIComponent(plan.id)}`} className="btn-outline px-4 py-2 text-sm">
                    Open in planner
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
