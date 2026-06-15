import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { LoginForm } from "@/app/(site)/login/LoginForm";
import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";

interface SuiteLoginPageProps {
  eyebrow: string;
  title: string;
  description: string;
  guestHref?: string;
  backHref?: string;
  backLabel?: string;
}

export function SuiteLoginPage({
  eyebrow,
  title,
  description,
  guestHref,
  backHref = "/",
  backLabel = "Back to homepage",
}: SuiteLoginPageProps) {
  return (
    <section className="scheme-page relative min-h-screen overflow-hidden bg-[linear-gradient(140deg,#0b121b_0%,#111c29_45%,#1b2d42_100%)] text-white">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(194,139,79,0.22),transparent_22%),radial-gradient(circle_at_right,rgba(255,255,255,0.06),transparent_20%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 lg:px-10 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>{backLabel}</span>
          </Link>

          <OpenAssistantButton
            label="AI help"
            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-bronze-400)]/40 bg-[color:var(--color-bronze-400)]/10 px-4 py-2 text-sm font-medium text-[color:var(--color-bronze-200)] transition hover:bg-[color:var(--color-bronze-400)]/16"
          />
        </div>

        <div className="flex flex-1 items-center py-10 lg:py-16">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            <div className="flex flex-col justify-center gap-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-bronze-300)]">
                {eyebrow}
              </p>
              <h1 className="max-w-2xl text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="max-w-xl text-base leading-8 text-white/70 sm:text-lg">
                {description}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.7)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                    How it works
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Sign in once, return to the shared chooser, and continue into the right product without losing the route that brought you here.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.7)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
                    Need guidance
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/72">
                    Use the AI help button for route guidance, guest-mode questions, or a quick recommendation on whether Planner or Configurator fits the job.
                  </p>
                </div>
              </div>

              {guestHref ? (
                <div className="inline-flex max-w-fit items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/58">
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-bronze-300)]" aria-hidden="true" />
                  <Link href={guestHref} className="transition hover:text-white">
                    Continue as guest instead
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-md">
                <LoginForm guestHref={guestHref} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
