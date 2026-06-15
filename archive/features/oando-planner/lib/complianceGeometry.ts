// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { DoorItem, FurnitureItem, Room, Wall } from "../data/plannerStore";

export interface RoomBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function getRoomBounds(room: Room): RoomBounds {
  const xs = room.points.map((point) => point.x);
  const ys = room.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function getFurnitureInRoom(furniture: FurnitureItem[], room: Room): FurnitureItem[] {
  const roomBounds = getRoomBounds(room);
  return furniture.filter(
    (item) =>
      item.x >= roomBounds.minX &&
      item.x <= roomBounds.maxX &&
      item.y >= roomBounds.minY &&
      item.y <= roomBounds.maxY
  );
}

export function calculateMinPathWidth(furniture: FurnitureItem[], roomBounds: RoomBounds): number {
  let minWidth = roomBounds.width;

  for (const item of furniture) {
    const itemLeft = item.x - item.width / 2;
    const itemRight = item.x + item.width / 2;
    const leftClearance = itemLeft - roomBounds.minX;
    const rightClearance = roomBounds.maxX - itemRight;
    const minClearance = Math.min(leftClearance, rightClearance);

    if (minClearance < minWidth) {
      minWidth = minClearance;
    }
  }

  return minWidth * 2;
}

export function hasAccessiblePath(
  furniture: FurnitureItem[],
  roomBounds: RoomBounds,
  requiredWidth: number
): boolean {
  return calculateMinPathWidth(furniture, roomBounds) >= requiredWidth;
}

export function furnitureOverlaps(item1: FurnitureItem, item2: FurnitureItem): boolean {
  const left1 = item1.x - item1.width / 2;
  const right1 = item1.x + item1.width / 2;
  const top1 = item1.y - item1.height / 2;
  const bottom1 = item1.y + item1.height / 2;

  const left2 = item2.x - item2.width / 2;
  const right2 = item2.x + item2.width / 2;
  const top2 = item2.y - item2.height / 2;
  const bottom2 = item2.y + item2.height / 2;

  return !(left1 >= right2 || right1 <= left2 || top1 >= bottom2 || bottom1 <= top2);
}

export function getMinDistanceToWalls(item: FurnitureItem, walls: Wall[]): number {
  let minDistance = Infinity;

  for (const wall of walls) {
    const distance = pointToLineDistance(item.x, item.y, wall.start.x, wall.start.y, wall.end.x, wall.end.y);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function pointToLineDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const a = px - x1;
  const b = py - y1;
  const c = x2 - x1;
  const d = y2 - y1;

  const dot = a * c + b * d;
  const lenSq = c * c + d * d;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number;
  let yy: number;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * c;
    yy = y1 + param * d;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy);
}
