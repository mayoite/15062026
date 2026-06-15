import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import { Vec } from "@tldraw/editor";
import { FurniturePlacementUtils } from "@/features/planner/tldraw/tools/FurniturePlacementTool";
import { createMockEditor, makePlannerWallShape } from "./planner-tldraw-mockEditor";

describe("FurniturePlacementUtils", () => {
  let editor: ReturnType<typeof createMockEditor>;

  beforeEach(() => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 300, 0)],
    });
  });

  it("getCatalog returns furniture catalog items", () => {
    const utils = new FurniturePlacementUtils(editor);
    const catalog = utils.getCatalog();
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog[0].id).toBeTruthy();
  });

  it("getCatalogByCategory filters by category", () => {
    const utils = new FurniturePlacementUtils(editor);
    const desks = utils.getCatalogByCategory("desks");
    expect(desks.every((i) => i.category === "desks")).toBe(true);
    expect(utils.getCatalogByCategory("All").length).toBe(utils.getCatalog().length);
  });

  it("getCatalogItem finds item by id", () => {
    const utils = new FurniturePlacementUtils(editor);
    expect(utils.getCatalogItem("ws-linear-120")?.name).toContain("Linear Desk");
    expect(utils.getCatalogItem("missing")).toBeUndefined();
  });

  it("startPlacement creates preview and snaps to grid", () => {
    const utils = new FurniturePlacementUtils(editor);
    const placed = utils.startPlacement("ws-linear-120", new Vec(13, 17));
    expect(placed).not.toBeNull();
    expect(placed!.catalogId).toBe("ws-linear-120");
    expect(placed!.position.x % 8).toBe(0);
    expect(utils.isCurrentlyPlacing()).toBe(true);
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("startPlacement returns null for unknown catalog id", () => {
    const utils = new FurniturePlacementUtils(editor);
    expect(utils.startPlacement("unknown-id", new Vec(0, 0))).toBeNull();
  });

  it("updatePlacement moves preview position", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.startPlacement("ws-linear-120", new Vec(0, 0));
    const updated = utils.updatePlacement(new Vec(40, 40));
    expect(updated!.position.x).toBe(40);
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("finishPlacement commits furniture shape", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.startPlacement("ws-linear-120", new Vec(50, 50));
    const result = utils.finishPlacement();
    expect(result).not.toBeNull();
    expect(editor.createShape.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(utils.isCurrentlyPlacing()).toBe(false);
  });

  it("cancelPlacement clears preview", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.startPlacement("ws-linear-120", new Vec(0, 0));
    utils.cancelPlacement();
    expect(utils.isCurrentlyPlacing()).toBe(false);
    expect(editor.deleteShape).toHaveBeenCalled();
  });

  it("snaps flush to wall when near wall axis", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ snapToWalls: true, snapToGrid: false, snapDistance: 30 });
    const placed = utils.startPlacement("ws-linear-120", new Vec(100, 5));
    expect(placed!.isAgainstWall).toBe(true);
    expect(placed!.snappedWallId).toBe("w1");
    expect(placed!.position.y).toBeLessThan(5);
    expect(placed!.rotation).toBeCloseTo(0, 2);
  });

  it("rotateFurniture updates rotation", () => {
    editor._shapes.push({
      id: "f1",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { catalogId: "ws-linear-120" },
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    utils.rotateFurniture("f1", Math.PI / 2);
    expect(editor.updateShape).toHaveBeenCalledWith(
      expect.objectContaining({ rotation: Math.PI / 2 }),
    );
  });

  it("scaleFurniture scales dimensions", () => {
    editor._shapes.push({
      id: "f1",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { widthMm: 120, heightMm: 60, depthMm: 60 },
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    utils.scaleFurniture("f1", 2);
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("duplicateFurniture and deleteFurniture work", () => {
    editor._shapes.push({
      id: "f1",
      type: "planner-furniture",
      x: 10,
      y: 10,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { catalogId: "ws-linear-120", furnitureType: "desk" },
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    utils.duplicateFurniture("f1");
    utils.deleteFurniture("f1");
    expect(editor.createShape).toHaveBeenCalled();
    expect(editor.deleteShape).toHaveBeenCalledWith("f1");
  });

  it("getFurnitureShapes and countFurnitureByType aggregate canvas", () => {
    editor._shapes.push({
      id: "f1",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { catalogId: "ws-linear-120", furnitureType: "desk" },
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    expect(utils.getFurnitureShapes()).toHaveLength(1);
    expect(utils.getFurnitureByCatalogId("ws-linear-120")).toHaveLength(1);
    expect(utils.countFurnitureByType().get("desk")).toBe(1);
    expect(utils.calculateTotalCost()).toBe(0);
  });

  it("setOptions and getCurrentPreview expose state", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ showPreview: false, gridSize: 16 });
    expect(utils.getOptions().gridSize).toBe(16);
    utils.startPlacement("ws-linear-120", new Vec(0, 0));
    expect(utils.getCurrentPreview()?.catalogId).toBe("ws-linear-120");
  });

  it("finishPlacement returns null when not placing", () => {
    const utils = new FurniturePlacementUtils(editor);
    expect(utils.finishPlacement()).toBeNull();
  });

  it("rotateFurniture and scaleFurniture no-op for missing shapes", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.rotateFurniture("missing", 1);
    utils.scaleFurniture("missing", 2);
    expect(editor.updateShape).not.toHaveBeenCalled();
  });

  it("snapToWalls aligns placement near horizontal wall", () => {
    editor = createMockEditor({
      shapes: [makePlannerWallShape("w1", 0, 0, 300, 0)],
    });
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ snapToWalls: true, snapToGrid: false });
    const placed = utils.startPlacement("ws-linear-120", new Vec(120, 4));
    expect(placed).not.toBeNull();
  });

  it("snaps to vertical wall and handles zero-length wall segment", () => {
    editor = createMockEditor({
      shapes: [
        makePlannerWallShape("vertical", 100, 0, 0, 200),
        makePlannerWallShape("degenerate", 50, 50, 0, 0),
      ],
    });
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ snapToWalls: true, snapToGrid: false, snapDistance: 20 });
    const placed = utils.startPlacement("ws-linear-120", new Vec(104, 120));
    expect(placed!.isAgainstWall).toBe(true);
    expect(placed!.snappedWallId).toBe("vertical");
    expect(placed!.position.x).toBeGreaterThan(100);
    expect(placed!.rotation).toBeCloseTo(Math.PI / 2, 2);
  });

  it("updatePlacement returns null when not placing", () => {
    const utils = new FurniturePlacementUtils(editor);
    expect(utils.updatePlacement(new Vec(0, 0))).toBeNull();
  });

  it("cancelPlacement without preview still clears drag state", () => {
    const utils = new FurniturePlacementUtils(editor);
    utils.setOptions({ showPreview: false });
    utils.startPlacement("ws-linear-120", new Vec(10, 10));
    utils.cancelPlacement();
    expect(utils.isCurrentlyPlacing()).toBe(false);
  });

  it("scaleFurniture uses defaults when dimension props are missing", () => {
    editor._shapes.push({
      id: "f-bare",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {},
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    utils.scaleFurniture("f-bare", 2);
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("countFurnitureByType uses unknown for missing furnitureType", () => {
    editor._shapes.push({
      id: "f-unknown",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: { catalogId: "ws-linear-120" },
    } as never);

    const utils = new FurniturePlacementUtils(editor);
    expect(utils.countFurnitureByType().get("unknown")).toBe(1);
  });
});