import Link from "next/link";

/** Legacy Buddy HR/roster help removed — unified planner help only. */
export function HelpPage() {
  return (
    <div className="scheme-page flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
      <p className="typ-eyebrow text-muted">Help moved</p>
      <h1 className="typ-page-title mt-3">Workspace planner guide</h1>
      <p className="page-copy-sm mt-4 max-w-md text-muted">
        Roster, HR roles, and seat-utilization docs are out of scope. Use the unified planner help center for layout and export.
      </p>
      <Link href="/planner/help/" className="btn-primary typ-cta mt-8 px-6 py-3">
        Open planner help
      </Link>
    </div>
  );
}
