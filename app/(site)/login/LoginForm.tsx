"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { FormEvent} from "react";
import { useEffect, useMemo, useState } from "react";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { getCustomerSafeAuthError } from "@/lib/auth/customerSafeAuthError";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { hasPublicSupabaseEnv } from "@/platform/supabase/env";
import { loginWithSupabase, signupWithSupabase } from "@/lib/auth/supabaseServerActions";

export function LoginForm({
  guestHref = "/choose-product?mode=guest",
}: {
  guestHref?: string;
}) {
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setIsHydrated(true));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get("email") || "");
    const submittedPassword = String(formData.get("password") || "");

    if (!hasPublicSupabaseEnv()) {
      setIsSubmitting(false);
      setError(getCustomerSafeAuthError(new Error("missing_supabase_env")));
      return;
    }

    try {
      const result = await loginWithSupabase(submittedEmail, submittedPassword);
      
      if (!result.success) {
        setIsSubmitting(false);
        setError(result.error || "Invalid login credentials");
        return;
      }

      // Clear guest cookie on successful login
      document.cookie = `${PLANNER_GUEST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      window.location.assign(nextPath);
    } catch (_e: unknown) {
      setIsSubmitting(false);
      setError("An unexpected error occurred");
    }
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSignupSubmitting(true);
    setSignupError(null);

    if (!hasPublicSupabaseEnv()) {
      setSignupSubmitting(false);
      setSignupError(getCustomerSafeAuthError(new Error("missing_supabase_env")));
      return;
    }

    try {
      const result = await signupWithSupabase(signupEmail || email, signupPassword);
      
      if (!result.success) {
        setSignupSubmitting(false);
        setSignupError(result.error || "Failed to create account");
        return;
      }

      setSignupSubmitting(false);
      setSignupDone(true);
    } catch (_e: unknown) {
      setSignupSubmitting(false);
      setSignupError("An unexpected error occurred");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="shell-workspace-hero shell-workspace-auth-form shell-workspace-auth-form--inverse">
        <div className="mb-8">
          <p className="typ-label shell-workspace-auth-kicker">
            Suite Access
          </p>
          <h2 className="typ-h2 shell-workspace-auth-title mt-3">
            Sign in to your workspace
          </h2>
          <p className="shell-workspace-muted mt-3 text-sm leading-6">
            Use your account to continue through the shared product chooser, then launch Planner, Configurator, and downstream member review surfaces.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label htmlFor="login-email" className="shell-workspace-auth-label">
            <span className="typ-label shell-workspace-auth-label-text">
              Email
            </span>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="shell-workspace-auth-input text-sm"
              placeholder="you@company.com"
            />
          </label>

          <label htmlFor="login-password" className="shell-workspace-auth-label">
            <span className="typ-label shell-workspace-auth-label-text">
              Password
            </span>
            <input
              id="login-password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="shell-workspace-auth-input text-sm"
              placeholder="Enter your password"
            />
          </label>

          {error ? (
            <div className="shell-workspace-auth-alert text-sm">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={!isHydrated || isSubmitting}
            className="btn-primary shell-workspace-auth-submit disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="shell-workspace-subtle mt-6 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {guestHref ? (
                <Link href={guestHref} className="shell-workspace-link transition">
                  Continue as guest
                </Link>
              ) : null}
            </div>
            <span>Protected suite and member access</span>
          </div>

          {!showSignup && (
            <div className="mt-2">
              <button
                type="button"
                className="shell-workspace-link"
                onClick={() => {
                  setShowSignup(true);
                  setSignupEmail(email);
                }}
              >
                Create an account
              </button>
            </div>
          )}

          {showSignup && !signupDone && (
            <form onSubmit={handleSignup} className="space-y-3 w-full max-w-md">
              <p className="typ-label">Create account</p>
              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Email</span>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="you@company.com"
                />
              </label>

              <label className="shell-workspace-auth-label">
                <span className="typ-label shell-workspace-auth-label-text">Password</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="shell-workspace-auth-input text-sm"
                  placeholder="Create a password"
                />
              </label>

              {signupError ? (
                <div className="shell-workspace-auth-alert text-sm">{signupError}</div>
              ) : null}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={signupSubmitting}
                  className="btn-secondary shell-workspace-auth-submit disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {signupSubmitting ? 'Creating...' : 'Create account'}
                </button>
                <button
                  type="button"
                  className="shell-workspace-link"
                  onClick={() => setShowSignup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {signupDone && (
            <div className="shell-workspace-auth-alert text-sm">
              Account created! Please check your email to confirm, then sign in above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
