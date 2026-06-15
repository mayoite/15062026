export interface PlannerEvent {
  eventType: PlannerEventType;
  timestamp: string;
  sessionId: string;
  userId?: string;
  payload: Record<string, unknown>;
}

export type PlannerEventType =
  | "plan-created"
  | "plan-saved"
  | "plan-loaded"
  | "plan-exported"
  | "furniture-placed"
  | "furniture-removed"
  | "wall-drawn"
  | "room-created"
  | "3d-view-opened"
  | "compliance-check"
  | "ai-suggestion-used"
  | "session-started"
  | "session-ended";

export interface AnalyticsSummary {
  period: string;
  plansCreated: number;
  plansSaved: number;
  plansExported: number;
  exportsByFormat: Record<string, number>;
  mostUsedFurniture: Array<{ name: string; count: number }>;
  averagePlanSizeSqm: number;
  activeUsers: number;
  conversionRate: number;
  totalEvents: number;
}

export interface AnalyticsDateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export const ANALYTICS_PERIODS: AnalyticsDateRange[] = [
  {
    label: "Last 7 days",
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  },
  {
    label: "Last 30 days",
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  },
  {
    label: "Last 90 days",
    startDate: new Date(Date.now() - 90 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
  },
];

const eventStore: PlannerEvent[] = [];

export function trackPlannerEvent(
  eventType: PlannerEventType,
  payload: Record<string, unknown> = {},
  sessionId?: string,
  userId?: string,
): void {
  const event: PlannerEvent = {
    eventType,
    timestamp: new Date().toISOString(),
    sessionId: sessionId ?? `session-${Date.now()}`,
    userId,
    payload,
  };
  eventStore.push(event);

  if (eventStore.length > 10000) {
    eventStore.splice(0, eventStore.length - 10000);
  }
}

export function getEventsByType(eventType: PlannerEventType): PlannerEvent[] {
  return eventStore.filter((e) => e.eventType === eventType);
}

export function getEventsByDateRange(
  startDate: string,
  endDate: string,
): PlannerEvent[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return eventStore.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t >= start && t <= end;
  });
}

export function buildAnalyticsSummary(
  events: PlannerEvent[],
  period: string,
): AnalyticsSummary {
  const plansCreated = events.filter((e) => e.eventType === "plan-created").length;
  const plansSaved = events.filter((e) => e.eventType === "plan-saved").length;
  const exportEvents = events.filter((e) => e.eventType === "plan-exported");
  const plansExported = exportEvents.length;

  const exportsByFormat: Record<string, number> = {};
  for (const e of exportEvents) {
    const format = String(e.payload.format ?? "unknown");
    exportsByFormat[format] = (exportsByFormat[format] ?? 0) + 1;
  }

  const furnitureCounts = new Map<string, number>();
  for (const e of events.filter((ev) => ev.eventType === "furniture-placed")) {
    const name = String(e.payload.furnitureName ?? "Unknown");
    furnitureCounts.set(name, (furnitureCounts.get(name) ?? 0) + 1);
  }
  const mostUsedFurniture = Array.from(furnitureCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const planSizes = events
    .filter((e) => e.eventType === "plan-created" && typeof e.payload.areaSqm === "number")
    .map((e) => e.payload.areaSqm as number);
  const averagePlanSizeSqm =
    planSizes.length > 0
      ? planSizes.reduce((a, b) => a + b, 0) / planSizes.length
      : 0;

  const uniqueUsers = new Set(events.filter((e) => e.userId).map((e) => e.userId));
  const activeUsers = uniqueUsers.size;

  const quoteRequests = events.filter(
    (e) => e.eventType === "plan-exported" && e.payload.format === "quote-request",
  ).length;
  const conversionRate = plansCreated > 0 ? (quoteRequests / plansCreated) * 100 : 0;

  return {
    period,
    plansCreated,
    plansSaved,
    plansExported,
    exportsByFormat,
    mostUsedFurniture,
    averagePlanSizeSqm,
    activeUsers,
    conversionRate,
    totalEvents: events.length,
  };
}
