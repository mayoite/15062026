import type {
  DoorItem,
  FurnitureItem,
  MeasurementItem,
  Room,
  Wall,
  WindowItem,
  Zone,
} from "../data/plannerStore";

export interface PlanReviewInput {
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements?: MeasurementItem[];
  zones?: Zone[];
  quoteStatus?: "pending" | "priced" | "accepted" | "rejected" | null;
}

export interface PlanReviewSummary {
  score: number;
  stage: "starter" | "in-progress" | "review-ready";
  label: string;
  detail: string;
  blockers: string[];
  nextActions: string[];
  checklist: Array<{
    id: "rooms" | "furniture" | "zones" | "measurements" | "openings" | "quote";
    label: string;
    complete: boolean;
  }>;
}

export function getPlanReviewSummary(input: PlanReviewInput): PlanReviewSummary {
  const checklist: PlanReviewSummary["checklist"] = [
    {
      id: "rooms",
      label: "Rooms are defined",
      complete: input.rooms.length > 0,
    },
    {
      id: "furniture",
      label: "Furniture is placed",
      complete: input.furniture.length > 0,
    },
    {
      id: "zones",
      label: "Zones or overlays exist",
      complete: (input.zones?.length ?? 0) > 0,
    },
    {
      id: "measurements",
      label: "Measurements are captured",
      complete: (input.measurements?.length ?? 0) > 0,
    },
    {
      id: "openings",
      label: "Doors or windows are mapped",
      complete: input.doors.length + input.windows.length > 0,
    },
    {
      id: "quote",
      label: "Quote or handoff is in motion",
      complete: Boolean(input.quoteStatus && input.quoteStatus !== "rejected"),
    },
  ];

  let score = 0;

  if (checklist.find((item) => item.id === "rooms")?.complete) score += 25;
  if (checklist.find((item) => item.id === "furniture")?.complete) score += 25;
  if (checklist.find((item) => item.id === "zones")?.complete) score += 20;
  if (checklist.find((item) => item.id === "measurements")?.complete) score += 10;
  if (checklist.find((item) => item.id === "openings")?.complete) score += 10;
  if (checklist.find((item) => item.id === "quote")?.complete) score += 10;

  const blockers = checklist
    .filter((item) => !item.complete)
    .map((item) => item.label);

  const nextActions: string[] = [];
  if (!checklist.find((item) => item.id === "rooms")?.complete) {
    nextActions.push("Define at least one room boundary before review.");
  }
  if (!checklist.find((item) => item.id === "furniture")?.complete) {
    nextActions.push("Place furniture so capacity and layout intent are visible.");
  }
  if (!checklist.find((item) => item.id === "zones")?.complete) {
    nextActions.push("Add zones or overlays to show how the workspace is organized.");
  }
  if (!checklist.find((item) => item.id === "measurements")?.complete) {
    nextActions.push("Capture key measurements to make spacing and circulation reviewable.");
  }
  if (!checklist.find((item) => item.id === "openings")?.complete) {
    nextActions.push("Map doors or windows so access and perimeter context are clear.");
  }
  if (!checklist.find((item) => item.id === "quote")?.complete) {
    nextActions.push("Start quote or handoff work once the layout is stable.");
  }

  if (score >= 75) {
    return {
      score,
      stage: "review-ready",
      label: "Review Ready",
      detail: "This plan has enough structure for portal or admin review.",
      blockers,
      nextActions,
      checklist,
    };
  }

  if (score >= 35) {
    return {
      score,
      stage: "in-progress",
      label: "In Progress",
      detail: "Core planning work is present, but the plan still needs refinement.",
      blockers,
      nextActions,
      checklist,
    };
  }

  return {
    score,
    stage: "starter",
    label: "Starter",
    detail: "The plan needs more room, furniture, or zoning detail before review.",
    blockers,
    nextActions,
    checklist,
  };
}
