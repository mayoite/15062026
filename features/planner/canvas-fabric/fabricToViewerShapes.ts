/** @deprecated Legacy viewer shape type — kept only for test compatibility. New 3D viewer uses PlannerDocument. */
export interface PlannerViewerShape {
  id: string;
  type: "planner-wall" | "planner-room" | "planner-furniture" | "planner-zone" | "planner-door" | "planner-window";
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
  label?: string;
  color?: string;
  catalogId?: string;
  wall?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    thickness: number;
  };
}

type FabricObjectJson = {
  name?: string;
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
};

function scaledWidth(obj: FabricObjectJson) {
  return Math.max(1, (obj.width ?? 1) * (obj.scaleX ?? 1));
}

function scaledHeight(obj: FabricObjectJson) {
  return Math.max(1, (obj.height ?? 1) * (obj.scaleY ?? 1));
}

function mapFurnitureType(name: string): PlannerViewerShape["type"] {
  if (name.includes("DOOR")) return "planner-door";
  if (name.includes("WINDOW")) return "planner-window";
  if (name.includes("ROOM")) return "planner-room";
  if (name.includes("ZONE")) return "planner-zone";
  return "planner-furniture";
}

export function fabricSerializedToViewerShapes(serialized: string | null): PlannerViewerShape[] {
  if (!serialized) return [];

  try {
    const state = JSON.parse(serialized) as { objects?: FabricObjectJson[] };
    const objects = state.objects ?? [];
    const shapes: PlannerViewerShape[] = [];

    objects.forEach((obj, index) => {
      const name = String(obj.name ?? "");
      if (!name || name === "GROUP") return;

      if (name.includes("WALL") && obj.type === "line") {
        const startX = obj.x1 ?? obj.left ?? 0;
        const startY = obj.y1 ?? obj.top ?? 0;
        const endX = obj.x2 ?? startX;
        const endY = obj.y2 ?? startY;
        shapes.push({
          id: `fabric-wall-${index}`,
          type: "planner-wall",
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          rotation: 0,
          width: Math.abs(endX - startX) || 4,
          height: Math.abs(endY - startY) || 4,
          wall: {
            startX,
            startY,
            endX,
            endY,
            thickness: 4,
          },
        });
        return;
      }

      const shapeType = mapFurnitureType(name);
      const width = scaledWidth(obj);
      const height = scaledHeight(obj);
      const label = name.includes(":") ? name.split(":").slice(1).join(":") : name;

      shapes.push({
        id: `fabric-${index}-${name}`,
        type: shapeType,
        x: obj.left ?? 0,
        y: obj.top ?? 0,
        rotation: obj.angle ?? 0,
        width,
        height,
        label,
      });
    });

    return shapes;
  } catch {
    return [];
  }
}