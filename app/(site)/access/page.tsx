import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { AccessForm } from "./AccessForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AccessRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(
    typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : undefined,
  );

  if (user) {
    redirect(nextPath);
  }

  const guestHref = "/choose-product?mode=guest";

  return (
    <div className="flex min-h-screen w-full bg-[var(--surface-page)]">
      {/* Form Side */}
      <div className="flex w-full flex-col lg:w-1/2 relative">
        <div className="absolute top-8 left-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-strong)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-8 lg:p-12">
          <AccessForm nextPath={nextPath} guestHref={guestHref} />
        </div>
      </div>

      {/* Visual Side */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-[var(--surface-soft)] border-l border-[var(--border-strong)]">
        {/* Static architectural CSS pattern */}
        <div className="absolute inset-0 z-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="architectural-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-[var(--text-muted)]"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#architectural-grid)" />
            {/* Adding some architectural lines to break the grid */}
            <line x1="0" y1="200" x2="100%" y2="200" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] opacity-50" />
            <line x1="300" y1="0" x2="300" y2="100%" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] opacity-50" />
            <circle cx="300" cy="200" r="8" fill="currentColor" className="text-[var(--text-muted)]" />
          </svg>
        </div>
        
        <div className="relative z-10 flex h-full flex-col items-start justify-end p-12 text-[var(--text-strong)]">
          <div className="max-w-md bg-[var(--surface-page)]/80 backdrop-blur-sm p-8 rounded-2xl border border-[var(--border-strong)]">
            <h3 className="text-2xl font-light tracking-tight mb-3">
              Precision in Planning
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Experience the Oando Suite. Our architectural tools are designed for accuracy, performance, and clear collaboration across teams.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
