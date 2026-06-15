import { resolveFurniturePrimitive } from "./furniturePrimitive";
import type { FurnitureItem } from "../data/plannerStore";

function item(overrides: Partial<FurnitureItem>): FurnitureItem {
  return {
    id: "f1",
    catalogId: "ws-linear-140",
    name: "Linear Desk 1400",
    x: 0,
    y: 0,
    width: 140,
    height: 70,
    rotation: 0,
    color: "",
    shape: "workstation-linear",
    zIndex: 0,
    ...overrides,
  };
}

describe("resolveFurniturePrimitive", () => {
  it("maps catalog shape variants to procedural primitive kinds", () => {
    expect(resolveFurniturePrimitive(item({ catalogId: "task-chair", shape: "task-chair" })).kind).toBe("seating");
    expect(resolveFurniturePrimitive(item({ catalogId: "sofa-2", shape: "sofa-2seat" })).kind).toBe("softseating");
    expect(resolveFurniturePrimitive(item({ catalogId: "filing-2", shape: "filing-cabinet" })).kind).toBe("storage");
    expect(resolveFurniturePrimitive(item({ catalogId: "partition-screen", shape: "screen-divider" })).kind).toBe("partition");
  });

  it("uses real catalog height and unified catalog color when available", () => {
    const primitive = resolveFurniturePrimitive(item({ catalogId: "task-chair", color: "" }));
    expect(primitive.heightM).toBeCloseTo(0.9);
    expect(primitive.color).toBe("var(--border-soft)");
  });
});
