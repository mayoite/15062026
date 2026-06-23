"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

type AnalyticsSummary = {
  avgArea: number;
  avgItems: number;
  totalPlans: number;
};

type SeriesPoint = { date: string; count?: number; activeUsers?: number };

type TopFurniture = { name: string; count: number; category: string };

type ExportRow = { format: string; count: number };

type AnalyticsResponse = {
  success?: boolean;
  summary: AnalyticsSummary;
  topFurniture: TopFurniture[];
  exports: ExportRow[];
  plansCreated: SeriesPoint[];
  activeUsers: SeriesPoint[];
  source?: string;
};

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
] as const;

export default function AdminAnalyticsPageView() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("30d");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(apiPath(`/api/admin/analytics?period=${period}`));
      if (!response.ok) {
        throw new Error(`Failed to load analytics (${response.status})`);
      }
      const payload = (await response.json()) as AnalyticsResponse;
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAnalytics();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAnalytics]);

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-soft">Planner usage</p>
          <h1 className="text-2xl font-semibold text-strong">Analytics</h1>
          <p className="mt-1 text-sm text-muted">
            Plan volume, furniture popularity, and export breakdown from the planner database.
          </p>
          {data?.source ? <p className="mt-1 text-xs text-soft">Source: {data.source}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-soft bg-panel px-3 py-2 text-sm"
            value={period}
            onChange={(event) => setPeriod(event.target.value as (typeof PERIODS)[number]["value"])}
          >
            {PERIODS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn-outline inline-flex items-center gap-2 px-3 py-2 text-sm"
            onClick={() => void loadAnalytics()}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Loading analytics…
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-soft bg-panel p-4">
              <p className="text-xs uppercase tracking-wide text-soft">Total plans</p>
              <p className="mt-1 text-2xl font-semibold text-strong">{data.summary.totalPlans}</p>
            </div>
            <div className="rounded-xl border border-soft bg-panel p-4">
              <p className="text-xs uppercase tracking-wide text-soft">Avg items / plan</p>
              <p className="mt-1 text-2xl font-semibold text-strong">{data.summary.avgItems}</p>
            </div>
            <div className="rounded-xl border border-soft bg-panel p-4">
              <p className="text-xs uppercase tracking-wide text-soft">Avg area (m²)</p>
              <p className="mt-1 text-2xl font-semibold text-strong">{data.summary.avgArea}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-soft bg-panel p-4">
              <h2 className="text-sm font-semibold text-strong">Top furniture</h2>
              <ul className="mt-3 divide-y divide-soft text-sm">
                {data.topFurniture.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-4 py-2">
                    <span>{item.name}</span>
                    <span className="text-muted">
                      {item.category} · {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-soft bg-panel p-4">
              <h2 className="text-sm font-semibold text-strong">Export breakdown</h2>
              <ul className="mt-3 divide-y divide-soft text-sm">
                {data.exports.map((row) => (
                  <li key={row.format} className="flex items-center justify-between gap-4 py-2">
                    <span>{row.format}</span>
                    <span className="text-muted">{row.count}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="rounded-xl border border-soft bg-panel p-4">
            <h2 className="text-sm font-semibold text-strong">Plans created</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-soft">
                  <tr>
                    <th className="px-2 py-2 font-medium">Date</th>
                    <th className="px-2 py-2 font-medium">New plans</th>
                    <th className="px-2 py-2 font-medium">Active users (series)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plansCreated.slice(-10).map((point, index) => (
                    <tr key={point.date} className="border-t border-soft">
                      <td className="px-2 py-2">{point.date}</td>
                      <td className="px-2 py-2 text-muted">{point.count ?? 0}</td>
                      <td className="px-2 py-2 text-muted">
                        {data.activeUsers[data.plansCreated.length - 10 + index]?.activeUsers ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
