import { describe, expect, it } from "vitest";
import { mergeWorkspaceCatalogItems } from "@/features/planner/catalog/mergeCatalogItems";
import {
  managedProductRowToCatalogItem,
  millimetersToCatalogCmFields,
} from "@/features/planner/catalog/managedProductCatalogBridge";
import type { CatalogItem } from "@/features/planner/catalog/catalogTypes";
import type { PlannerManagedProductRow } from "@/features/planner/model";

function staticDesk(id: string): CatalogItem {
  return {
    id,
    name: `Static ${id}`,
    category: "desks",
    shapeType: "planner-bench",
    widthMm: 120,
    heightMm: 60,
    depthMm: 60,
    description: "static",
    tags: [],
  };
}

function managedRow(overrides: Partial<PlannerManagedProductRow> = {}): PlannerManagedProductRow {
  return {
    id: "managed-1",
    legacy_product_id: null,
    slug: "managed-desk",
    planner_source_slug: "managed-desk",
    name: "Managed desk 2400",
    description: "Admin item",
    category: "workstation",
    category_id: "workstation",
    category_name: "Workstation",
    series_id: "linear",
    series_name: "linear",
    price: 0,
    flagship_image: "",
    images: [],
    specs: { widthMm: 2400, depthMm: 600, heightMm: 750 },
    metadata: {},
    active: true,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("millimetersToCatalogCmFields", () => {
  it("converts 2400×600 mm to 240×60 catalog cm fields", () => {
    expect(millimetersToCatalogCmFields(2400, 600)).toEqual({ widthMm: 240, heightMm: 60 });
  });
});

describe("managedProductRowToCatalogItem", () => {
  it("maps active managed product with real mm footprint", () => {
    const item = managedProductRowToCatalogItem(managedRow());
    expect(item?.widthMm).toBe(240);
    expect(item?.heightMm).toBe(60);
    expect(item?.name).toBe("Managed desk 2400");
  });

  it("returns null for inactive products", () => {
    expect(managedProductRowToCatalogItem(managedRow({ active: false }))).toBeNull();
  });
});

describe("mergeWorkspaceCatalogItems", () => {
  it("managed item with same id overrides static catalog entry", () => {
    const merged = mergeWorkspaceCatalogItems(
      [staticDesk("managed-1"), staticDesk("other")],
      [managedProductRowToCatalogItem(managedRow())!],
    );
    const managed = merged.find((item) => item.id === "managed-1");
    expect(managed?.name).toBe("Managed desk 2400");
    expect(merged).toHaveLength(2);
  });
});
