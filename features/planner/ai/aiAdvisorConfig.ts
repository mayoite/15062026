import {
  createDefaultProjectSetupDraft,
  PLANNER_PRIMARY_PURPOSE_OPTIONS,
  type PlannerPrimaryPurpose,
  type PlannerProjectMetadata,
} from "@/features/planner/onboarding/projectSetup";

import type { CatalogPriceTier } from "./types";

export const AI_ADVISOR_PLANNER_ID = "oando" as const;

export const CATALOG_TIER_LABELS: Record<CatalogPriceTier, string> = {
  budget: "Budget",
  standard: "Standard",
  premium: "Premium",
};

export const ZONE_PREVIEW_COLORS: Record<
  "focus" | "collaborative" | "quiet" | "social",
  { fill: string; stroke: string }
> = {
  focus: {
    fill: "color-mix(in srgb, var(--color-primary) 12%, var(--surface-panel))",
    stroke: "var(--color-primary)",
  },
  collaborative: {
    fill: "color-mix(in srgb, var(--color-bronze-500) 14%, var(--surface-panel))",
    stroke: "var(--color-bronze-500)",
  },
  quiet: {
    fill: "color-mix(in srgb, var(--text-muted) 10%, var(--surface-panel))",
    stroke: "var(--text-muted)",
  },
  social: {
    fill: "var(--surface-accent-wash)",
    stroke: "var(--color-bronze-500)",
  },
};

export function resolveSpaceSuggestDefaults(
  metadata: PlannerProjectMetadata | null | undefined,
): {
  seatCount: number;
  purpose: PlannerPrimaryPurpose;
  floorAreaSqFt: number;
} {
  const fallback = createDefaultProjectSetupDraft();
  return {
    seatCount: metadata?.seatTarget ?? fallback.seatTarget,
    purpose: metadata?.primaryPurpose ?? fallback.primaryPurpose,
    floorAreaSqFt: metadata?.floorAreaSqFt ?? fallback.floorAreaSqFt,
  };
}

export function purposeLabel(purpose: PlannerPrimaryPurpose): string {
  return (
    PLANNER_PRIMARY_PURPOSE_OPTIONS.find((option) => option.value === purpose)?.label ?? purpose
  );
}

export function buildChatSuggestionChips(
  metadata: PlannerProjectMetadata | null | undefined,
): string[] {
  const { seatCount, purpose, floorAreaSqFt } = resolveSpaceSuggestDefaults(metadata);
  const purposeText = purposeLabel(purpose).toLowerCase();

  return [
    `Plan ${seatCount} seats for a ${purposeText} office`,
    `Open plan on ${floorAreaSqFt.toLocaleString()} sq ft`,
    purpose === "meeting-rooms"
      ? "Add phone booths along the perimeter"
      : "Add 2 meeting rooms near the entrance",
  ];
}

export function buildAdvisorChatWelcome(metadata: PlannerProjectMetadata | null | undefined): string {
  const { seatCount, purpose } = resolveSpaceSuggestDefaults(metadata);
  const purposeText = purposeLabel(purpose).toLowerCase();

  if (metadata?.projectName) {
    return `Hi! I can help plan ${metadata.projectName} — ${seatCount} seats, ${purposeText} focus. Describe changes or ask for layout ideas.`;
  }

  return `Hi! I'm your layout assistant for ${seatCount} seats (${purposeText}). Describe the space you want and I'll suggest placements.`;
}