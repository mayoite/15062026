import { describe, expect, it } from "vitest";

import {
  CATALOG_DRAG_MIME,
  LEGACY_CATALOG_DRAG_MIME,
  PlannerCatalogShapeType,
  acceptsCatalogDrag,
  isCatalogShapeType,
  isRoomCatalogShapeType,
  normalizeCatalogShapeType,
  readCatalogDragPayload,
  roomTypeFromCatalogShapeType,
} from "@/features/planner/catalog/shapeTypeRegistry";

describe("shapeTypeRegistry", () => {
  it("normalizes legacy buddy-* shape types", () => {
    expect(normalizeCatalogShapeType("buddy-desk")).toBe("planner-desk");
    expect(normalizeCatalogShapeType("planner-zone")).toBe("planner-zone");
  });

  it("detects room catalog shape types", () => {
    expect(isRoomCatalogShapeType("buddy-conference")).toBe(true);
    expect(isRoomCatalogShapeType(PlannerCatalogShapeType.desk)).toBe(false);
  });

  it("maps room type from catalog shape type", () => {
    expect(roomTypeFromCatalogShapeType("buddy-phone-booth")).toBe("meeting");
    expect(roomTypeFromCatalogShapeType("planner-conference")).toBe("conference");
  });

  it("accepts legacy and canonical drag MIME types", () => {
    const dt = {
      types: [LEGACY_CATALOG_DRAG_MIME],
      getData: (mime: string) => (mime === LEGACY_CATALOG_DRAG_MIME ? '{"id":"x"}' : ""),
    } as DataTransfer;

    expect(acceptsCatalogDrag(dt)).toBe(true);
    expect(readCatalogDragPayload(dt)).toBe('{"id":"x"}');
    expect(isCatalogShapeType("buddy-zone", PlannerCatalogShapeType.zone)).toBe(true);
    expect(CATALOG_DRAG_MIME).toBe("application/planner-catalog-item");
  });
});

