import type { CatalogCategory, CatalogItem } from "@/features/planner/catalog/catalogTypes";
import { usePlannerCatalogStore } from "@/features/planner/catalog/catalogStore";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";
import type { SpaceSuggestInput } from "@/features/planner/ai/types";

/** Primary layout goal collected before the user enters the canvas. */
export type PlannerPrimaryPurpose =
  | "workstations"
  | "meeting-rooms"
  | "executive-cabin"
  | "mixed";

/** Project metadata saved to workspace state and planner document scene JSON. */
export type PlannerProjectMetadata = {
  projectName: string;
  city: string;
  floorAreaSqFt: number;
  primaryPurpose: PlannerPrimaryPurpose;
  seatTarget: number;
  /** ISO timestamp set when the user completes project setup. */
  completedAt: string;
};

export type PlannerProjectSetupDraft = Omit<PlannerProjectMetadata, "completedAt">;

export const PLANNER_PROJECT_SETUP_STORAGE_KEY = "oando-project-setup-complete";

export const PLANNER_INDIAN_CITIES = [
  "Patna",
  "Ranchi",
  "Kolkata",
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Pune",
  "Ahmedabad",
  "Lucknow",
  "Jaipur",
  "Bhubaneswar",
  "Guwahati",
  "Chandigarh",
  "Kochi",
  "Indore",
  "Nagpur",
  "Visakhapatnam",
  "Coimbatore",
] as const;

export type PlannerIndianCity = (typeof PLANNER_INDIAN_CITIES)[number];

export const PLANNER_PRIMARY_PURPOSE_OPTIONS: Array<{
  value: PlannerPrimaryPurpose;
  label: string;
  description: string;
}> = [
  {
    value: "workstations",
    label: "Workstations",
    description: "Desks, benches, and open-plan seating",
  },
  {
    value: "meeting-rooms",
    label: "Meeting Rooms",
    description: "Conference tables, pods, and collaboration zones",
  },
  {
    value: "executive-cabin",
    label: "Executive Cabin",
    description: "Private cabins, boardrooms, and premium storage",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Blend of desks, meeting spaces, and support furniture",
  },
];

const PURPOSE_CATEGORIES: Record<PlannerPrimaryPurpose, CatalogCategory[]> = {
  workstations: ["desks", "storage", "zones", "infrastructure"],
  "meeting-rooms": ["rooms", "equipment", "desks", "storage", "infrastructure"],
  "executive-cabin": ["desks", "rooms", "storage", "equipment", "infrastructure"],
  mixed: ["desks", "rooms", "equipment", "storage", "zones", "infrastructure"],
};

const EXECUTIVE_TAG_HINTS = ["executive", "boardroom", "conference", "cabin"];
const MEETING_TAG_HINTS = ["meeting", "conference", "boardroom", "pod", "collab"];
const WORKSTATION_TAG_HINTS = ["workstation", "desk", "bench", "sharing", "seat"];

/** Grid scale: > 5 000 sq ft → 1 m per unit; otherwise 0.5 m per unit. */
export function resolveGridMmPerUnit(floorAreaSqFt: number): number {
  return floorAreaSqFt > 5000 ? 1000 : 500;
}

export function projectSetupStorageKey(guestMode: boolean, planId?: string): string {
  const scope = guestMode ? "guest" : "member";
  return `${PLANNER_PROJECT_SETUP_STORAGE_KEY}-${scope}-${planId ?? "new"}`;
}

export function isProjectSetupCompleteInStorage(guestMode: boolean, planId?: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(projectSetupStorageKey(guestMode, planId)) === "true";
}

export function markProjectSetupCompleteInStorage(guestMode: boolean, planId?: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(projectSetupStorageKey(guestMode, planId), "true");
}

export function filterCatalogItemsByPurpose(
  items: CatalogItem[],
  purpose: PlannerPrimaryPurpose,
): CatalogItem[] {
  if (purpose === "mixed") return items;

  const allowedCategories = new Set(PURPOSE_CATEGORIES[purpose]);

  return items.filter((item) => {
    if (!allowedCategories.has(item.category)) return false;

    const tagBlob = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();

    if (purpose === "workstations") {
      if (item.category === "desks") return true;
      if (item.category === "storage" || item.category === "zones" || item.category === "infrastructure") {
        return true;
      }
      return WORKSTATION_TAG_HINTS.some((hint) => tagBlob.includes(hint));
    }

    if (purpose === "meeting-rooms") {
      if (item.category === "rooms" || item.category === "equipment") return true;
      if (item.category === "desks") {
        return MEETING_TAG_HINTS.some((hint) => tagBlob.includes(hint));
      }
      return item.category === "storage" || item.category === "infrastructure";
    }

    if (purpose === "executive-cabin") {
      if (item.category === "rooms") {
        return EXECUTIVE_TAG_HINTS.some((hint) => tagBlob.includes(hint)) || item.tags.includes("room");
      }
      if (item.category === "desks") {
        return EXECUTIVE_TAG_HINTS.some((hint) => tagBlob.includes(hint)) || item.seatCount !== undefined;
      }
      return item.category === "storage" || item.category === "equipment" || item.category === "infrastructure";
    }

    return true;
  });
}

/** Apply setup answers to workspace store, catalog filter, and grid calibration.
 * All three mutations must succeed before any caller writes the completion flag.
 * Throws if any store write fails so the caller can handle the error.
 */
export function applyProjectSetup(metadata: PlannerProjectMetadata): void {
  const { setProjectMetadata } = usePlannerWorkspaceStore.getState();
  const { setPurposeFilter } = usePlannerCatalogStore.getState();

  setProjectMetadata(metadata);
  setPurposeFilter(metadata.primaryPurpose);
}

export function createDefaultProjectSetupDraft(options?: { guestMode?: boolean }): PlannerProjectSetupDraft {
  return {
    projectName: options?.guestMode ? "Guest workspace" : "",
    city: PLANNER_INDIAN_CITIES[0],
    floorAreaSqFt: 1000,
    primaryPurpose: "workstations",
    seatTarget: 50,
  };
}

export function metadataToDocumentFields(metadata: PlannerProjectMetadata) {
  const sqM = metadata.floorAreaSqFt * 0.092903;
  const sideMm = Math.max(3000, Math.round(Math.sqrt(sqM) * 1000));

  return {
    projectName: metadata.projectName,
    seatTarget: metadata.seatTarget,
    clientName: metadata.city,
    roomWidthMm: sideMm,
    roomDepthMm: Math.max(3000, Math.round((sqM * 1_000_000) / sideMm)),
  };
}

export function metadataToSpaceSuggestInput(metadata: PlannerProjectMetadata): SpaceSuggestInput {
  return {
    seatCount: metadata.seatTarget,
    purpose: metadata.primaryPurpose,
    floorAreaSqFt: metadata.floorAreaSqFt,
  };
}
