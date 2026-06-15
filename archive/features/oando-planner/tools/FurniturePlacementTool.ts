// @ts-nocheck
/**
 * Furniture Placement Utilities for OOFPL Planner
 *
 * Utility functions for placing furniture from the catalog onto the canvas,
 * with snapping, rotation, and wall alignment features.
 */

import type { Editor, TLShape } from "@tldraw/editor";
import { Vec, createShapeId } from "@tldraw/editor";
import type { CatalogItem} from "../data/catalogData";
import { furnitureCatalog } from "../data/catalogData";
import { getUnifiedCatalog } from "../data/unifiedCatalog";
import { DEFAULT_FURNITURE_PROPS } from "../shapes/FurnitureShape";

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
  catalogItem: CatalogItem;
}

export class FurniturePlacementUtils {
  private toPreviewId(id: string) {
    const baseId = id.startsWith("shape:") ? id.slice(6) : id;
    return createShapeId(`preview-${baseId}`);
  }

  private getWallEndpoints(shape: TLShape): { start: Vec; end: Vec } | null {
    if (shape.type !== "planner-wall") return null;
    const wall = shape as TLShape & {
      x: number;
      y: number;
      props?: { startX?: number; startY?: number; endX?: number; endY?: number };
    };

    const start = new Vec(
      wall.x + (wall.props?.startX ?? 0),
      wall.y + (wall.props?.startY ?? 0)
    );
    const end = new Vec(
      wall.x + (wall.props?.endX ?? 0),
      wall.y + (wall.props?.endY ?? 0)
    );

    return { start, end };
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
  getCatalog(): CatalogItem[] {
    return furnitureCatalog;
  }

  // Get catalog items by category
  getCatalogByCategory(category: string): CatalogItem[] {
    if (category === "All") return furnitureCatalog;
    return furnitureCatalog.filter(item => item.category === category);
  }

  // Get catalog item by ID
  getCatalogItem(id: string): CatalogItem | undefined {
    return furnitureCatalog.find(item => item.id === id);
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
    };

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

    this.currentPreview.position = snappedPosition;

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
      this.editor.createShape(furnitureShape as unknown);

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
  private applySnapping(position: Vec, catalogItem: CatalogItem): Vec {
    let snappedPosition = position;

    // Snap to grid if enabled
    if (this.options.snapToGrid) {
      snappedPosition = new Vec(
        Math.round(position.x / this.options.gridSize) * this.options.gridSize,
        Math.round(position.y / this.options.gridSize) * this.options.gridSize
      );
    }

    // Snap to walls if enabled
    if (this.options.snapToWalls) {
      const wallSnap = this.snapToWall(snappedPosition, catalogItem);
      if (wallSnap) {
        snappedPosition = wallSnap;
      }
    }

    return snappedPosition;
  }

  // Snap position to nearest wall
  private snapToWall(position: Vec, _catalogItem: CatalogItem): Vec | null {
    const walls = this.getWallShapes();
    if (walls.length === 0) return null;

    let closestSnap: Vec | null = null;
    let closestDistance = this.options.snapDistance;

    for (const wall of walls) {
      const endpoints = this.getWallEndpoints(wall);
      if (!endpoints) continue;

      const snapPoint = this.getClosestPointOnLine(position, endpoints.start, endpoints.end);

      const distance = position.dist(snapPoint);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnap = snapPoint;
      }
    }

    return closestSnap;
  }

  // Get closest point on a line segment
  private getClosestPointOnLine(point: Vec, lineStart: Vec, lineEnd: Vec): Vec {
    const lineVec = lineEnd.clone().sub(lineStart);
    const pointVec = point.clone().sub(lineStart);

    const lineLength = lineVec.len();
    if (lineLength === 0) return lineStart;

    // Manual dot product calculation
    const dotProduct = pointVec.x * lineVec.x + pointVec.y * lineVec.y;
    const t = Math.max(0, Math.min(1, dotProduct / (lineLength * lineLength)));

    return lineStart.clone().add(lineVec.mul(t));
  }

  // Get wall shapes from canvas
  private getWallShapes(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter(shape => (shape.type as string) === "planner-wall");
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
      opacity: 1,
      isLocked: false,
      props: {
        ...DEFAULT_FURNITURE_PROPS,
        catalogId: catalogItem.id,
        productId: unifiedItem?.id || catalogItem.id,
        furnitureCategory: catalogItem.category,
        furnitureType: catalogItem.shape,
        widthMm: catalogItem.widthMm / 10,
        heightMm: catalogItem.depthMm / 10,
        depthMm: catalogItem.depthMm ?? DEFAULT_FURNITURE_PROPS.depthMm ?? 600,
        height3dMm: catalogItem.heightMm ?? DEFAULT_FURNITURE_PROPS.height3dMm ?? 750,
        productName: catalogItem.name,
        sku: catalogItem.sku,
        imageUrl: catalogItem.iconPath ?? "",
        color,
        fillColor: "var(--surface-glass)",
        strokeColor: "var(--color-primary)",
        strokeWidth: 2,
        snapDistance: this.options.snapToWalls ? 12 : 0,
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
      // Add opacity to indicate preview
      previewShape.opacity = 0.5;
      this.editor.createShape(previewShape as unknown);
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
      previewShape.opacity = 0.5;
      this.editor.updateShape(previewShape as unknown);
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
    const shape = this.editor.getShape(furnitureId as unknown);
    if (shape) {
      this.editor.updateShape({
        id: furnitureId,
        rotation: (shape.rotation || 0) + angle,
      } as unknown);
    }
  }

  // Scale furniture
  scaleFurniture(furnitureId: string, scaleFactor: number) {
    const shape = this.editor.getShape(furnitureId as unknown);
    if (shape) {
      const furnitureShape = shape as unknown;
      this.editor.updateShape({
        id: furnitureId,
        type: "planner-furniture",
        props: {
          widthMm: Math.max(1, (furnitureShape.props?.widthMm ?? 1200) * scaleFactor),
          heightMm: Math.max(1, (furnitureShape.props?.heightMm ?? 700) * scaleFactor),
          depthMm: Math.max(1, (furnitureShape.props?.depthMm ?? 600) * scaleFactor),
        },
      } as unknown);
    }
  }

  // Duplicate furniture
  duplicateFurniture(furnitureId: string, offset: Vec = new Vec(20, 20)) {
    const shape = this.editor.getShape(furnitureId as unknown);
    if (shape) {
      const newShape = {
        ...shape,
        id: createShapeId(),
        x: shape.x + offset.x,
        y: shape.y + offset.y,
      };
      this.editor.createShape(newShape as unknown);
    }
  }

  // Delete furniture
  deleteFurniture(furnitureId: string) {
    this.editor.deleteShape(furnitureId as unknown);
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
      const furnitureShape = shape as unknown;
      return furnitureShape.catalogId === catalogId;
    });
  }

  // Count furniture by type
  countFurnitureByType(): Map<string, number> {
    const counts = new Map<string, number>();
    const furniture = this.getFurnitureShapes();

    for (const item of furniture) {
      const furnitureShape = item as unknown;
      const type = furnitureShape.furnitureType || "unknown";
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
