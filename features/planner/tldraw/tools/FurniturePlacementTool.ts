/**
 * Furniture Placement Utilities for OOFPL Planner
 *
 * Utility functions for placing furniture from the catalog onto the canvas,
 * with snapping, rotation, and wall alignment features.
 */

import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";
import { Vec, createShapeId } from "@tldraw/editor";
import type { PlannerFurnitureTLShape } from "../shapes/tldrawShapeTypes";
import type { PlacementCatalogItem } from "@/features/planner/catalog/placementCatalogResolver";
import {
  getPlacementCatalogItem,
  listPlacementCatalogItems,
} from "@/features/planner/catalog/placementCatalogResolver";
import { getUnifiedCatalog } from "@/features/planner/store/unifiedCatalog";
import { DEFAULT_FURNITURE_PROPS } from "../shapes/FurnitureShape";
import { catalogMmToCanvasCm } from "@/features/planner/tldraw/shapes/shapeUtils/catalogBlockBridge";
import { catalogCategoryToFurnitureCategory } from "@/features/planner/tldraw/shapes/shapeUtils/furnitureCategoryMap";
import { snapFurnitureAtPoint } from "./furnitureWallSnap";

export interface FurniturePlacementOptions {
  snapToWalls: boolean;
  snapToGrid: boolean;
  gridSize: number;
  snapDistance: number;
  autoRotate: boolean;
  showPreview: boolean;
}

export interface PlacedFurniture {
  id: string;
  catalogId: string;
  position: Vec;
  rotation: number;
  scale: number;
  catalogItem: PlacementCatalogItem;
  isAgainstWall: boolean;
  snappedWallId: string | null;
}

export class FurniturePlacementUtils {
  private toPreviewId(id: string) {
    const baseId = id.startsWith("shape:") ? id.slice(6) : id;
    return createShapeId(`preview-${baseId}`);
  }

  private options: FurniturePlacementOptions = {
    snapToWalls: true,
    snapToGrid: true,
    gridSize: 8,
    snapDistance: 16,
    autoRotate: false,
    showPreview: true,
  };

  private currentPreview: PlacedFurniture | null = null;
  private isDragging: boolean = false;

  constructor(private editor: Editor) { }

  // Get catalog items
  getCatalog(): PlacementCatalogItem[] {
    return listPlacementCatalogItems();
  }

  // Get catalog items by category
  getCatalogByCategory(category: string): PlacementCatalogItem[] {
    const catalog = listPlacementCatalogItems();
    if (category === "All") return catalog;
    return catalog.filter((item) => item.category === category);
  }

  // Get catalog item by ID
  getCatalogItem(id: string): PlacementCatalogItem | undefined {
    return getPlacementCatalogItem(id);
  }

  // Start placing furniture from catalog
  startPlacement(catalogId: string, position: Vec): PlacedFurniture | null {
    const catalogItem = this.getCatalogItem(catalogId);
    if (!catalogItem) return null;

    let snappedPosition = position;

    // Apply snapping if enabled
    if (this.options.snapToWalls || this.options.snapToGrid) {
      snappedPosition = this.applySnapping(position, catalogItem);
    }

    const placedFurniture: PlacedFurniture = {
      id: createShapeId(),
      catalogId,
      position: snappedPosition,
      rotation: 0,
      scale: 1,
      catalogItem,
      isAgainstWall: false,
      snappedWallId: null,
    };
    this.applyWallSnapState(placedFurniture, snappedPosition);

    this.currentPreview = placedFurniture;
    this.isDragging = true;

    // Show preview if enabled
    if (this.options.showPreview) {
      this.showFurniturePreview(placedFurniture);
    }

    return placedFurniture;
  }

  // Update furniture position during drag
  updatePlacement(position: Vec): PlacedFurniture | null {
    if (!this.currentPreview || !this.isDragging) return null;

    let snappedPosition = position;

    // Apply snapping if enabled
    if (this.options.snapToWalls || this.options.snapToGrid) {
      snappedPosition = this.applySnapping(position, this.currentPreview.catalogItem);
    }

    this.applyWallSnapState(this.currentPreview, snappedPosition);

    // Update preview
    if (this.options.showPreview) {
      this.updateFurniturePreview(this.currentPreview);
    }

    return this.currentPreview;
  }

