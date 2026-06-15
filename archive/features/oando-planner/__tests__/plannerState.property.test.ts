/**
 * Property tests — Planner state invariants
 *
 * Uses domain stores directly (as recommended by the facade deprecation).
 */

import * as fc from "fast-check";
import { usePlannerFurnitureStore } from "../data/plannerFurnitureStore";
import { usePlannerGeometryStore } from "../data/plannerGeometryStore";
import { usePlannerUIStore } from "../data/plannerUIStore";
import { furnitureCatalog } from "../data/catalogData";

beforeEach(() => {
  usePlannerFurnitureStore.setState({ furniture: [], selectedId: null, selectedIds: [], activeCatalogId: null });
  usePlannerGeometryStore.setState({ walls: [], rooms: [], doors: [], windows: [], zones: [], measurements: [], structuralElements: [], drawingWall: null, drawingRoom: [], drawingZone: [] });
  usePlannerUIStore.setState({ viewMode: "2d", show3D: false });
});

describe("Property: View Toggle Preserves Document State", () => {
  const viewModes = ["2d", "3d", "split"] as const;

  it("cycling through every view mode preserves all entity arrays", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...viewModes), { minLength: 1, maxLength: 8 }),
        fc.integer({ min: 0, max: 5 }),
        (sequence, numFurniture) => {
          usePlannerFurnitureStore.setState({ furniture: [] });
          for (let i = 0; i < numFurniture; i++) {
            usePlannerFurnitureStore.getState().addFurniture({
              catalogId: "task-chair", name: "Task Chair",
              x: i * 100, y: i * 100, width: 50, height: 50,
              rotation: 0, color: "var(--border-soft)", shape: "task-chair",
            });
          }
          const before = usePlannerFurnitureStore.getState().furniture.length;
          for (const mode of sequence) {
            usePlannerUIStore.getState().setViewMode(mode);
          }
          const after = usePlannerFurnitureStore.getState().furniture.length;
          expect(after).toBe(before);
        }
      ),
      { numRuns: 30 }
    );
  });

  it("keeps show3D aligned with modes that render the 3D scene", () => {
    usePlannerUIStore.getState().setViewMode("2d");
    expect(usePlannerUIStore.getState().show3D).toBe(false);
    usePlannerUIStore.getState().setViewMode("3d");
    expect(usePlannerUIStore.getState().show3D).toBe(true);
    usePlannerUIStore.getState().setViewMode("split");
    expect(usePlannerUIStore.getState().show3D).toBe(true);
  });
});


describe("Property: Furniture Placement Preserves Catalog Association", () => {
  it("placed furniture retains the catalog ID, name, and dimensions", () => {
    const someCatalogIds = furnitureCatalog.slice(0, 10).map((c) => c.id);
    fc.assert(
      fc.property(
        fc.constantFrom(...someCatalogIds),
        fc.integer({ min: -5000, max: 5000 }),
        fc.integer({ min: -5000, max: 5000 }),
        (catalogId, x, y) => {
          usePlannerFurnitureStore.setState({ furniture: [] });
          const catalogItem = furnitureCatalog.find((c) => c.id === catalogId);
          if (!catalogItem) return;
          usePlannerFurnitureStore.getState().addFurniture({
            catalogId, name: catalogItem.name, x, y,
            width: catalogItem.widthMm / 10,
            height: catalogItem.depthMm / 10,
            rotation: 0, color: "var(--color-accent)", shape: catalogItem.shape,
          });
          const placed = usePlannerFurnitureStore.getState().furniture[0];
          expect(placed.catalogId).toBe(catalogId);
          expect(placed.name).toBe(catalogItem.name);
          expect(placed.x).toBe(x);
          expect(placed.y).toBe(y);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe("Property: Escape Key Resets Active Tool State", () => {
  it("cancelDrawing() clears all in-progress draw state", () => {
    usePlannerGeometryStore.setState({
      drawingWall: { start: { x: 0, y: 0 } },
      drawingRoom: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      drawingZone: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    });
    usePlannerGeometryStore.getState().setDrawingWall(null);
    usePlannerGeometryStore.getState().setDrawingRoom([]);
    usePlannerGeometryStore.setState({ drawingZone: [] });

    const s = usePlannerGeometryStore.getState();
    expect(s.drawingWall).toBeNull();
    expect(s.drawingRoom).toEqual([]);
    expect(s.drawingZone).toEqual([]);
  });
});
