"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import {
  getAllFlagsGrouped,
  type FeatureFlagName,
  type FeatureFlags,
} from "@/features/planner/lib/featureFlags";

type FlagsResponse = {
  success?: boolean;
  flags: FeatureFlags;
  source?: string;
};

export default function AdminFeatureFlagsPageView() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<FeatureFlagName | null>(null);
  const loadFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(apiPath("/api/admin/features"));
      if (!response.ok) {
        throw new Error(`Failed to load feature flags (${response.status})`);
      }
      const payload = (await response.json()) as FlagsResponse;
      setFlags(payload.flags);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFlags();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadFlags]);

  const toggleFlag = useCallback(async (key: FeatureFlagName, enabled: boolean) => {
    setPendingKey(key);
    setError(null);
    try {
      const response = await browserApiFetch(apiPath("/api/admin/features"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: { [key]: enabled } }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } | string };
        const message =
          typeof body.error === "string"
            ? body.error
            : body.error?.message ?? `Failed to update flag (${response.status})`;
        throw new Error(message);
      }
      const payload = (await response.json()) as { source?: string };
      setFlags((current) => (current ? { ...current, [key]: enabled } : current));
      if (payload.source) setSource(payload.source);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Failed to update feature flag");
    } finally {
      setPendingKey(null);
    }
  }, []);

  const grouped = getAllFlagsGrouped();

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Planner toolbar</p>
          <h1 className="text-2xl font-semibold text-strong">Feature flags</h1>
          <p className="mt-1 text-sm text-muted">
            Toggle planner toolbar items, export actions, panels, and sync behavior. Changes apply to new sessions after refresh.
          </p>
          {source ? <p className="mt-1 text-xs text-soft">Source: {source}</p> : null}
        </div>
        <button
          type="button"
          className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"
          onClick={() => void loadFlags()}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loading && !flags ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading flags…
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.group} className="rounded-xl border border-soft bg-panel">
              <header className="border-b border-soft px-4 py-3">
                <h2 className="text-sm font-semibold text-strong">{group.group}</h2>
              </header>
              <ul className="divide-y divide-soft">
                {group.flags.map((flag) => {
                  const enabled = flags?.[flag.name] ?? flag.defaultValue;
                  const busy = pendingKey === flag.name;
                  return (
                    <li key={flag.name} className="flex items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="font-medium text-strong">{flag.description}</p>
                        <p className="text-xs text-soft">{flag.name}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`${flag.description} ${enabled ? "enabled" : "disabled"}`}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                          enabled ? "bg-primary" : "bg-soft"
                        } ${busy ? "opacity-60" : ""}`}
                        disabled={busy || !flags}
                        onClick={() => void toggleFlag(flag.name, !enabled)}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
