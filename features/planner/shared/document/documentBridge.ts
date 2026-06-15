/**
 * Cross-Planner Document Bridge — Phase 05
 *
 * Captures planner state into a unified PlannerDocument and restores it.
 * Supports both Oando and Buddy planner data shapes.
 */

import type {
  PlannerDocument,
  PlannerType,
  DocumentWorkspace,
  DocumentMetadata,
  DocumentWall,
  DocumentRoom,
  DocumentFurniture,
  DocumentDoor,
  DocumentWindow,
  DocumentZone,
  DocumentMeasurement,
  DocumentPoint,
} from "./types";

// ─── Generic capture inputs ─────────────────────────────────────────────────

export type CaptureWallInput = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  thickness?: number;
  material?: string;
};

export type CaptureRoomInput = {
  id: string;
  name: string;
  points: { x: number; y: number }[];
  color: string;
  opacity?: number;
};

export type CaptureFurnitureInput = {
  id: string;
  catalogId?: string;
  name: string;
  category?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  zIndex?: number;
  locked?: boolean;
};

export type CaptureDoorInput = {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  swing?: "left" | "right";
  type?: "single" | "double" | "sliding";
};

export type CaptureWindowInput = {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  type?: "fixed" | "casement" | "sliding";
};

export type CaptureZoneInput = {
  id: string;
  name: string;
  type: string;
  points: { x: number; y: number }[];
  color: string;
  opacity?: number;
};

export type CaptureMeasurementInput = {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  label?: string;
};

export type CaptureInput = {
  walls: CaptureWallInput[];
  rooms: CaptureRoomInput[];
  furniture: CaptureFurnitureInput[];
  doors: CaptureDoorInput[];
  windows: CaptureWindowInput[];
  zones?: CaptureZoneInput[];
  measurements?: CaptureMeasurementInput[];
};

export type CaptureOptions = {
  sourceEngine: PlannerType;
  metadata: Omit<DocumentMetadata, "unitSystem"> & { unitSystem?: "metric" | "imperial" };
  extensions?: Record<string, unknown>;
};

// ─── Capture (Serialize) ────────────────────────────────────────────────────

/**
 * Capture raw planner state into a PlannerDocument.
 */
export function captureDocument(
  input: CaptureInput,
  options: CaptureOptions,
): PlannerDocument {
  const now = new Date().toISOString();

  const workspace: DocumentWorkspace = {
    walls: input.walls.map(normalizeWall),
    rooms: input.rooms.map(normalizeRoom),
    furniture: input.furniture.map(normalizeFurniture),
    doors: input.doors.map(normalizeDoor),
    windows: input.windows.map(normalizeWindow),
    zones: (input.zones ?? []).map(normalizeZone),
    measurements: (input.measurements ?? []).map(normalizeMeasurement),
  };

  return {
    version: "1.0.0",
    sourceEngine: options.sourceEngine,
    createdAt: now,
    updatedAt: now,
    metadata: {
      unitSystem: "metric",
      ...options.metadata,
    },
    workspace,
    extensions: options.extensions,
  };
}

// ─── Restore (Deserialize) ──────────────────────────────────────────────────

export type RestoreResult = {
  workspace: DocumentWorkspace;
  metadata: DocumentMetadata;
  sourceEngine: PlannerType;
};

/**
 * Restore a PlannerDocument for consumption by any planner engine.
 * Validates the version and returns the workspace data.
 */
export function restoreDocument(doc: PlannerDocument): RestoreResult {
  if (!doc.version || !doc.workspace) {
    throw new Error("Invalid PlannerDocument: missing version or workspace");
  }

  return {
    workspace: doc.workspace,
    metadata: doc.metadata,
    sourceEngine: doc.sourceEngine,
  };
}

// ─── Cross-Planner Import ───────────────────────────────────────────────────

export type ImportWarning = {
  type: "unsupported_extension" | "dimension_mismatch" | "missing_catalog_id";
  message: string;
  elementId?: string;
};