  // Complete furniture placement
  finishPlacement(): PlacedFurniture | null {
    if (!this.currentPreview || !this.isDragging) return null;

    const furnitureShape = this.createFurnitureShape(this.currentPreview);

    if (furnitureShape) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editor.createShape(furnitureShape as any);

      // Hide preview
      if (this.options.showPreview) {
        this.hideFurniturePreview();
      }
    }

    const result = this.currentPreview;
    this.currentPreview = null;
    this.isDragging = false;

    return result;
  }

  // Cancel furniture placement
  cancelPlacement() {
    if (this.options.showPreview && this.currentPreview) {
      this.hideFurniturePreview();
    }
    this.currentPreview = null;
    this.isDragging = false;
  }

  // Apply snapping to position
  private applySnapping(position: Vec, _catalogItem: PlacementCatalogItem): Vec {
    let snappedPosition = position;

    // Snap to grid if enabled
    if (this.options.snapToGrid) {
      snappedPosition = new Vec(
        Math.round(position.x / this.options.gridSize) * this.options.gridSize,
        Math.round(position.y / this.options.gridSize) * this.options.gridSize
      );
    }

    return snappedPosition;
  }

  private furnitureFootprintMm(catalogItem: PlacementCatalogItem): { widthMm: number; heightMm: number } {
    return {
      widthMm: catalogMmToCanvasCm(catalogItem.widthMm, catalogItem.depthMm),
      heightMm: catalogMmToCanvasCm(catalogItem.depthMm, catalogItem.widthMm),
    };
  }

  private applyWallSnapState(placement: PlacedFurniture, position: Vec) {
    placement.position = position;
    placement.isAgainstWall = false;
    placement.snappedWallId = null;

    if (!this.options.snapToWalls) return;

    const snap = snapFurnitureAtPoint(
      this.editor,
      { x: position.x, y: position.y },
      this.furnitureFootprintMm(placement.catalogItem),
      placement.rotation,
    );
    if (!snap) return;

    placement.position = new Vec(snap.x, snap.y);
    placement.rotation = snap.rotation;
    placement.isAgainstWall = snap.snapped;
    placement.snappedWallId = snap.wallId ?? null;
  }

  // Create furniture shape from placement data
  private createFurnitureShape(placement: PlacedFurniture) {
    const { catalogItem, position, rotation } = placement;
    const unifiedItem = getUnifiedCatalog().find((item) => item.id === catalogItem.id);
    const color = unifiedItem?.color ?? "var(--color-accent)";

    const furnitureShape = {
      id: placement.id,
      type: "planner-furniture" as const,
      x: position.x,
      y: position.y,
      rotation: rotation,
      props: {
        ...DEFAULT_FURNITURE_PROPS,
        catalogId: catalogItem.id,
        furnitureCategory: catalogCategoryToFurnitureCategory(catalogItem.category),
        furnitureType: catalogItem.shape,
        widthMm: catalogMmToCanvasCm(catalogItem.widthMm, catalogItem.depthMm),
        heightMm: catalogMmToCanvasCm(catalogItem.depthMm, catalogItem.widthMm),
        depthMm: catalogItem.depthMm ?? DEFAULT_FURNITURE_PROPS.depthMm ?? 600,
        height3dMm: catalogItem.heightMm ?? DEFAULT_FURNITURE_PROPS.height3dMm ?? 750,
        productName: catalogItem.name,
        sku: catalogItem.sku,
        imageUrl: catalogItem.iconPath ?? "",
        color,
        fillColor: "var(--surface-glass)",
        strokeColor: placement.isAgainstWall ? "var(--color-accent)" : "var(--color-primary)",
        strokeWidth: placement.isAgainstWall ? 2.5 : 2,
        snapDistance: this.options.snapToWalls ? 12 : 0,
        isAgainstWall: placement.isAgainstWall,
      },
    };

    return furnitureShape;
  }

  // Show furniture preview (creates a temporary shape)
  private showFurniturePreview(placement: PlacedFurniture) {
    const previewId = this.toPreviewId(placement.id);
    const previewShape = this.createFurnitureShape({
      ...placement,
      id: previewId,
    });

    if (previewShape) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editor.createShape(previewShape as any);
    }
  }

  // Update furniture preview
  private updateFurniturePreview(placement: PlacedFurniture) {
    const previewId = this.toPreviewId(placement.id);
    const previewShape = this.createFurnitureShape({
      ...placement,
      id: previewId,
    });

    if (previewShape) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editor.updateShape(previewShape as any);
    }
  }

  // Hide furniture preview (removes the temporary shape)
  private hideFurniturePreview() {
    if (this.currentPreview) {
      const previewId = this.toPreviewId(this.currentPreview.id);
      try {
        this.editor.deleteShape(previewId);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Shape might not exist
      }
    }
  }

  // Rotate furniture
  rotateFurniture(furnitureId: string, angle: number) {
    const shape = this.editor.getShape(furnitureId as TLShapeId);
    if (shape) {
      this.editor.updateShape({
        id: furnitureId as TLShapeId,
        type: shape.type,
        rotation: (shape.rotation || 0) + angle,
      });
    }
  }

  // Scale furniture
  scaleFurniture(furnitureId: string, scaleFactor: number) {
    const shape = this.editor.getShape(furnitureId as TLShapeId);
    if (shape && shape.type === "planner-furniture") {
      const furnitureShape = shape as PlannerFurnitureTLShape;
      this.editor.updateShape({
        id: furnitureId as TLShapeId,
        type: "planner-furniture",
        props: {
          widthMm: Math.max(1, (furnitureShape.props.widthMm ?? 1200) * scaleFactor),
          heightMm: Math.max(1, (furnitureShape.props.heightMm ?? 700) * scaleFactor),
          depthMm: Math.max(1, (furnitureShape.props.depthMm ?? 600) * scaleFactor),
        },
      });
    }
  }

  // Duplicate furniture
  duplicateFurniture(furnitureId: string, offset: Vec = new Vec(20, 20)) {
    const shape = this.editor.getShape(furnitureId as TLShapeId);
    if (shape) {
      const newShape = {
        ...shape,
        id: createShapeId(),
        x: shape.x + offset.x,
        y: shape.y + offset.y,
      };
      this.editor.createShape(newShape);
    }
  }

  // Delete furniture
  deleteFurniture(furnitureId: string) {
    this.editor.deleteShape(furnitureId as TLShapeId);
  }

  // Get all furniture shapes on canvas
  getFurnitureShapes(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter(shape => (shape.type as string) === "planner-furniture");
  }

  // Get furniture by catalog ID
  getFurnitureByCatalogId(catalogId: string): TLShape[] {
    const allFurniture = this.getFurnitureShapes();
    return allFurniture.filter(shape => {
      if (shape.type !== "planner-furniture") return false;
      const furnitureShape = shape as PlannerFurnitureTLShape;
      return furnitureShape.props.catalogId === catalogId;
    });
  }

  // Count furniture by type
  countFurnitureByType(): Map<string, number> {
    const counts = new Map<string, number>();
    const furniture = this.getFurnitureShapes();

    for (const item of furniture) {
      if (item.type !== "planner-furniture") continue;
      const furnitureShape = item as PlannerFurnitureTLShape;
      const type = furnitureShape.props.furnitureType || "unknown";
      counts.set(type, (counts.get(type) || 0) + 1);
    }

    return counts;
  }

  // Calculate total furniture cost (if catalog has pricing)
  calculateTotalCost(): number {
    // This would require pricing data in the catalog
    // For now, return 0 as placeholder
    return 0;
  }

  // Set placement options
  setOptions(options: Partial<FurniturePlacementOptions>) {
    this.options = { ...this.options, ...options };
  }

  // Get current options
  getOptions(): FurniturePlacementOptions {
    return { ...this.options };
  }

  // Check if currently placing furniture
  isCurrentlyPlacing(): boolean {
    return this.isDragging && this.currentPreview !== null;
  }

  // Get current preview
  getCurrentPreview(): PlacedFurniture | null {
    return this.currentPreview;
  }
}

