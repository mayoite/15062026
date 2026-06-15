import { describe, expect, it } from "vitest";

import { CURATED_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import { LAYOUT_TEMPLATES } from "@/features/planner/templates/layoutTemplates";
import {
  applyShapes,
  buildCatalogShape,
  buildFurnitureShape,
  buildRoomShape,
  buildTemplateShapes,
  buildZoneShape,
  toPlannerViewerShapes,
} from "@/features/planner/editor/plannerShapeFactories";
import { createPlannerEditorMock, makeShape } from "./planner-editor-mockEditor";

describe("plannerShapeFactories", () => {
  it("builds room, zone, and furniture shapes", () => {
    const room = buildRoomShape(10, 20, 120, 80, "Office", "meeting");
    expect(room.type).toBe("planner-room");
    expect(room.props.label).toBe("Office");
    expect(room.props.roomType).toBe("meeting");

    const zone = buildZoneShape(0, 0, 100, 50, "Focus", "quiet");
    expect(zone.type).toBe("planner-zone");
    expect(zone.props.zoneType).toBe("quiet");
    expect(zone.props.capacity).toBeGreaterThan(0);

    const furniture = buildFurnitureShape(5, 5, {
      id: "desk-1",
      name: "Desk",
      widthMm: 1200,
      heightMm: 600,
      category: "storage",
      seatCount: 2,
    });
    expect(furniture.type).toBe("planner-furniture");
    expect(furniture.props.furnitureCategory).toBe("storage");
    expect(furniture.props.seatCount).toBe(2);
  });

  it("builds catalog shapes by shape type", () => {
    const roomItem = CURATED_CATALOG_ITEMS.find((item) => item.shapeType === "planner-room");
    const zoneItem = CURATED_CATALOG_ITEMS.find((item) => item.shapeType === "planner-zone");
    const furnitureItem = CURATED_CATALOG_ITEMS.find((item) => item.category === "desks");

    expect(buildCatalogShape(roomItem!, 0, 0).type).toBe("planner-room");
    expect(buildCatalogShape(zoneItem!, 0, 0).type).toBe("planner-zone");
    if (furnitureItem) {
      expect(buildCatalogShape(furnitureItem, 0, 0).type).toBe("planner-furniture");
    }
  });

  it("builds template shapes from layout templates", () => {
    const template = LAYOUT_TEMPLATES[0]!;
    const shapes = buildTemplateShapes(template);
    expect(shapes.length).toBeGreaterThan(template.shapes.length);
    expect(shapes[0]?.type).toBe("planner-room");
    expect(shapes.some((shape) => shape.type === "planner-zone")).toBe(true);
    expect(shapes.some((shape) => shape.type === "planner-furniture")).toBe(true);
  });

  it("converts door and window shapes into viewer footprints", () => {
    const shapes = [
      makeShape("shape:window", "planner-window", {
        widthMm: 1200,
        frameThicknessMm: 50,
      }, { x: 40, y: 10, rotation: 0 }),
      makeShape("shape:door", "planner-door", {
        widthMm: 900,
        thicknessMm: 40,
      }, { x: 20, y: 10, rotation: 0 }),
    ];
    const viewerShapes = toPlannerViewerShapes(shapes);
    expect(viewerShapes.some((shape) => shape.type === "planner-window")).toBe(true);
    expect(viewerShapes.some((shape) => shape.type === "planner-door")).toBe(true);
  });

  it("converts page shapes into viewer shapes with wall openings", () => {
    const shapes = [
      makeShape("shape:wall", "planner-wall", {
        startX: 0,
        startY: 0,
        endX: 200,
        endY: 0,
        thickness: 12,
      }, { x: 10, y: 20 }),
      makeShape("shape:door", "planner-door", {
        widthMm: 900,
        thicknessMm: 40,
      }, { x: 60, y: 20, rotation: 0 }),
      makeShape("shape:room", "planner-room", {
        label: "Office",
        widthMm: 120,
        heightMm: 80,
      }, { x: 0, y: 0 }),
      makeShape("shape:hidden", "planner-furniture", {
        productName: "Hidden",
        widthMm: 120,
        heightMm: 80,
      }, { meta: { layerHidden: true } }),
    ];

    const viewerShapes = toPlannerViewerShapes(shapes);
    expect(viewerShapes.some((shape) => shape.type === "planner-wall")).toBe(true);
    expect(viewerShapes.some((shape) => shape.type === "planner-door")).toBe(true);
    expect(viewerShapes.some((shape) => shape.type === "planner-room")).toBe(true);
    expect(viewerShapes.some((shape) => shape.id === "shape:hidden")).toBe(false);
  });

  it("applies shapes to editor and refits camera", () => {
    const editor = createPlannerEditorMock({
      shapes: [makeShape("shape:old", "planner-wall")],
    });
    const next = [buildRoomShape(0, 0, 120, 80, "New room")];
    applyShapes(editor, next);
    expect(editor.deleteShapes).toHaveBeenCalled();
    expect(editor.createShape).toHaveBeenCalled();
    expect(editor.zoomToFit).toHaveBeenCalled();
  });
});