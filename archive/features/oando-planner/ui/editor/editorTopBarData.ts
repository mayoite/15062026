import type { PlannerState } from "@/features/oando-planner/data/plannerStore";

/**
 * Pure data-shaping helpers for the top bar's export / share / publish / import
 * flows. They contain no DOM or store side effects, so they can be unit tested
 * directly; the component keeps the Blob/fetch/file plumbing around them.
 */

type ExportSource = Pick<
  PlannerState,
  | "projectName"
  | "walls"
  | "rooms"
  | "furniture"
  | "doors"
  | "windows"
  | "measurements"
  | "zones"
>;

/** Payload written to a downloaded `.json` project file. */
export function buildProjectExportData(s: ExportSource) {
  return {
    projectName: s.projectName,
    walls: s.walls,
    rooms: s.rooms,
    furniture: s.furniture,
    doors: s.doors,
    windows: s.windows,
    measurements: s.measurements,
    zones: s.zones,
    savedAt: new Date().toISOString(),
  };
}

type PortalSource = Pick<
  PlannerState,
  | "projectName"
  | "walls"
  | "rooms"
  | "furniture"
  | "doors"
  | "windows"
  | "measurements"
  | "zones"
  | "textLabels"
  | "structuralElements"
  | "backgroundImage"
>;

/** Plan body persisted when publishing to the client portal. */
export function buildPortalPublishData(s: PortalSource) {
  return {
    projectName: s.projectName,
    walls: s.walls,
    rooms: s.rooms,
    furniture: s.furniture,
    doors: s.doors,
    windows: s.windows,
    measurements: s.measurements,
    zones: s.zones,
    textLabels: s.textLabels,
    structuralElements: s.structuralElements,
    backgroundImage: s.backgroundImage,
  };
}

/**
 * Resolve a stable portal project id from the current project key, minting a
 * fresh uuid when there is no usable existing key.
 */
export function resolvePortalProjectId(currentProjectKey: string | null): string {
  const candidate = currentProjectKey
    ? currentProjectKey.replace("planner_", "")
    : null;
  if (!candidate || candidate.length < 10) {
    return crypto.randomUUID();
  }
  return candidate;
}

type ShareSource = Pick<
  PlannerState,
  | "projectName"
  | "walls"
  | "rooms"
  | "furniture"
  | "doors"
  | "windows"
  | "measurements"
>;

/** URL-encodable payload for the read-only share link. */
export function buildSharePayload(s: ShareSource) {
  return {
    projectName: s.projectName,
    walls: s.walls,
    rooms: s.rooms,
    furniture: s.furniture,
    doors: s.doors,
    windows: s.windows,
    measurements: s.measurements,
    v: 1 as const,
  };
}

/**
 * Normalize a parsed import payload into the planner state slice, backfilling
 * ids and defaults so partial/legacy files still load cleanly.
 */
export function normalizeImportedProject(
  data: Record<string, unknown>
): Partial<PlannerState> {
  const arr = (key: string): Record<string, unknown>[] =>
    (data[key] as Record<string, unknown>[]) || [];

  const patch = {
    projectName: (data.projectName as string) || "Imported Project",
    walls: arr("walls").map((w) => ({
      id: w.id || crypto.randomUUID(),
      start: w.start,
      end: w.end,
      thickness: w.thickness || 8,
    })),
    rooms: arr("rooms").map((r) => ({
      id: r.id || crypto.randomUUID(),
      points: r.points,
      name: r.name || "Room",
      color: r.color || "var(--surface-glass)",
    })),
    furniture: arr("furniture").map((f, i) => ({
      ...f,
      id: f.id || crypto.randomUUID(),
      zIndex: (f.zIndex as number) ?? i,
    })),
    doors: arr("doors").map((d) => ({
      id: d.id || crypto.randomUUID(),
      x: d.x || 0,
      y: d.y || 0,
      width: d.width || 40,
      rotation: d.rotation || 0,
      swing: d.swing || "right",
    })),
    windows: arr("windows").map((w) => ({
      id: w.id || crypto.randomUUID(),
      x: w.x || 0,
      y: w.y || 0,
      width: w.width || 50,
      rotation: w.rotation || 0,
      style: w.style || "double",
    })),
    measurements: arr("measurements").map((m) => ({
      id: m.id || crypto.randomUUID(),
      start: m.start || { x: 0, y: 0 },
      end: m.end || { x: 0, y: 0 },
    })),
    zones: arr("zones").map((z) => ({
      id: z.id || crypto.randomUUID(),
      points: z.points || [],
      name: z.name || "Zone",
      type: z.type || "Open Plan",
      color: z.color || "var(--surface-glass)",
      opacity: z.opacity ?? 0.3,
    })),
    selectedId: null,
    currentProjectKey: null,
    undoStack: [],
    redoStack: [],
    isDirty: false,
  };
  // Values are validated upstream by validateImportedProject; the loose shapes
  // here are intentional backfills for partial/legacy files.
  return patch as unknown as Partial<PlannerState>;
}
