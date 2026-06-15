import { describe, expect, it } from "vitest";

import { PLANNER_CATALOG_ITEMS } from "@/features/planner/catalog/workspaceCatalog";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import {
  moduleLengthMmFromItem,
  plannerCanvasUnits,
  resolveBuddyBlock2D,
  resolveCatalogItemBlock2D,
  straightWorkstationFootprintMm,
} from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";

function item(id: string): CatalogItem {
  const found = PLANNER_CATALOG_ITEMS.find((e) => e.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

describe("catalogBlockBridge extra coverage", () => {
  it("moduleLengthMmFromItem parses name or divides width by seat count", () => {
    const partition = item("linear-workstation-partition-system-4-seater-sh-1200mm-6");
    expect(moduleLengthMmFromItem(partition)).toBe(1200);

    const noParen: CatalogItem = { ...item("booth-phone-1"), name: "Phone Booth", seatCount: 1 };
    expect(moduleLengthMmFromItem(noParen)).toBeGreaterThan(0);
  });

  it("straightWorkstationFootprintMm doubles depth for sharing benches", () => {
    const sharing = item("linear-workstation-partition-system-4-seater-sh-1200mm-6");
    const ns = item("linear-workstation-partition-system-4-seater-ns-1200mm-3");
    expect(straightWorkstationFootprintMm(sharing).D).toBe(1200);
    expect(straightWorkstationFootprintMm(ns).D).toBe(600);
  });

  it("resolveBuddyBlock2D builds block from planner furniture shape", () => {
    const booth = item("booth-phone-1");
    const block = resolveBuddyBlock2D({
      id: "shape:booth",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        catalogId: booth.id,
        widthMm: booth.widthMm,
        heightMm: booth.heightMm,
        height3dMm: booth.heightMm,
        furnitureType: "phone-booth",
        furnitureCategory: "workstation",
        color: "var(--color-primary)",
        showLabel: true,
        showDimensions: true,
        renderStyle: "outline",
        isAgainstWall: false,
        snapDistance: 0,
      },
    } as never);
    expect(block?.footprint.L).toBeGreaterThan(0);
  });

  it("resolveCatalogItemBlock2D builds generic block for room items", () => {
    const block = resolveCatalogItemBlock2D(item("room-meeting-8"));
    expect(block?.prims.length).toBeGreaterThan(5);
  });

  it("plannerCanvasUnits handles non-positive and scaled values", () => {
    expect(plannerCanvasUnits(0)).toBe(1);
    expect(plannerCanvasUnits(-5)).toBe(1);
    expect(plannerCanvasUnits(2500)).toBe(250);
  });

  it("resolveCatalogItemBlock2D builds infrastructure and zone previews", () => {
    for (const id of ["infra-display", "infra-ap", "infra-outlet", "zone-collab", "zone-focus"] as const) {
      const block = resolveCatalogItemBlock2D(item(id));
      expect(block?.prims.length).toBeGreaterThan(0);
    }
  });

  it("resolveBuddyBlock2D covers furniture kinds from props", () => {
    const baseProps = {
      widthMm: 120,
      heightMm: 60,
      height3dMm: 750,
      catalogId: "",
      productName: "Test",
      showLabel: false,
      showDimensions: false,
      renderStyle: "filled" as const,
      isAgainstWall: false,
      snapDistance: 0,
      color: "#336699",
      fillColor: "#fff",
      strokeColor: "#336699",
      strokeWidth: 1,
    };

    const kinds: Array<{ furnitureCategory: string; furnitureType: string }> = [
      { furnitureCategory: "storage", furnitureType: "cabinet" },
      { furnitureCategory: "table", furnitureType: "meeting-table" },
      { furnitureCategory: "softSeating", furnitureType: "sofa" },
      { furnitureCategory: "seating", furnitureType: "chair" },
      { furnitureCategory: "accessory", furnitureType: "printer" },
    ];

    for (const props of kinds) {
      const block = resolveBuddyBlock2D({
        id: "shape:kind",
        type: "planner-furniture",
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: { ...baseProps, ...props },
      } as never);
      expect(block?.footprint.L).toBeGreaterThan(0);
    }
  });

  it("resolveBuddyBlock2D builds l-shape workstation from catalog tag", () => {
    const lDesk = item("table-top-25mm-thick-pre-laminate-particle-board-1-seater-ns-l-1200mm-0");
    const block = resolveBuddyBlock2D({
      id: "shape:l",
      type: "planner-furniture",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        catalogId: lDesk.id,
        widthMm: lDesk.widthMm,
        heightMm: lDesk.heightMm,
        height3dMm: lDesk.heightMm,
        furnitureType: "desk-l",
        furnitureCategory: "workstation",
        color: "#336699",
        showLabel: false,
        showDimensions: false,
        renderStyle: "filled",
        isAgainstWall: false,
        snapDistance: 0,
      },
    } as never);
    expect(block?.prims.length).toBeGreaterThan(0);
  });
});