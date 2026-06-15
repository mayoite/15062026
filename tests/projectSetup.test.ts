import { describe, expect, it } from "vitest";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import {
  filterCatalogItemsByPurpose,
  metadataToDocumentFields,
  resolveGridMmPerUnit,
} from "@/features/planner/onboarding/projectSetup";

describe("project setup helpers", () => {
  it("uses 1 m grid units for floors larger than 5000 sq ft", () => {
    expect(resolveGridMmPerUnit(5001)).toBe(1000);
    expect(resolveGridMmPerUnit(12000)).toBe(1000);
  });

  it("uses 0.5 m grid units for smaller floors", () => {
    expect(resolveGridMmPerUnit(5000)).toBe(500);
    expect(resolveGridMmPerUnit(1000)).toBe(500);
  });

  it("maps metadata into planner document fields", () => {
    const fields = metadataToDocumentFields({
      projectName: "TVS Bihar Office — 2nd Floor",
      city: "Patna",
      floorAreaSqFt: 1000,
      primaryPurpose: "workstations",
      seatTarget: 50,
      completedAt: "2026-06-14T00:00:00.000Z",
    });

    expect(fields.projectName).toBe("TVS Bihar Office — 2nd Floor");
    expect(fields.seatTarget).toBe(50);
    expect(fields.clientName).toBe("Patna");
    expect(fields.roomWidthMm).toBeGreaterThan(0);
    expect(fields.roomDepthMm).toBeGreaterThan(0);
  });

  it("filters catalog items for meeting-room purpose", () => {
    const filtered = filterCatalogItemsByPurpose(PLANNER_CATALOG_ITEMS, "meeting-rooms");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(PLANNER_CATALOG_ITEMS.length);
    expect(filtered.some((item) => item.category === "rooms")).toBe(true);
  });
});