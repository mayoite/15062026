import type { StatsSource } from "@/lib/types/businessStats";

export type KpiEventSource = StatsSource;

type KpiPayload = Record<string, string | number | boolean | null>;

function emitEvent(eventName: string, payload: KpiPayload) {
  if (typeof window === "undefined") return;
  const track = window.va?.track;
  if (typeof track !== "function") return;
  track(eventName, payload);
}

export function trackKpiRendered(params: { asOfDate: string; source: KpiEventSource }) {
  emitEvent("kpi_rendered", params);
}

export function trackKpiFallbackUsed(params: { source: Exclude<KpiEventSource, "supabase"> }) {
  emitEvent("kpi_fallback_used", params);
}

export function trackKpiMismatchDetected(params: { page: string; field: string; expected: number; actual: number }) {
  emitEvent("kpi_mismatch_detected", params);
}

export function compareKpiField(
  page: string,
  field: string,
  rendered: number,
  canonical: number,
) {
  if (rendered !== canonical) {
    trackKpiMismatchDetected({
      page,
      field,
      expected: canonical,
      actual: rendered,
    });
  }
}
