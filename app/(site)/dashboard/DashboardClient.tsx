"use client";

/**
 * Thin re-export layer for the dashboard client implementation.
 * The shared implementation lives under features/shared/dashboard/
 * so app/ stays limited to route composition and wiring.
 */
export { DashboardClient } from "@/features/shared/dashboard/DashboardClient";
