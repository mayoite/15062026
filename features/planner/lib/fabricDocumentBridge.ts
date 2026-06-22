import {
  createPlannerDocument,
  normalizePlannerDocument,
  normalizePlannerDocumentId,
  toPlannerJsonSafe,
  type PlannerDocument,
  type PlannerMeasurementSourceUnit,
  type PlannerSceneEnvelope,
  type PlannerSceneItem,
  type PlannerSceneRoom,
  getPlannerSceneEnvelope,
} from "../model";
import { logPlannerDocumentBuildAttempt } from "../model/plannerDocumentLogging";
import type { MeasurementUnit } from "./measurements";
import {
  fabricObjectCategory,
  fabricObjectToSceneItem,
  parseFabricObjects,
  resolveRoomMmFromFabricObjects,
} from "@/features/planner/canvas-fabric/fabricSceneUtils";

const DEFAULT_ROOM: PlannerSceneRoom = {
  widthMm: 5000,
  depthMm: 4000,
  wallHeightMm: 2400,
  wallThicknessMm: 120,
  floorThicknessMm: 40,
  originMm: { xMm: 0, yMm: 0 },
};

export interface BuildPlannerDocumentFromFabricOptions {
  documentId?: string | null;
  name?: string;
  projectName?: string | null;
  clientName?: string | null;
  preparedBy?: string | null;
  seatTarget?: number;
  unitSystem: MeasurementUnit;
  thumbnailUrl?: string | null;
}

function fabricObjectsToItems(objects: unknown[]): PlannerSceneItem[] {
  return parseFabricObjects(
    objects.length ? JSON.stringify({ objects }) : null,
  )
    .filter((object) => {
      const name = String(object.name ?? "");
      return fabricObjectCategory(name) === "Furniture";
    })
    .map((o, index) => fabricObjectToSceneItem(o, index));
}

export function buildPlannerDocumentFromFabric(
  serialized: string | null,
  options: BuildPlannerDocumentFromFabricOptions,
): PlannerDocument {
  let room = DEFAULT_ROOM;
  let items: PlannerSceneItem[] = [];
  let fabricSnapshot: unknown = null;

  if (serialized) {
    try {
      fabricSnapshot = JSON.parse(serialized);
      const objects = parseFabricObjects(serialized);
      items = fabricObjectsToItems(objects);
      const roomMm = resolveRoomMmFromFabricObjects(objects, {
        widthMm: DEFAULT_ROOM.widthMm,
        depthMm: DEFAULT_ROOM.depthMm,
      });
      room = {
        ...DEFAULT_ROOM,
        widthMm: roomMm.widthMm,
        depthMm: roomMm.depthMm,
      };
    } catch {
      fabricSnapshot = null;
    }
  }

  const sceneJson = {
    type: "cad-suite-planner-scene",
    version: 1,
    measurement: {
      canonicalUnit: "mm",
      displayUnit: options.unitSystem,
      sourceUnit: "mm" as PlannerMeasurementSourceUnit,
    },
    room,
    items,
    fabricSnapshot,
  } satisfies PlannerSceneEnvelope & { fabricSnapshot: unknown };

  logPlannerDocumentBuildAttempt({
    source: "buildPlannerDocumentFromFabric",
    documentId: normalizePlannerDocumentId(options.documentId),
    itemCount: items.length,
    shapeCount: items.length,
    unitSystem: options.unitSystem,
    sceneEnvelopeType: sceneJson.type,
  });

  return createPlannerDocument({
    id: normalizePlannerDocumentId(options.documentId),
    name: options.name,
    projectName: options.projectName ?? null,
    clientName: options.clientName ?? null,
    preparedBy: options.preparedBy ?? null,
    roomWidthMm: room.widthMm,
    roomDepthMm: room.depthMm,
    seatTarget: options.seatTarget ?? 10,
    unitSystem: options.unitSystem === "ft-in" ? "imperial" : "metric",
    sceneJson: toPlannerJsonSafe(sceneJson),
    itemCount: items.length,
    thumbnailUrl: options.thumbnailUrl ?? null,
  });
}

export function getFabricSnapshotFromDocument(document: PlannerDocument): string | null {
  const normalized = normalizePlannerDocument(document);
  const scene = getPlannerSceneEnvelope(normalized.sceneJson);
  if (!scene) return null;

  const snapshot = (scene as PlannerSceneEnvelope & { fabricSnapshot?: unknown }).fabricSnapshot;
  if (typeof snapshot === "string") return snapshot;
  if (snapshot && typeof snapshot === "object") return JSON.stringify(snapshot);
  return null;
}

export function loadPlannerDocumentIntoFabric(
  importDraft: (serialized: string) => Promise<void>,
  document: PlannerDocument,
): boolean {
  const serialized = getFabricSnapshotFromDocument(document);
  if (!serialized) return false;
  void importDraft(serialized);
  return true;
}
