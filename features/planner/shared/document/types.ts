/**
 * @deprecated — Phase 05 legacy cross-planner types.
 * The canonical PlannerDocument schema with Zod validation, normalization,
 * and migration lives in features/planner/model/plannerDocument.ts.
 * This file is retained for the documentBridge cross-engine import/export
 * utility but should NOT be used for new persistence or save flows.
 * Prefer: import { PlannerDocument } from '@/features/planner/model/plannerDocument';
 */

/**
 * Unified PlannerDocument Schema — Phase 05
 * This is the single canonical document format for serialization/deserialization
 * across both Oando and Buddy planners.
 *
 * Any planner-specific data lives under `extensions[plannerType]`.
 */

export type PlannerType = "oando" | "buddy";

export type DocumentPoint = {
  x: number;
  y: number;
};

export type DocumentWall = {
  id: string;
  start: DocumentPoint;
  end: DocumentPoint;
  thickness?: number;
  material?: string;
};

export type DocumentRoom = {
  id: string;
  name: string;
  points: DocumentPoint[];
  color: string;
  opacity?: number;
};

export type DocumentDoor = {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  swing?: "left" | "right";
  type?: "single" | "double" | "sliding";
};

export type DocumentWindow = {
  id: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  type?: "fixed" | "casement" | "sliding";
};

export type DocumentFurniture = {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color?: string;
  zIndex?: number;
  locked?: boolean;
};

export type DocumentZone = {
  id: string;
  name: string;
  type: string;
  points: DocumentPoint[];
  color: string;
  opacity?: number;
};

export type DocumentMeasurement = {
  id: string;
  start: DocumentPoint;
  end: DocumentPoint;
  label?: string;
};

export type DocumentMetadata = {
  title: string;
  description?: string;
  author?: string;
  clientName?: string;
  tags?: string[];
  unitSystem: "metric" | "imperial";
  roomWidthMm?: number;
  roomDepthMm?: number;
};

export type DocumentWorkspace = {
  walls: DocumentWall[];
  rooms: DocumentRoom[];
  furniture: DocumentFurniture[];
  doors: DocumentDoor[];
  windows: DocumentWindow[];
  zones: DocumentZone[];
  measurements: DocumentMeasurement[];
};

/**
 * The canonical planner document.
 * Both Oando and Buddy produce and consume this format.
 */
export type PlannerDocument = {
  /** Schema version for forward-compat migrations */
  version: "1.0.0";
  /** Which planner originally created this document */
  sourceEngine: PlannerType;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp of last modification */
  updatedAt: string;
  /** Project metadata */
  metadata: DocumentMetadata;
  /** The spatial workspace data */
  workspace: DocumentWorkspace;
  /** Engine-specific extensions that don't affect cross-planner import */
  extensions?: Record<string, unknown>;
};
