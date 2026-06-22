import { describe, expect, it, vi } from "vitest";

import {
  CATALOG_DRAG_MIME,
  LEGACY_CATALOG_DRAG_MIME,
  PlannerCatalogShapeType,
  acceptsCatalogDrag,
  catalogDragMimeTypes,
  catalogShapeTypeToFurnitureType,
  isCatalogShapeType,
  isRoomCatalogShapeType,
  normalizeCatalogShapeType,
  readCatalogDragPayload,
  roomTypeFromCatalogShapeType,
  writeCatalogDragPayload,
} from "@/features/planner/catalog/shapeTypeRegistry";

describe("planner/catalog/shapeTypeRegistry", () => {
  it("normalizes legacy buddy-* shape types", () => {
    expect(normalizeCatalogShapeType("buddy-desk")).toBe("planner-desk");
    expect(normalizeCatalogShapeType("planner-zone")).toBe("planner-zone");
    expect(catalogShapeTypeToFurnitureType("buddy-bench")).toBe("bench");
  });

  it("detects room catalog shape types", () => {
    expect(isRoomCatalogShapeType("buddy-conference")).toBe(true);
    expect(isRoomCatalogShapeType(PlannerCatalogShapeType.phoneBooth)).toBe(true);
    expect(isRoomCatalogShapeType(PlannerCatalogShapeType.desk)).toBe(false);
  });

  it("maps room type from catalog shape type", () => {
    expect(roomTypeFromCatalogShapeType("buddy-phone-booth")).toBe("meeting");
    expect(roomTypeFromCatalogShapeType("planner-conference")).toBe("conference");
    expect(roomTypeFromCatalogShapeType("planner-room")).toBe("office");
  });

  it("reads and writes catalog drag payloads", () => {
    const dt = {
      types: [LEGACY_CATALOG_DRAG_MIME],
      getData: (mime: string) => (mime === LEGACY_CATALOG_DRAG_MIME ? '{"id":"x"}' : ""),
      setData: vi.fn(),
    } as unknown as DataTransfer;

    expect(acceptsCatalogDrag(dt)).toBe(true);
    expect(readCatalogDragPayload(dt)).toBe('{"id":"x"}');
    expect(isCatalogShapeType("buddy-zone", PlannerCatalogShapeType.zone)).toBe(true);
    expect(catalogDragMimeTypes()).toEqual([CATALOG_DRAG_MIME, LEGACY_CATALOG_DRAG_MIME]);
    expect(CATALOG_DRAG_MIME).toBe("application/planner-catalog-item");

    writeCatalogDragPayload(dt, '{"id":"y"}');
    expect(dt.setData).toHaveBeenCalledWith(CATALOG_DRAG_MIME, '{"id":"y"}');

    const canonicalOnly = {
      types: [CATALOG_DRAG_MIME],
      getData: (mime: string) => (mime === CATALOG_DRAG_MIME ? '{"id":"canonical"}' : ""),
    } as DataTransfer;
    expect(readCatalogDragPayload(canonicalOnly)).toBe('{"id":"canonical"}');
    expect(readCatalogDragPayload({ types: [], getData: () => "" } as DataTransfer)).toBeNull();
  });
});
