import type {
  DoorItem,
  FurnitureItem,
  MeasurementItem,
  Room,
  StructuralElement,
  TextLabel,
  Wall,
  WindowItem,
  Zone,
  BackgroundImage,
} from "../data/plannerStore";
import type { PlannerDocument } from "../model/plannerDocument";

export interface SavedPlannerProject {
  projectName?: string;
  clientName?: string;
  description?: string;
  walls?: Wall[];
  rooms?: Room[];
  furniture?: FurnitureItem[];
  doors?: DoorItem[];
  windows?: WindowItem[];
  measurements?: MeasurementItem[];
  zones?: Zone[];
  textLabels?: TextLabel[];
  structuralElements?: StructuralElement[];
  backgroundImage?: BackgroundImage | null;
  tags?: string[];
  lightingPreset?: string;
  savedAt?: string;
  thumbnail?: string | null;
}

function getRoomEnvelope(rooms: Room[]): { widthMm: number; depthMm: number } {
  if (rooms.length === 0) {
    return { widthMm: 6000, depthMm: 8000 };
  }

  const points = rooms.flatMap((room) => room.points);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    widthMm: Math.max(1000, Math.round((Math.max(...xs) - Math.min(...xs)) * 10)),
    depthMm: Math.max(1000, Math.round((Math.max(...ys) - Math.min(...ys)) * 10)),
  };
}

export function buildPlannerVersionDocument(
  projectId: string,
  savedProject: SavedPlannerProject,
): PlannerDocument {
  const rooms = savedProject.rooms ?? [];
  const { widthMm, depthMm } = getRoomEnvelope(rooms);
  const itemCount =
    (savedProject.furniture?.length ?? 0) +
    (savedProject.doors?.length ?? 0) +
    (savedProject.windows?.length ?? 0);

  return {
    schemaVersion: 1,
    title: savedProject.projectName || "Untitled plan",
    projectName: savedProject.projectName ?? null,
    clientName: savedProject.clientName ?? null,
    roomWidthMm: widthMm,
    roomDepthMm: depthMm,
    seatTarget: savedProject.furniture?.length ?? 0,
    unitSystem: "metric",
    sceneJson: JSON.parse(JSON.stringify(savedProject)),
    itemCount,
    thumbnailUrl: null,
    status: "draft",
    createdAt: savedProject.savedAt,
    updatedAt: savedProject.savedAt ?? new Date().toISOString(),
  };
}

export function restoreSavedProjectFromVersion(
  document: PlannerDocument,
  fallback: SavedPlannerProject,
): SavedPlannerProject {
  const sceneJson =
    document.sceneJson && typeof document.sceneJson === "object"
      ? (document.sceneJson as SavedPlannerProject)
      : {};

  return {
    ...fallback,
    ...sceneJson,
    projectName:
      sceneJson.projectName ??
      document.projectName ??
      document.title ??
      fallback.projectName,
    clientName: sceneJson.clientName ?? document.clientName ?? fallback.clientName,
    savedAt: new Date().toISOString(),
  };
}
