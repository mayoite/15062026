import type { ProjectIndexEntry } from "./plannerTypes";
export type { ProjectIndexEntry };

export function getProjectIndex(): ProjectIndexEntry[] {
  try {
    const raw = localStorage.getItem("planner_project_index");
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export function saveProjectIndex(index: ProjectIndexEntry[]): void {
  try {
    localStorage.setItem("planner_project_index", JSON.stringify(index));
  } catch {
    // ignore
  }
}

export function migrateOldProjects(params: {
  generateId: () => string;
  persist: (key: string, value: string) => boolean;
}) {
  try {
    const oldKeys = JSON.parse(localStorage.getItem("planner_projects") || "[]") as string[];
    if (oldKeys.length === 0) return;

    const index = getProjectIndex();

    for (const oldKey of oldKeys) {
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;

      const alreadyMigrated = index.some((entry) => entry.id === oldKey);
      if (alreadyMigrated) continue;

      const data = JSON.parse(raw);
      const projectId = params.generateId();

      if (params.persist(`planner-project-${projectId}`, raw)) {
        index.push({ id: projectId, name: data.projectName || oldKey });
        localStorage.removeItem(oldKey);
      }
    }

    saveProjectIndex(index);
    localStorage.removeItem("planner_projects");
  } catch {
    // ignore
  }
}

export function validateImportedProject(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["File does not contain a valid JSON object"] };
  }
  const d = data as Record<string, unknown>;

  if (!Array.isArray(d.walls) && !Array.isArray(d.rooms) && !Array.isArray(d.furniture)) {
    errors.push("Missing required arrays: needs at least walls, rooms, or furniture");
  }

  if (d.walls !== undefined) {
    if (!Array.isArray(d.walls)) {
      errors.push("'walls' must be an array");
    } else {
      for (let i = 0; i < d.walls.length; i++) {
        const wall = d.walls[i] as Record<string, unknown>;
        if (!wall || typeof wall !== "object") {
          errors.push(`walls[${i}] is not an object`);
          continue;
        }
        if (!wall.start || typeof wall.start !== "object") errors.push(`walls[${i}].start is missing or invalid`);
        if (!wall.end || typeof wall.end !== "object") errors.push(`walls[${i}].end is missing or invalid`);
      }
    }
  }

  if (d.rooms !== undefined) {
    if (!Array.isArray(d.rooms)) {
      errors.push("'rooms' must be an array");
    } else {
      for (let i = 0; i < d.rooms.length; i++) {
        const room = d.rooms[i] as Record<string, unknown>;
        if (!room || typeof room !== "object") {
          errors.push(`rooms[${i}] is not an object`);
          continue;
        }
        if (!Array.isArray(room.points)) errors.push(`rooms[${i}].points is missing or not an array`);
      }
    }
  }

  if (d.furniture !== undefined) {
    if (!Array.isArray(d.furniture)) {
      errors.push("'furniture' must be an array");
    } else {
      for (let i = 0; i < d.furniture.length; i++) {
        const item = d.furniture[i] as Record<string, unknown>;
        if (!item || typeof item !== "object") {
          errors.push(`furniture[${i}] is not an object`);
          continue;
        }
        if (typeof item.x !== "number" || typeof item.y !== "number") {
          errors.push(`furniture[${i}] missing x/y coordinates`);
        }
      }
    }
  }

  if (d.doors !== undefined && !Array.isArray(d.doors)) errors.push("'doors' must be an array");
  if (d.windows !== undefined && !Array.isArray(d.windows)) errors.push("'windows' must be an array");

  return { valid: errors.length === 0, errors };
}
