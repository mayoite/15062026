import { createPlannerDocument, type PlannerDocument } from "@/features/planner/model/plannerDocument";

export interface PlannerPortalPublishData {
  projectName: string;
  walls: unknown[];
  rooms: unknown[];
  furniture: unknown[];
  doors: unknown[];
  windows: unknown[];
  measurements: unknown[];
  zones: unknown[];
  textLabels: unknown[];
  structuralElements: unknown[];
  backgroundImage: unknown;
}

export interface PlannerPortalPublishOptions {
  status?: PlannerDocument["status"];
  now?: string;
}

export function computePlannerPortalItemCount(data: PlannerPortalPublishData): number {
  return (
    data.furniture.length +
    data.rooms.length +
    data.walls.length +
    data.doors.length +
    data.windows.length
  );
}

export function buildPlannerDocumentFromPortalPublishData(
  data: PlannerPortalPublishData,
  options: PlannerPortalPublishOptions = {},
): PlannerDocument {
  const now = options.now ?? new Date().toISOString();
  const title = data.projectName.trim() || "Untitled Project";
  const itemCount = computePlannerPortalItemCount(data);

  return createPlannerDocument({
    title,
    name: title,
    projectName: title,
    roomWidthMm: 6000,
    roomDepthMm: 8000,
    seatTarget: itemCount,
    unitSystem: "metric",
    sceneJson: data as unknown as PlannerDocument["sceneJson"],
    itemCount,
    status: options.status ?? "draft",
    createdAt: now,
    updatedAt: now,
  });
}
