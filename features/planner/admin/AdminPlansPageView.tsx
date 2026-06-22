"use client";



import { useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { ExternalLink, Loader2, RefreshCw, Search } from "lucide-react";



import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

import {

  buildAdminPlansListQuery,

  buildPlannerCanvasHref,

  type AdminPlanStatus,

} from "@/features/planner/admin/plannerAdminLinks";



type AdminPlanSummary = {

  id: string;

  title: string;

  project_name: string | null;

  client_name: string | null;

  item_count: number;

  room_width_mm: number;

  room_depth_mm: number;

  status: AdminPlanStatus;

  review_status: "pending" | "approved";

  created_at: string;

  updated_at: string;

};



type PlansResponse = {

  plans: AdminPlanSummary[];

  pagination: { page: number; limit: number; total: number; pages: number };

  source: string;

};



const STATUS_OPTIONS: Array<{ value: "all" | AdminPlanStatus; label: string }> = [

  { value: "all", label: "All statuses" },

  { value: "draft", label: "Draft" },

  { value: "active", label: "Approved" },

  { value: "archived", label: "Archived" },

];



const SORT_OPTIONS = [

  { value: "updated_at:desc", label: "Recently updated" },

  { value: "updated_at:asc", label: "Oldest updated" },

  { value: "created_at:desc", label: "Recently created" },

  { value: "created_at:asc", label: "Oldest created" },

] as const;



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



function parseSortValue(value: string): { sortBy: "updated_at" | "created_at"; sortOrder: "asc" | "desc" } {

  const [sortBy, sortOrder] = value.split(":") as ["updated_at" | "created_at", "asc" | "desc"];

  return {

    sortBy: sortBy === "created_at" ? "created_at" : "updated_at",

    sortOrder: sortOrder === "asc" ? "asc" : "desc",

  };

}



export default function AdminPlansPageView() {

  const [plans, setPlans] = useState<AdminPlanSummary[]>([]);

  const [pagination, setPagination] = useState<PlansResponse["pagination"] | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState<string | null>(null);



  const [statusFilter, setStatusFilter] = useState<"all" | AdminPlanStatus>("all");

  const [searchInput, setSearchInput] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [sortValue, setSortValue] = useState<(typeof SORT_OPTIONS)[number]["value"]>("updated_at:desc");



  const { sortBy, sortOrder } = useMemo(() => parseSortValue(sortValue), [sortValue]);



  useEffect(() => {

    const timer = window.setTimeout(() => setSearchQuery(searchInput.trim()), 350);

    return () => window.clearTimeout(timer);

  }, [searchInput]);



  const loadPlans = useCallback(async () => {

    setLoading(true);

    setError(null);

    try {

      const query = buildAdminPlansListQuery({

        limit: 50,

        status: statusFilter,

        search: searchQuery,

        sortBy,

        sortOrder,

      });

      const response = await browserApiFetch(apiPath(query));

      if (!response.ok) {

        throw new Error(`Failed to load plans (${response.status})`);

      }

      const payload = (await response.json()) as PlansResponse;

      setPlans(payload.plans ?? []);

      setPagination(payload.pagination ?? null);

      setSource(payload.source ?? null);

    } catch (loadError) {

      setError(loadError instanceof Error ? loadError.message : "Failed to load plans");

    } finally {

      setLoading(false);

    }

  }, [searchQuery, sortBy, sortOrder, statusFilter]);



  useEffect(() => {

    const controller = new AbortController();

    let cancelled = false;



    const loadInitialPlans = async () => {

      try {

        const query = buildAdminPlansListQuery({

          limit: 50,

          status: statusFilter,

          search: searchQuery,

          sortBy,

          sortOrder,

        });

        const response = await browserApiFetch(apiPath(query), { signal: controller.signal });

        if (!response.ok) {

          throw new Error(`Failed to load plans (${response.status})`);

        }

        const payload = (await response.json()) as PlansResponse;

        if (cancelled) return;

        setPlans(payload.plans ?? []);

        setPagination(payload.pagination ?? null);

        setSource(payload.source ?? null);

      } catch (loadError) {

        if (cancelled || controller.signal.aborted) return;

        setError(loadError instanceof Error ? loadError.message : "Failed to load plans");

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    };



    void loadInitialPlans();



    return () => {

      cancelled = true;

      controller.abort();

    };

  }, [searchQuery, sortBy, sortOrder, statusFilter]);



  const hasActiveFilters = statusFilter !== "all" || searchQuery.length > 0;



  return (

    <div className="mx-auto max-w-6xl p-6 md:p-8">

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

        <div>

          <p className="text-xs uppercase tracking-wide text-soft">Admin review</p>

          <h1 className="text-2xl font-semibold text-strong">Planner plans</h1>

          <p className="mt-1 text-sm text-muted">

            Filter saved documents, review metadata, and open any plan in the canvas workspace.

          </p>

        </div>

        <button

          type="button"

          className="btn-outline inline-flex items-center gap-2"

          onClick={() => void loadPlans()}

          disabled={loading}

        >

          {loading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}

          Refresh

        </button>

      </div>



      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-soft bg-panel p-4">

        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">

          <span className="text-xs uppercase tracking-wide text-soft">Search</span>

          <span className="relative">

            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft" aria-hidden />

            <input

              type="search"

              value={searchInput}

              onChange={(event) => setSearchInput(event.target.value)}

              placeholder="Title, project, client…"

              className="w-full rounded-lg border border-soft bg-subtle py-2 pl-9 pr-3 text-sm"

            />

          </span>

        </label>

        <label className="flex flex-col gap-1 text-sm">

          <span className="text-xs uppercase tracking-wide text-soft">Status</span>

          <select

            className="rounded-lg border border-soft bg-subtle px-3 py-2 text-sm"

            value={statusFilter}

            onChange={(event) => setStatusFilter(event.target.value as "all" | AdminPlanStatus)}

          >

            {STATUS_OPTIONS.map((option) => (

              <option key={option.value} value={option.value}>

                {option.label}

              </option>

            ))}

          </select>

        </label>

        <label className="flex flex-col gap-1 text-sm">

          <span className="text-xs uppercase tracking-wide text-soft">Sort</span>

          <select

            className="rounded-lg border border-soft bg-subtle px-3 py-2 text-sm"

            value={sortValue}

            onChange={(event) => setSortValue(event.target.value as (typeof SORT_OPTIONS)[number]["value"])}

          >

            {SORT_OPTIONS.map((option) => (

              <option key={option.value} value={option.value}>

                {option.label}

              </option>

            ))}

          </select>

        </label>

        {hasActiveFilters ? (

          <button

            type="button"

            className="btn-outline"

            onClick={() => {

              setStatusFilter("all");

              setSearchInput("");

              setSearchQuery("");

            }}

          >

            Clear filters

          </button>

        ) : null}

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



      {pagination ? (

        <p className="mb-3 text-sm text-muted">

          Showing {plans.length} of {pagination.total} plan{pagination.total === 1 ? "" : "s"}

        </p>

      ) : null}



      {loading ? (

        <div className="flex items-center gap-2 text-sm text-muted">

          <Loader2 size={16} className="animate-spin" aria-hidden />

          Loading plans…

        </div>

      ) : plans.length === 0 ? (

        <div className="rounded-xl border border-soft bg-panel p-6 text-sm text-muted">

          {hasActiveFilters ? "No plans match the current filters." : "No plans found yet."}

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

                <th className="px-4 py-3 font-medium">Actions</th>

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

                  <td className="px-4 py-3">

                    <Link

                      href={buildPlannerCanvasHref(plan.id)}

                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"

                    >

                      <ExternalLink size={14} aria-hidden />

                      Open in canvas

                    </Link>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>

  );

}

