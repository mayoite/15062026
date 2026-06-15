import type { Point, Wall } from "./plannerStore";

interface WallUpdateInstruction {
  id: string;
  updates: Partial<Wall>;
}

export function buildConnectedWallUpdates(
  walls: Wall[],
  wallId: string,
  endpoint: "start" | "end",
  newPos: Point,
  snapThreshold = 2
): { wallUpdate: Partial<Wall>; connectedUpdates: WallUpdateInstruction[] } | null {
  const wall = walls.find((item) => item.id === wallId);
  if (!wall) return null;

  const oldPos = endpoint === "start" ? wall.start : wall.end;
  const connectedUpdates: WallUpdateInstruction[] = [];

  for (const other of walls) {
    if (other.id === wallId) continue;
    if (
      Math.abs(other.start.x - oldPos.x) < snapThreshold &&
      Math.abs(other.start.y - oldPos.y) < snapThreshold
    ) {
      connectedUpdates.push({ id: other.id, updates: { start: { ...newPos } } });
    }
    if (
      Math.abs(other.end.x - oldPos.x) < snapThreshold &&
      Math.abs(other.end.y - oldPos.y) < snapThreshold
    ) {
      connectedUpdates.push({ id: other.id, updates: { end: { ...newPos } } });
    }
  }

  const wallUpdate: Partial<Wall> = endpoint === "start" ? { start: { ...newPos } } : { end: { ...newPos } };
  return { wallUpdate, connectedUpdates };
}

export function applyConnectedWallUpdates(
  walls: Wall[],
  wallId: string,
  wallUpdate: Partial<Wall>,
  connectedUpdates: WallUpdateInstruction[]
): Wall[] {
  return walls.map((wall) => {
    if (wall.id === wallId) return { ...wall, ...wallUpdate };
    const update = connectedUpdates.find((candidate) => candidate.id === wall.id);
    if (update) return { ...wall, ...update.updates };
    return wall;
  });
}

export function buildSplitWalls(
  wall: Wall,
  point: Point,
  generateId: () => string
): [Wall, Wall] {
  return [
    {
      id: generateId(),
      start: { ...wall.start },
      end: { ...point },
      thickness: wall.thickness,
      color: wall.color,
    },
    {
      id: generateId(),
      start: { ...point },
      end: { ...wall.end },
      thickness: wall.thickness,
      color: wall.color,
    },
  ];
}