export type CrossImportResult = {
  workspace: DocumentWorkspace;
  metadata: DocumentMetadata;
  warnings: ImportWarning[];
};

/**
 * Import a document from another planner engine.
 * Strips engine-specific extensions and flags any compatibility issues.
 */
export function importFromOtherEngine(
  doc: PlannerDocument,
  targetEngine: PlannerType,
): CrossImportResult {
  const warnings: ImportWarning[] = [];

  // Flag if extensions exist from source engine
  if (doc.extensions && Object.keys(doc.extensions).length > 0) {
    warnings.push({
      type: "unsupported_extension",
      message: `Document has ${doc.sourceEngine}-specific extensions that will be ignored in ${targetEngine}`,
    });
  }

  // Check furniture catalog IDs
  for (const item of doc.workspace.furniture) {
    if (!item.catalogId) {
      warnings.push({
        type: "missing_catalog_id",
        message: `Furniture item "${item.name}" has no catalogId — it may not render correctly`,
        elementId: item.id,
      });
    }
  }

  return {
    workspace: doc.workspace,
    metadata: doc.metadata,
    warnings,
  };
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Quick structural check that a JSON blob is a valid PlannerDocument.
 */
export function validateDocument(data: unknown): data is PlannerDocument {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.version !== "1.0.0") return false;
  if (!obj.workspace || typeof obj.workspace !== "object") return false;
  if (!obj.metadata || typeof obj.metadata !== "object") return false;
  if (!["oando", "buddy"].includes(obj.sourceEngine as string)) return false;
  return true;
}

// ─── Normalization helpers ──────────────────────────────────────────────────

function normalizePoint(p: { x: number; y: number }): DocumentPoint {
  return { x: p.x, y: p.y };
}

function normalizeWall(w: CaptureWallInput): DocumentWall {
  return {
    id: w.id,
    start: normalizePoint(w.start),
    end: normalizePoint(w.end),
    ...(w.thickness !== undefined && { thickness: w.thickness }),
    ...(w.material !== undefined && { material: w.material }),
  };
}

function normalizeRoom(r: CaptureRoomInput): DocumentRoom {
  return {
    id: r.id,
    name: r.name,
    points: r.points.map(normalizePoint),
    color: r.color,
    ...(r.opacity !== undefined && { opacity: r.opacity }),
  };
}

function normalizeFurniture(f: CaptureFurnitureInput): DocumentFurniture {
  return {
    id: f.id,
    catalogId: f.catalogId ?? "",
    name: f.name,
    category: f.category ?? "uncategorized",
    x: f.x,
    y: f.y,
    width: f.width,
    height: f.height,
    rotation: f.rotation,
    ...(f.color !== undefined && { color: f.color }),
    ...(f.zIndex !== undefined && { zIndex: f.zIndex }),
    ...(f.locked !== undefined && { locked: f.locked }),
  };
}

function normalizeDoor(d: CaptureDoorInput): DocumentDoor {
  return {
    id: d.id,
    x: d.x,
    y: d.y,
    width: d.width,
    rotation: d.rotation,
    ...(d.swing !== undefined && { swing: d.swing }),
    ...(d.type !== undefined && { type: d.type }),
  };
}

function normalizeWindow(w: CaptureWindowInput): DocumentWindow {
  return {
    id: w.id,
    x: w.x,
    y: w.y,
    width: w.width,
    rotation: w.rotation,
    ...(w.type !== undefined && { type: w.type }),
  };
}

function normalizeZone(z: CaptureZoneInput): DocumentZone {
  return {
    id: z.id,
    name: z.name,
    type: z.type,
    points: z.points.map(normalizePoint),
    color: z.color,
    ...(z.opacity !== undefined && { opacity: z.opacity }),
  };
}

function normalizeMeasurement(m: CaptureMeasurementInput): DocumentMeasurement {
  return {
    id: m.id,
    start: normalizePoint(m.start),
    end: normalizePoint(m.end),
    ...(m.label !== undefined && { label: m.label }),
  };
}
