// Geometry domain types - canvas-agnostic

/** 2D point */
export interface Point2D {
  x: number;
  y: number;
}

/** Line segment defined by two endpoints */
export interface Segment {
  start: Point2D;
  end: Point2D;
}

/** Closed polygon defined by ordered vertices */
export interface Polygon {
  vertices: Point2D[];
}

/** Axis-aligned bounding box */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
