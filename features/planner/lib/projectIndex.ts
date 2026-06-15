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
} from "@/features/planner/store/plannerStore";
import { deleteSnapshotsFor, getLatestSnapshot, getSnapshotCount } from "./versioning";

export interface ProjectIndexEntry {
  id: string;
  key: string;
  name: string;
}

export interface SavedPlanSnapshot {
  id: string;
  name: string;
  savedAt: string;
  rooms: Room[];
  furniture: FurnitureItem[];
}

export interface SavedPlanRecord {
  id: string;
  key: string;
  name: string;
  savedAt: string;
  thumbnail: string | null;
  clientName: string;
  description: string;
  walls: Wall[];
  rooms: Room[];
  furniture: FurnitureItem[];
  doors: DoorItem[];
  windows: WindowItem[];
  measurements: MeasurementItem[];
  zones: Zone[];
  textLabels: TextLabel[];
  structuralElements: StructuralElement[];
  snapshotCount: number;
  latestSnapshotAt: string | null;
}

interface SavedPlanPayload {
  projectName?: string;
  savedAt?: string;
  thumbnail?: string | null;
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
}

function generateProjectId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `planner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeFurniture(items: SavedPlanPayload["furniture"]): FurnitureItem[] {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    ...item,
    zIndex: item.zIndex ?? index,
  }));
}

function buildSavedPlanRecord(entry: ProjectIndexEntry): SavedPlanRecord {
  const parsed = safeParseJson<SavedPlanPayload>(localStorage.getItem(entry.key));
  const latestSnapshot = getLatestSnapshot(entry.id);

  return {
    id: entry.id,
    key: entry.key,
    name: parsed?.projectName || entry.name || "Untitled Project",
    savedAt: parsed?.savedAt || "",
    thumbnail: parsed?.thumbnail || null,
    clientName: parsed?.clientName || "",
    description: parsed?.description || "",
    walls: Array.isArray(parsed?.walls) ? parsed.walls : [],
    rooms: Array.isArray(parsed?.rooms) ? parsed.rooms : [],
    furniture: normalizeFurniture(parsed?.furniture),
    doors: Array.isArray(parsed?.doors) ? parsed.doors : [],
    windows: Array.isArray(parsed?.windows) ? parsed.windows : [],
    measurements: Array.isArray(parsed?.measurements) ? parsed.measurements : [],
    zones: Array.isArray(parsed?.zones) ? parsed.zones : [],
    textLabels: Array.isArray(parsed?.textLabels) ? parsed.textLabels : [],
    structuralElements: Array.isArray(parsed?.structuralElements)
      ? parsed.structuralElements
      : [],
    snapshotCount: getSnapshotCount(entry.id),
    latestSnapshotAt: latestSnapshot?.createdAt ?? null,
  };
}

export function getProjectIdFromKey(key: string): string {
  return key.startsWith("planner_") ? key.slice("planner_".length) : key;
}

export function getProjectIndex(): ProjectIndexEntry[] {
  if (typeof window === "undefined") return [];

  const index = safeParseJson<ProjectIndexEntry[]>(
    localStorage.getItem("planner_project_index"),
  );

  return Array.isArray(index) ? index : [];
}

export function saveProjectIndex(index: ProjectIndexEntry[]) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("planner_project_index", JSON.stringify(index));
  } catch {
    // Swallow storage errors (quota, privacy mode, etc.)
  }
}

export function readSavedProjectPayload(key: string): SavedPlanPayload | null {
  if (typeof window === "undefined") return null;
  return safeParseJson<SavedPlanPayload>(localStorage.getItem(key));
}

export function getSavedPlans(): SavedPlanRecord[] {
  if (typeof window === "undefined") return [];

  return getProjectIndex().map(buildSavedPlanRecord);
}

export function getSavedPlanById(id: string): SavedPlanRecord | null {
  if (typeof window === "undefined") return null;

  const entry = getProjectIndex().find((item) => item.id === id || item.key === `planner_${id}`);
  return entry ? buildSavedPlanRecord(entry) : null;
}

export function getSavedPlanByKey(key: string): SavedPlanRecord | null {
  if (typeof window === "undefined") return null;

  const entry = getProjectIndex().find((item) => item.key === key);
  return entry ? buildSavedPlanRecord(entry) : null;
}

export function renameSavedPlan(key: string, nextName: string): boolean {
  if (typeof window === "undefined") return false;

  const trimmedName = nextName.trim();
  if (!trimmedName) return false;

  const payload = readSavedProjectPayload(key);
  if (!payload) return false;

  payload.projectName = trimmedName;

  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    return false;
  }

  const index = getProjectIndex();
  const entry = index.find((item) => item.key === key);
  if (entry) {
    entry.name = trimmedName;
    saveProjectIndex(index);
  }

  return true;
}

export function updateSavedPlanMetadata(
  key: string,
  updates: { clientName?: string; description?: string },
): boolean {
  if (typeof window === "undefined") return false;

  const payload = readSavedProjectPayload(key);
  if (!payload) return false;

  payload.clientName = updates.clientName?.trim() ?? payload.clientName ?? "";
  payload.description = updates.description?.trim() ?? payload.description ?? "";

  try {
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function duplicateSavedPlan(
  key: string,
  duplicateName: string,
  thumbnailOverride?: string | null,
): { id: string; key: string } | null {
  if (typeof window === "undefined") return null;

  const payload = readSavedProjectPayload(key);
  if (!payload) return null;

  const now = new Date().toISOString();
  const projectId = generateProjectId();
  const nextKey = `planner_${projectId}`;
  const nextName = duplicateName.trim();

  if (!nextName) return null;

  const duplicated: SavedPlanPayload = {
    ...payload,
    projectName: nextName,
    savedAt: now,
    thumbnail: thumbnailOverride ?? payload.thumbnail ?? null,
  };

  try {
    localStorage.setItem(nextKey, JSON.stringify(duplicated));
  } catch {
    return null;
  }

  const index = getProjectIndex();
  index.push({ id: projectId, key: nextKey, name: nextName });
  saveProjectIndex(index);

  return { id: projectId, key: nextKey };
}

export function deleteSavedPlan(key: string): boolean {
  if (typeof window === "undefined") return false;

  const index = getProjectIndex();
  const entry = index.find((item) => item.key === key);

  try {
    localStorage.removeItem(key);
    saveProjectIndex(index.filter((item) => item.key !== key));
    if (entry) {
      deleteSnapshotsFor(entry.id);
    }
    return true;
  } catch {
    return false;
  }
}

export function getSavedPlanSnapshots(): SavedPlanSnapshot[] {
  return getSavedPlans().map((plan) => ({
    id: plan.id,
    name: plan.name,
    savedAt: plan.savedAt,
    rooms: plan.rooms,
    furniture: plan.furniture,
  }));
}
