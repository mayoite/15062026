import type { PlacedItem, RoomConfig } from "../usePlannerR3FStore";

export type SnapResult = {
  snappedX: number;
  snappedZ: number;
  snappedRotation: number | null;
  snapTargetId: string | null;
  snapType: "wall" | "item" | null;
};

// Returns bounding box edges (left, right, top, bottom) in 2D top-down space
// top/bottom correspond to Z-axis (depth)
function getAABB(x: number, z: number, w: number, d: number, rot: number) {
  // Very simplified AABB. If it's rotated 90 or 270 deg (Math.PI/2), swap width and depth.
  // For other rotations, this is an approximation.
  const isRotated = Math.abs(rot % Math.PI) > 0.1 && Math.abs(rot % Math.PI) < 3.0;
  const actualW = isRotated ? d : w;
  const actualD = isRotated ? w : d;

  return {
    left: x - actualW / 2,
    right: x + actualW / 2,
    top: z - actualD / 2, // smaller Z
    bottom: z + actualD / 2, // larger Z
    width: actualW,
    depth: actualD,
  };
}

export function calculateMagneticSnap(
  dragX: number,
  dragZ: number,
  dragW: number,
  dragD: number,
  dragRot: number,
  dragId: string | null,
  items: PlacedItem[],
  room: RoomConfig,
  thresholdMm: number,
  wallRotationSnapEnabled: boolean
): SnapResult {
  let bestDist = thresholdMm / 1000; // Convert to meters since R3F uses meters
  const result: SnapResult = {
    snappedX: dragX,
    snappedZ: dragZ,
    snappedRotation: null,
    snapTargetId: null,
    snapType: null,
  };

  const roomW = room.widthMm / 1000;
  const roomD = room.depthMm / 1000;
  const dragBox = getAABB(dragX, dragZ, dragW / 1000, dragD / 1000, dragRot);

  // 1. Wall Snapping
  const walls = [
    { edge: "left", pos: 0, axis: "x", rot: Math.PI / 2 },
    { edge: "right", pos: roomW, axis: "x", rot: -Math.PI / 2 },
    { edge: "top", pos: 0, axis: "z", rot: 0 },
    { edge: "bottom", pos: roomD, axis: "z", rot: Math.PI },
  ];

  for (const wall of walls) {
    if (wall.axis === "x") {
      const distLeft = Math.abs(dragBox.left - wall.pos);
      const distRight = Math.abs(dragBox.right - wall.pos);
      if (distLeft < bestDist) {
        bestDist = distLeft;
        result.snappedX = wall.pos + dragBox.width / 2;
        result.snapType = "wall";
        if (wallRotationSnapEnabled) result.snappedRotation = wall.rot;
      } else if (distRight < bestDist) {
        bestDist = distRight;
        result.snappedX = wall.pos - dragBox.width / 2;
        result.snapType = "wall";
        if (wallRotationSnapEnabled) result.snappedRotation = wall.rot + Math.PI;
      }
    } else {
      const distTop = Math.abs(dragBox.top - wall.pos);
      const distBottom = Math.abs(dragBox.bottom - wall.pos);
      if (distTop < bestDist) {
        bestDist = distTop;
        result.snappedZ = wall.pos + dragBox.depth / 2;
        result.snapType = "wall";
        if (wallRotationSnapEnabled) result.snappedRotation = wall.rot;
      } else if (distBottom < bestDist) {
        bestDist = distBottom;
        result.snappedZ = wall.pos - dragBox.depth / 2;
        result.snapType = "wall";
        if (wallRotationSnapEnabled) result.snappedRotation = wall.rot + Math.PI;
      }
    }
  }

  // 2. Furniture Snapping (Edge-to-Edge)
  for (const item of items) {
    if (item.id === dragId) continue;

    const targetBox = getAABB(
      item.position[0],
      item.position[2],
      item.widthMm / 1000,
      item.depthMm / 1000,
      item.rotation
    );

    // Check X overlap
    const xOverlap = dragBox.right > targetBox.left && dragBox.left < targetBox.right;
    // Check Z overlap
    const zOverlap = dragBox.bottom > targetBox.top && dragBox.top < targetBox.bottom;

    if (zOverlap) {
      // Can snap horizontally
      const distRightToLeft = Math.abs(dragBox.right - targetBox.left);
      const distLeftToRight = Math.abs(dragBox.left - targetBox.right);

      if (distRightToLeft < bestDist) {
        bestDist = distRightToLeft;
        result.snappedX = targetBox.left - dragBox.width / 2;
        result.snappedZ = dragZ; // preserve Z
        result.snapTargetId = item.id;
        result.snapType = "item";
        result.snappedRotation = null;
      } else if (distLeftToRight < bestDist) {
        bestDist = distLeftToRight;
        result.snappedX = targetBox.right + dragBox.width / 2;
        result.snappedZ = dragZ; // preserve Z
        result.snapTargetId = item.id;
        result.snapType = "item";
        result.snappedRotation = null;
      }
    }

    if (xOverlap) {
      // Can snap vertically (Z-axis)
      const distBottomToTop = Math.abs(dragBox.bottom - targetBox.top);
      const distTopToBottom = Math.abs(dragBox.top - targetBox.bottom);

      if (distBottomToTop < bestDist) {
        bestDist = distBottomToTop;
        result.snappedZ = targetBox.top - dragBox.depth / 2;
        result.snappedX = dragX; // preserve X
        result.snapTargetId = item.id;
        result.snapType = "item";
        result.snappedRotation = null;
      } else if (distTopToBottom < bestDist) {
        bestDist = distTopToBottom;
        result.snappedZ = targetBox.bottom + dragBox.depth / 2;
        result.snappedX = dragX; // preserve X
        result.snapTargetId = item.id;
        result.snapType = "item";
        result.snappedRotation = null;
      }
    }
  }

  return result;
}
