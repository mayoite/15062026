/**
 * Alignment Utilities
 * 
 * Provides alignment and distribution controls for shapes in the planner.
 * This includes horizontal, vertical, and alignment operations.
 */

export interface AlignmentResult {
  aligned: boolean;
  shapes: AlignableShape[];
}

export interface DistributionResult {
  distributed: boolean;
  shapes: AlignableShape[];
}

export interface AlignableShape {
  x: number;
  y: number;
  widthMm?: number;
  heightMm?: number;
  [key: string]: unknown;
}

export class AlignmentUtils {
  /**
   * Align shapes horizontally to their left edges
   */
  static alignLeft(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const minX = Math.min(...shapes.map(s => s.x));
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      x: minX,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Align shapes horizontally to their center
   */
  static alignCenterHorizontal(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    // Calculate average center X
    const centers = shapes.map(s => s.x + (s.widthMm || 0) / 2);
    const avgCenter = centers.reduce((sum, c) => sum + c, 0) / centers.length;

    const alignedShapes = shapes.map(shape => ({
      ...shape,
      x: avgCenter - (shape.widthMm || 0) / 2,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Align shapes horizontally to their right edges
   */
  static alignRight(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const maxX = Math.max(...shapes.map(s => s.x + (s.widthMm || 0)));
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      x: maxX - (shape.widthMm || 0),
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Align shapes vertically to their top edges
   */
  static alignTop(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const minY = Math.min(...shapes.map(s => s.y));
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      y: minY,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Align shapes vertically to their center
   */
  static alignCenterVertical(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    // Calculate average center Y
    const centers = shapes.map(s => s.y + (s.heightMm || 0) / 2);
    const avgCenter = centers.reduce((sum, c) => sum + c, 0) / centers.length;

    const alignedShapes = shapes.map(shape => ({
      ...shape,
      y: avgCenter - (shape.heightMm || 0) / 2,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Align shapes vertically to their bottom edges
   */
  static alignBottom(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const maxY = Math.max(...shapes.map(s => s.y + (s.heightMm || 0)));
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      y: maxY - (shape.heightMm || 0),
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Distribute shapes horizontally with equal spacing
   */
  static distributeHorizontal(shapes: AlignableShape[]): DistributionResult {
    if (shapes.length < 3) {
      return { distributed: false, shapes };
    }

    // Sort by X position
    const sortedShapes = [...shapes].sort((a, b) => a.x - b.x);

    const firstShape = sortedShapes[0];
    const lastShape = sortedShapes[sortedShapes.length - 1];
    const totalWidth = (lastShape.x + (lastShape.widthMm || 0)) - firstShape.x;
    
    // Calculate total width of all shapes
    const shapesWidth = sortedShapes.reduce((sum, s) => sum + (s.widthMm || 0), 0);
    
    // Calculate spacing
    const spacing = (totalWidth - shapesWidth) / (sortedShapes.length - 1);
    
    // Distribute shapes
    let currentX = firstShape.x;
    const distributedShapes = sortedShapes.map(shape => {
      const newShape = { ...shape, x: currentX };
      currentX += (shape.widthMm || 0) + spacing;
      return newShape;
    });

    return { distributed: true, shapes: distributedShapes };
  }

  /**
   * Distribute shapes vertically with equal spacing
   */
  static distributeVertical(shapes: AlignableShape[]): DistributionResult {
    if (shapes.length < 3) {
      return { distributed: false, shapes };
    }

    // Sort by Y position
    const sortedShapes = [...shapes].sort((a, b) => a.y - b.y);

    const firstShape = sortedShapes[0];
    const lastShape = sortedShapes[sortedShapes.length - 1];
    const totalHeight = (lastShape.y + (lastShape.heightMm || 0)) - firstShape.y;
    
    // Calculate total height of all shapes
    const shapesHeight = sortedShapes.reduce((sum, s) => sum + (s.heightMm || 0), 0);
    
    // Calculate spacing
    const spacing = (totalHeight - shapesHeight) / (sortedShapes.length - 1);
    
    // Distribute shapes
    let currentY = firstShape.y;
    const distributedShapes = sortedShapes.map(shape => {
      const newShape = { ...shape, y: currentY };
      currentY += (shape.heightMm || 0) + spacing;
      return newShape;
    });

    return { distributed: true, shapes: distributedShapes };
  }

  /**
   * Make shapes equal width
   */
  static makeEqualWidth(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const avgWidth = shapes.reduce((sum, s) => sum + (s.widthMm || 0), 0) / shapes.length;
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      widthMm: avgWidth,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Make shapes equal height
   */
  static makeEqualHeight(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const avgHeight = shapes.reduce((sum, s) => sum + (s.heightMm || 0), 0) / shapes.length;
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      heightMm: avgHeight,
    }));

    return { aligned: true, shapes: alignedShapes };
  }

  /**
   * Make shapes equal size (both width and height)
   */
  static makeEqualSize(shapes: AlignableShape[]): AlignmentResult {
    if (shapes.length < 2) {
      return { aligned: false, shapes };
    }

    const avgWidth = shapes.reduce((sum, s) => sum + (s.widthMm || 0), 0) / shapes.length;
    const avgHeight = shapes.reduce((sum, s) => sum + (s.heightMm || 0), 0) / shapes.length;
    
    const alignedShapes = shapes.map(shape => ({
      ...shape,
      widthMm: avgWidth,
      heightMm: avgHeight,
    }));

    return { aligned: true, shapes: alignedShapes };
  }
}
