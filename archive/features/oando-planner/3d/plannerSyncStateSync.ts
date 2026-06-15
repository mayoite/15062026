import type { Editor } from "tldraw";

import { furnitureCatalog } from "../data/catalogData";
import type { PlannerState } from "../data/plannerStore";
import {
  fromShapeId,
  mapZustandFloorMaterialToTldraw,
  mapZustandFurnitureCategoryToTldraw,
  mapZustandZoneTypeToTldraw,
  toShapeId,
} from "./plannerSyncMappings";

const SYNCED_PLANNER_SHAPE_TYPES = new Set([
  "planner-wall",
  "planner-room",
  "planner-furniture",
  "planner-door",
  "planner-window",
  "planner-measurement",
  "planner-zone",
]);

export function syncPlannerStateToEditor(editor: Editor, state: PlannerState) {
  const shapes = editor.getCurrentPageShapes();
  const tldrawIds = new Set(shapes.map((shape) => shape.id));
  const zustandIds = new Set<string>();

  state.walls.forEach((wall) => {
    zustandIds.add(wall.id);
    const shapeId = toShapeId(wall.id);
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const len = Math.hypot(dx, dy);

    const existing = editor.getShape(shapeId);
    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-wall",
        x: wall.start.x,
        y: wall.start.y,
        props: {
          endX: dx,
          endY: dy,
          lengthMm: Math.round(len * 10),
          thickness: wall.thickness,
          color: wall.color,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-wall",
      x: wall.start.x,
      y: wall.start.y,
      props: {
        startX: 0,
        startY: 0,
        endX: dx,
        endY: dy,
        lengthMm: Math.round(len * 10),
        thickness: wall.thickness,
        material: "drywall",
        color: wall.color,
        fillColor: wall.color,
        strokeColor: wall.color,
      },
    });
  });

  state.rooms.forEach((room) => {
    zustandIds.add(room.id);
    const shapeId = toShapeId(room.id);
    const xs = room.points.map((point) => point.x);
    const ys = room.points.map((point) => point.y);
    const minX = xs.length > 0 ? Math.min(...xs) : 0;
    const minY = ys.length > 0 ? Math.min(...ys) : 0;
    const maxX = xs.length > 0 ? Math.max(...xs) : 0;
    const maxY = ys.length > 0 ? Math.max(...ys) : 0;
    const relativePoints = room.points.map((point) => ({
      x: point.x - minX,
      y: point.y - minY,
    }));

    const existing = editor.getShape(shapeId);
    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-room",
        x: minX,
        y: minY,
        props: {
          points: relativePoints,
          label: room.name,
          fillColor: room.color,
          floorMaterial: mapZustandFloorMaterialToTldraw(room.floorMaterial || "default"),
          widthMm: maxX - minX,
          heightMm: maxY - minY,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-room",
      x: minX,
      y: minY,
      props: {
        points: relativePoints,
        roomType: "office",
        areaSqm: 0,
        perimeterMm: 0,
        floorMaterial: mapZustandFloorMaterialToTldraw(room.floorMaterial || "default"),
        widthMm: maxX - minX,
        heightMm: maxY - minY,
        showArea: true,
        showPerimeter: false,
        fillOpacity: 0.3,
        label: room.name,
        showLabel: true,
        color: "var(--color-primary)",
        fillColor: room.color,
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
      },
    });
  });

  state.furniture.forEach((item) => {
    zustandIds.add(item.id);
    const shapeId = toShapeId(item.id);
    const existing = editor.getShape(shapeId);
    const catalogEntry = furnitureCatalog.find((entry) => entry.id === item.catalogId);
    const sku = catalogEntry?.sku ?? "";
    const depthMm = catalogEntry?.depthMm ?? item.height;
    const height3dMm = catalogEntry?.heightMm ?? 750;
    const imageUrl = catalogEntry?.iconPath ?? "";

    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-furniture",
        x: item.x,
        y: item.y,
        rotation: (item.rotation * Math.PI) / 180,
        props: {
          widthMm: item.width,
          heightMm: item.height,
          depthMm,
          color: item.color,
          furnitureCategory: mapZustandFurnitureCategoryToTldraw(item.shape),
          catalogId: item.catalogId,
          sku,
          productName: item.name,
          imageUrl,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-furniture",
      x: item.x,
      y: item.y,
      rotation: (item.rotation * Math.PI) / 180,
      props: {
        furnitureCategory: mapZustandFurnitureCategoryToTldraw(item.shape),
        furnitureType: "desk",
        widthMm: item.width,
        heightMm: item.height,
        depthMm,
        height3dMm,
        catalogId: item.catalogId,
        sku,
        productName: item.name,
        imageUrl,
        isAgainstWall: false,
        snapDistance: 0,
        showDimensions: false,
        showLabel: true,
        renderStyle: "filled",
        color: item.color,
      },
    });
  });

  state.doors.forEach((door) => {
    zustandIds.add(door.id);
    const shapeId = toShapeId(door.id);
    const existing = editor.getShape(shapeId);
    const swingDir = door.swing === "double" ? "both" : door.swing === "left" ? "left" : "right";

    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-door",
        x: door.x,
        y: door.y,
        rotation: (door.rotation * Math.PI) / 180,
        props: {
          widthMm: door.width,
          swingDirection: swingDir,
          swingAngle: door.openAngle,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-door",
      x: door.x,
      y: door.y,
      rotation: (door.rotation * Math.PI) / 180,
      props: {
        doorType: "single",
        swingDirection: swingDir,
        swingAngle: door.openAngle,
        widthMm: door.width,
        thicknessMm: 40,
        isAttached: false,
        showSwingArc: true,
        showDoorPanel: true,
        showFrame: true,
        isActiveLeaf: "both",
        frameColor: "var(--color-primary)",
        panelColor: "var(--color-primary)",
        color: "var(--color-primary)",
      },
    });
  });

  state.windows.forEach((win) => {
    zustandIds.add(win.id);
    const shapeId = toShapeId(win.id);
    const existing = editor.getShape(shapeId);
    const windowType = win.style === "sliding" ? "sliding" : win.style === "double" ? "double" : "single";

    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-window",
        x: win.x,
        y: win.y,
        rotation: (win.rotation * Math.PI) / 180,
        props: {
          widthMm: win.width,
          windowType,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-window",
      x: win.x,
      y: win.y,
      rotation: (win.rotation * Math.PI) / 180,
      props: {
        windowType,
        widthMm: win.width,
        heightMm: 1000,
        sillHeightMm: 900,
        isAttached: false,
        hasFrame: true,
        frameThicknessMm: 40,
        hasSill: true,
        hasMullions: false,
        mullionCount: 0,
        isOperable: true,
        opensDirection: "slide",
        showGlass: true,
        showFrame: true,
        showSill: true,
        glassColor: "var(--surface-glass)",
        frameColor: "var(--color-primary)",
        color: "var(--color-primary)",
      },
    });
  });

  state.measurements.forEach((measurement) => {
    zustandIds.add(measurement.id);
    const shapeId = toShapeId(measurement.id);
    const dx = measurement.end.x - measurement.start.x;
    const dy = measurement.end.y - measurement.start.y;
    const len = Math.hypot(dx, dy);

    const existing = editor.getShape(shapeId);
    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-measurement",
        x: measurement.start.x,
        y: measurement.start.y,
        props: {
          endX: dx,
          endY: dy,
          lengthMm: Math.round(len * 10),
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-measurement",
      x: measurement.start.x,
      y: measurement.start.y,
      props: {
        startX: 0,
        startY: 0,
        endX: dx,
        endY: dy,
        lengthMm: Math.round(len * 10),
        unit: "cm",
        orientation: "diagonal",
        offset: 0,
        showValue: true,
        showUnit: true,
        precision: 0,
        showArrows: true,
        arrowSize: 8,
        arrowStyle: "open",
        showExtensionLines: true,
        extensionLength: 10,
        referenceIds: [],
        referenceType: "custom",
        textColor: "var(--color-primary)",
        lineColor: "var(--color-primary)",
        fontSize: 12,
        color: "var(--color-primary)",
      },
    });
  });

  state.zones.forEach((zone) => {
    zustandIds.add(zone.id);
    const shapeId = toShapeId(zone.id);
    const xs = zone.points.map((point) => point.x);
    const ys = zone.points.map((point) => point.y);
    const minX = xs.length > 0 ? Math.min(...xs) : 0;
    const minY = ys.length > 0 ? Math.min(...ys) : 0;
    const maxX = xs.length > 0 ? Math.max(...xs) : 0;
    const maxY = ys.length > 0 ? Math.max(...ys) : 0;
    const relativePoints = zone.points.map((point) => ({
      x: point.x - minX,
      y: point.y - minY,
    }));

    const existing = editor.getShape(shapeId);
    if (existing) {
      editor.updateShape({
        id: shapeId,
        type: "planner-zone",
        x: minX,
        y: minY,
        props: {
          points: relativePoints,
          label: zone.name,
          zoneColor: zone.color,
          zoneType: mapZustandZoneTypeToTldraw(zone.type || "Custom"),
          showFill: zone.opacity > 0,
          widthMm: maxX - minX,
          heightMm: maxY - minY,
        },
      });
      return;
    }

    editor.createShape({
      id: shapeId,
      type: "planner-zone",
      x: minX,
      y: minY,
      props: {
        points: relativePoints,
        zoneType: mapZustandZoneTypeToTldraw(zone.type || "Custom"),
        areaSqm: 0,
        capacity: 0,
        currentOccupancy: 0,
        widthMm: maxX - minX,
        heightMm: maxY - minY,
        areaPerPerson: 5,
        maxCapacity: 10,
        showBoundary: true,
        showFill: zone.opacity > 0,
        showCapacity: false,
        showOccupancy: false,
        fillPattern: "solid",
        zoneColor: zone.color,
        fillColor: zone.color,
        label: zone.name,
        showLabel: true,
        color: "var(--color-primary)",
      },
    });
  });

  shapes.forEach((shape) => {
    if (!SYNCED_PLANNER_SHAPE_TYPES.has(shape.type as string)) return;
    if (!zustandIds.has(fromShapeId(shape.id))) {
      editor.deleteShape(shape.id);
    }
  });

  if (state.selectedId) {
    const selectedTldrawId = toShapeId(state.selectedId);
    if (tldrawIds.has(selectedTldrawId) && !editor.getSelectedShapeIds().includes(selectedTldrawId)) {
      editor.select(selectedTldrawId);
    }
    return;
  }

  editor.select();
}
