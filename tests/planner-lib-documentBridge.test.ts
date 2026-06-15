import { createShapeId, type Editor } from "tldraw";
import { describe, expect, it, vi } from "vitest";

import {
  buildPlannerDocumentFromEditor,
  getPlannerSceneEnvelope,
  isPlannerSceneEnvelope,
  loadPlannerDocumentIntoEditor,
} from "@/features/planner/lib/documentBridge";
import { createPlannerDocument } from "@/features/planner/model";

function makeEditor(overrides: Partial<Editor> = {}) {
  const roomId = createShapeId("room-shell");
  const deskId = createShapeId("desk-1");

  const shapes = [
    {
      id: roomId,
      type: "line",
      meta: { isRoomShell: true, structureType: "room-shell", text: "Focus Room" },
      props: {
        points: {
          a1: { id: "a1", index: "a1", x: 0, y: 0 },
          a2: { id: "a2", index: "a2", x: 600, y: 0 },
          a3: { id: "a3", index: "a3", x: 600, y: 400 },
          a4: { id: "a4", index: "a4", x: 0, y: 400 },
          a5: { id: "a5", index: "a5", x: 0, y: 0 },
        },
      },
      rotation: 0,
    },
    {
      id: deskId,
      type: "geo",
      meta: {
        isPlannerItem: true,
        text: "Alpha Desk",
        category: "Desks",
        dimensions: "1600 x 800 x 750 mm",
        productId: "prod-1",
        productSlug: "alpha-desk",
        plannerSourceSlug: "alpha-desk",
        imageUrl: "/desk.png",
        price: 120000,
      },
      props: { w: 160, h: 80 },
      rotation: 0,
    },
  ];

  const boundsById: Record<string, { minX: number; minY: number; maxX: number; maxY: number; w: number; h: number }> = {
    [roomId]: { minX: 0, minY: 0, maxX: 600, maxY: 400, w: 600, h: 400 },
    [deskId]: { minX: 100, minY: 100, maxX: 260, maxY: 180, w: 160, h: 80 },
  };

  const editor = {
    getCurrentPageShapes: vi.fn(() => shapes),
    getShapePageBounds: vi.fn((shapeId: string) => boundsById[shapeId] ?? null),
    getSnapshot: vi.fn(() => ({
      store: {
        [deskId]: { id: deskId, meta: { price: 120000, text: "Alpha Desk" } },
      },
    })),
    loadSnapshot: vi.fn(),
    setCurrentTool: vi.fn(),
    zoomToFit: vi.fn(),
    ...overrides,
  } as unknown as Editor;

  return { editor, roomId, deskId };
}

