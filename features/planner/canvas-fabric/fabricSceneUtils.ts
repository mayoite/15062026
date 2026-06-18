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
  const corners = objects.filter((object) => String(object.name ?? "") === "CORNER");
  if (corners.length < 2) return fallback;

  let minLeft = Number.POSITIVE_INFINITY;
  let minTop = Number.POSITIVE_INFINITY;
  let maxRight = Number.NEGATIVE_INFINITY;
  let maxBottom = Number.NEGATIVE_INFINITY;

  corners.forEach((corner) => {
    const left = Number(corner.left) || 0;
    const top = Number(corner.top) || 0;
    const width = Number(corner.width) || 0;
    const height = Number(corner.height) || 0;
    minLeft = Math.min(minLeft, left);
    minTop = Math.min(minTop, top);
    maxRight = Math.max(maxRight, left + width);
    maxBottom = Math.max(maxBottom, top + height);
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
