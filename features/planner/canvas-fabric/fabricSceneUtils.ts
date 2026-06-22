const FABRIC_TO_MM = 10;

export type FabricRoomMm = {
  widthMm: number;
  depthMm: number;
};

export function parseFabricObjects(serialized: string | null): Record<string, unknown>[] {
  if (!serialized) return [];
  try {
    const snapshot = JSON.parse(serialized) as { objects?: unknown[] };
    return (snapshot.objects ?? []).filter(
      (object): object is Record<string, unknown> => Boolean(object) && typeof object === "object",
    );
  } catch {
    return [];
  }
}

export function resolveRoomMmFromFabricObjects(
  objects: ReadonlyArray<Record<string, unknown>>,
  fallback: FabricRoomMm = { widthMm: 5000, depthMm: 4000 },
): FabricRoomMm {
  const structureElements = objects.filter((object) => {
    const name = String(object.name ?? "");
    return name === "CORNER" || name.startsWith("WALL:");
  });
  if (structureElements.length === 0) return fallback;

  let minLeft = Number.POSITIVE_INFINITY;
  let minTop = Number.POSITIVE_INFINITY;
  let maxRight = Number.NEGATIVE_INFINITY;
  let maxBottom = Number.NEGATIVE_INFINITY;

  structureElements.forEach((el) => {
    const left = Number(el.left) || 0;
    const top = Number(el.top) || 0;

    if (String(el.type) === "line") {
      // For lines, x1, y1, x2, y2 can represent the segment.
      // left/top in fabric for lines are usually bounding box coords.
      const width = Number(el.width) || 0;
      const height = Number(el.height) || 0;
      minLeft = Math.min(minLeft, left);
      minTop = Math.min(minTop, top);
      maxRight = Math.max(maxRight, left + width);
      maxBottom = Math.max(maxBottom, top + height);
    } else {
      const width = Number(el.width) || 0;
      const height = Number(el.height) || 0;
      minLeft = Math.min(minLeft, left);
      minTop = Math.min(minTop, top);
      maxRight = Math.max(maxRight, left + width);
      maxBottom = Math.max(maxBottom, top + height);
    }
  });

  const widthMm = Math.max(1000, Math.round((maxRight - minLeft) * FABRIC_TO_MM));
  const depthMm = Math.max(1000, Math.round((maxBottom - minTop) * FABRIC_TO_MM));
  return { widthMm, depthMm };
}

export function resolveRoomMmFromFabricSnapshot(
  serialized: string | null,
  fallback?: FabricRoomMm,
): FabricRoomMm {
  return resolveRoomMmFromFabricObjects(parseFabricObjects(serialized), fallback);
}

export function fabricObjectCategory(name: string): string {
  if (name === "CORNER" || name.startsWith("WALL:") || name.startsWith("DOOR") || name.startsWith("WINDOW")) {
    return "Structure";
  }
  if (name.startsWith("DRAW:measure")) return "Measurement";
  if (name.startsWith("DRAW:")) return "Zone";
  if (name.startsWith("GENERIC:") || name.startsWith("TABLE") || name.startsWith("CHAIR") || name.startsWith("DESK")) {
    return "Furniture";
  }
  return "Furniture";
}

export type SceneItem = {
  id: string;
  name: string;
  category: string;
  centerMm: { xMm: number; yMm: number };
  sizeMm: { widthMm: number; depthMm: number; heightMm: number };
  rotationDeg: number;
};

export function fabricObjectToSceneItem(o: Record<string, unknown>, index: number): SceneItem {
  const widthCanvas = (Number(o.width) || 60) * (Number(o.scaleX) || 1);
  const heightCanvas = (Number(o.height) || 60) * (Number(o.scaleY) || 1);
  const w = widthCanvas * FABRIC_TO_MM;
  const d = heightCanvas * FABRIC_TO_MM;
  
  const left = Number(o.left) || 0;
  const top = Number(o.top) || 0;
  const originX = String(o.originX || "left");
  const originY = String(o.originY || "top");
  const angleDeg = Number(o.angle) || 0;
  const angleRad = angleDeg * (Math.PI / 180);
  
  let localCx = 0;
  let localCy = 0;

  if (originX === "left") {
    localCx = widthCanvas / 2;
  } else if (originX === "right") {
    localCx = -widthCanvas / 2;
  }

  if (originY === "top") {
    localCy = heightCanvas / 2;
  } else if (originY === "bottom") {
    localCy = -heightCanvas / 2;
  }

  const rotatedCx = localCx * Math.cos(angleRad) - localCy * Math.sin(angleRad);
  const rotatedCy = localCx * Math.sin(angleRad) + localCy * Math.cos(angleRad);

  const cx = (left + rotatedCx) * FABRIC_TO_MM;
  const cy = (top + rotatedCy) * FABRIC_TO_MM;
  
  const name = String(o.name ?? "Item");
  const label = name.includes(":") ? name.split(":").slice(1).join(":") : name;
  return {
    id: `fabric-item-${index}`,
    name: label || name,
    category: fabricObjectCategory(name),
    centerMm: { xMm: cx, yMm: cy },
    sizeMm: { widthMm: w, depthMm: d, heightMm: 900 },
    rotationDeg: angleDeg,
  };
}