describe("planner document bridge", () => {
  it("detects planner scene envelopes in raw and nested payloads", () => {
    const envelope = {
      type: "cad-suite-planner-scene",
      version: 1,
      measurement: { canonicalUnit: "mm", displayUnit: "mm" },
      room: {
        widthMm: 6000,
        depthMm: 4000,
        wallHeightMm: 2100,
        wallThicknessMm: 120,
        floorThicknessMm: 40,
        originMm: { xMm: 0, yMm: 0 },
      },
      items: [],
      tldrawSnapshot: { store: {} },
    };

    expect(isPlannerSceneEnvelope(envelope)).toBe(true);
    expect(isPlannerSceneEnvelope({ type: "other", version: 1 })).toBe(false);
    expect(getPlannerSceneEnvelope({ plannerScene: envelope })).toEqual(envelope);
    expect(getPlannerSceneEnvelope(null)).toBeNull();
  });

  it("builds planner documents from editor state and strips price metadata", () => {
    const { editor } = makeEditor();
    const document = buildPlannerDocumentFromEditor(editor, {
      documentId: "550e8400-e29b-41d4-a716-446655440010",
      name: "North Bay",
      projectName: "HQ Refresh",
      unitSystem: "mm",
      seatTarget: 8,
    });

    expect(document.name).toBe("North Bay");
    expect(document.roomWidthMm).toBe(6000);
    expect(document.roomDepthMm).toBe(4000);
    expect(document.itemCount).toBe(1);
    expect(document.unitSystem).toBe("metric");

    const scene = getPlannerSceneEnvelope(document.sceneJson);
    expect(scene?.items[0]?.name).toBe("Alpha Desk");
    expect(scene?.items[0]?.sizeMm.heightMm).toBe(750);
    expect(JSON.stringify(scene?.tldrawSnapshot)).not.toContain("price");
  });

  it("loads planner documents with embedded tldraw snapshots", () => {
    const { editor } = makeEditor();
    const snapshot = { store: { "shape:1": { id: "shape:1" } } };
    const document = createPlannerDocument({
      name: "Loaded Plan",
      sceneJson: {
        type: "cad-suite-planner-scene",
        version: 1,
        measurement: { canonicalUnit: "mm", displayUnit: "mm" },
        room: {
          widthMm: 6000,
          depthMm: 4000,
          wallHeightMm: 2100,
          wallThicknessMm: 120,
          floorThicknessMm: 40,
          originMm: { xMm: 0, yMm: 0 },
        },
        items: [],
        tldrawSnapshot: snapshot,
      },
    });

    expect(loadPlannerDocumentIntoEditor(editor, document)).toBe(true);
    expect(editor.loadSnapshot).toHaveBeenCalledWith(snapshot);
    expect(editor.setCurrentTool).toHaveBeenCalledWith("select");
    expect(editor.zoomToFit).toHaveBeenCalledWith({ animation: { duration: 200 } });
  });

  it("returns false when the document has no loadable snapshot", () => {
    const { editor } = makeEditor();
    const document = createPlannerDocument({ name: "Empty", sceneJson: { plannerScene: null } });

    expect(loadPlannerDocumentIntoEditor(editor, document)).toBe(false);
    expect(editor.loadSnapshot).not.toHaveBeenCalled();
  });

  it("infers item heights from categories and cm dimension strings", () => {
    const storageId = createShapeId("storage-1");
    const seatId = createShapeId("seat-1");
    const editor = {
      getCurrentPageShapes: vi.fn(() => [
        {
          id: storageId,
          type: "geo",
          meta: {
            isPlannerItem: true,
            text: "Cabinet",
            category: "Storage",
            dimensions: "80 x 45 x 210 cm",
            productId: "storage-1",
            productSlug: "storage-cabinet",
            plannerSourceSlug: "storage-cabinet",
            imageUrl: "/storage.png",
          },
          props: { w: 80, h: 45 },
          rotation: 0,
        },
        {
          id: seatId,
          type: "geo",
          meta: {
            isPlannerItem: true,
            text: "Lounge",
            category: "Soft Seating",
            dimensions: "90 x 90",
            productId: "seat-1",
            productSlug: "lounge-seat",
            plannerSourceSlug: "lounge-seat",
            imageUrl: "/seat.png",
          },
          props: { w: 90, h: 90 },
          rotation: 0,
        },
      ]),
      getShapePageBounds: vi.fn((shapeId: string) =>
        shapeId === storageId
          ? { minX: 0, minY: 0, maxX: 80, maxY: 45, w: 80, h: 45 }
          : { minX: 200, minY: 200, maxX: 290, maxY: 290, w: 90, h: 90 },
      ),
      getSnapshot: vi.fn(() => ({ store: {} })),
    } as unknown as Editor;

    const document = buildPlannerDocumentFromEditor(editor, {
      name: "Category Heights",
      unitSystem: "mm",
    });
    const items = getPlannerSceneEnvelope(document.sceneJson)?.items ?? [];

    expect(items.find((item) => item.name === "Cabinet")?.sizeMm.heightMm).toBe(2100);
    expect(items.find((item) => item.name === "Lounge")?.sizeMm.heightMm).toBe(900);

    const deskId = createShapeId("desk-table");
    const tableEditor = {
      getCurrentPageShapes: vi.fn(() => [
        {
          id: deskId,
          type: "geo",
          meta: {
            isPlannerItem: true,
            text: "Work Table",
            category: "Tables",
            dimensions: "2 x 1 x 0.75 m",
            productId: "table-1",
            productSlug: "work-table",
            plannerSourceSlug: "work-table",
            imageUrl: "/table.png",
          },
          props: { w: 200, h: 100 },
          rotation: 0,
        },
      ]),
      getShapePageBounds: vi.fn(() => ({ minX: 0, minY: 0, maxX: 200, maxY: 100, w: 200, h: 100 })),
      getSnapshot: vi.fn(() => ({ store: {} })),
    } as unknown as Editor;

    const tableDocument = buildPlannerDocumentFromEditor(tableEditor, {
      name: "Meter Table",
      unitSystem: "mm",
    });
    expect(
      getPlannerSceneEnvelope(tableDocument.sceneJson)?.items.find((item) => item.name === "Work Table")
        ?.sizeMm.heightMm,
    ).toBe(750);
  });

  it("falls back to default room dimensions when no structural bounds exist", () => {
    const editor = {
      getCurrentPageShapes: vi.fn(() => []),
      getShapePageBounds: vi.fn(() => null),
      getSnapshot: vi.fn(() => ({ store: {} })),
    } as unknown as Editor;

    const document = buildPlannerDocumentFromEditor(editor, {
      name: "Blank",
      unitSystem: "ft-in",
    });

    expect(document.roomWidthMm).toBe(6000);
    expect(document.roomDepthMm).toBe(8000);
    expect(document.unitSystem).toBe("imperial");
  });

  it("sanitizes nested snapshot arrays and infers desk heights without explicit dimensions", () => {
    const deskId = createShapeId("desk-only");
    const editor = {
      getCurrentPageShapes: vi.fn(() => [
        {
          id: deskId,
          type: "geo",
          meta: {
            isPlannerItem: true,
            text: "Solo Desk",
            category: "Desks",
            dimensions: "120 x 60",
            productId: "desk-2",
            productSlug: "solo-desk",
            plannerSourceSlug: "solo-desk",
            imageUrl: "/desk.png",
          },
          props: { w: 120, h: 60 },
          rotation: 0,
        },
      ]),
      getShapePageBounds: vi.fn(() => null),
      getSnapshot: vi.fn(() => [
        { id: deskId, meta: { price: 99, label: "Solo Desk" } },
      ]),
    } as unknown as Editor;

    const document = buildPlannerDocumentFromEditor(editor, { name: "Desk Only", unitSystem: "mm" });
    const item = getPlannerSceneEnvelope(document.sceneJson)?.items[0];
    expect(item?.sizeMm.heightMm).toBe(750);
    expect(item?.sizeMm.widthMm).toBe(1200);
    expect(JSON.stringify(document.sceneJson)).not.toContain("price");
  });
});