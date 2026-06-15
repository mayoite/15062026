/**
 * Measurement Tools Utilities for OOFPL Planner
 *
 * Utility functions for measuring distances, angles, and areas
 * with dimension lines and labels.
 */

import type { Editor, TLShapeId } from "@tldraw/editor";
import { Box, Vec, createShapeId } from "@tldraw/editor";
import type { PlannerWallTLShape, PlannerZoneTLShape } from "../shapes/tldrawShapeTypes";
import { toRichText } from "@tldraw/tlschema";

export type MeasurementUnit = "mm" | "cm" | "m" | "in" | "ft";
export type MeasurementType = "linear" | "angular" | "area" | "radius";

export interface MeasurementOptions {
  unit: MeasurementUnit;
  showLabels: boolean;
  showDimensionLines: boolean;
  precision: number;
  labelColor: string;
  lineColor: string;
  lineWidth: number;
}

export interface LinearMeasurement {
  startPoint: Vec;
  endPoint: Vec;
  distance: number;
  angle: number;
}

export interface AngularMeasurement {
  vertex: Vec;
  startPoint: Vec;
  endPoint: Vec;
  angle: number;
}

export interface AreaMeasurement {
  points: Vec[];
  area: number;
  perimeter: number;
}

export class MeasurementUtils {
  private options: MeasurementOptions = {
    unit: "mm",
    showLabels: true,
    showDimensionLines: true,
    precision: 1,
    labelColor: "var(--border-soft)",
    lineColor: "var(--border-soft)",
    lineWidth: 1,
  };

  constructor(private editor: Editor) {}

  // Measure linear distance between two points
  measureLinear(startPoint: Vec, endPoint: Vec): LinearMeasurement {
    const distance = startPoint.dist(endPoint);
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * (180 / Math.PI);

    return {
      startPoint,
      endPoint,
      distance,
      angle,
    };
  }

  // Create linear dimension line
  createLinearDimension(startPoint: Vec, endPoint: Vec): string {
    const measurement = this.measureLinear(startPoint, endPoint);
    const formattedDistance = this.formatDistance(measurement.distance);
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    const lengthMm = Math.max(1, Math.round(Math.hypot(dx, dy) * 10));
    const orientation = Math.abs(dy) < 1 ? "horizontal" : Math.abs(dx) < 1 ? "vertical" : "diagonal";

    const dimensionShape = {
      id: createShapeId(),
      type: "planner-measurement" as const,
      x: startPoint.x,
      y: startPoint.y,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        startX: 0,
        startY: 0,
        endX: dx,
        endY: dy,
        lengthMm,
        unit: this.options.unit,
        orientation,
        offset: 0,
        showValue: this.options.showLabels,
        showUnit: true,
        precision: this.options.precision,
        showArrows: true,
        arrowSize: 8,
        arrowStyle: "open",
        showExtensionLines: true,
        extensionLength: 10,
        referenceIds: [],
        referenceType: "custom",
        textColor: "var(--color-primary)",
        lineColor: "var(--color-accent)",
        fontSize: 12,
        color: "var(--color-accent)",
        strokeColor: "var(--color-accent)",
        strokeWidth: this.options.lineWidth,
        fillColor: "var(--color-accent)",
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.editor.createShape(dimensionShape as any);

    return formattedDistance;
  }

  // Measure angle between three points
  measureAngle(vertex: Vec, startPoint: Vec, endPoint: Vec): AngularMeasurement {
    const angle1 = Math.atan2(startPoint.y - vertex.y, startPoint.x - vertex.x);
    const angle2 = Math.atan2(endPoint.y - vertex.y, endPoint.x - vertex.x);
    let angle = Math.abs(angle2 - angle1) * (180 / Math.PI);

    // Normalize to 0-180 range
    if (angle > 180) angle = 360 - angle;

    return {
      vertex,
      startPoint,
      endPoint,
      angle,
    };
  }

  // Create angular dimension
  createAngularDimension(vertex: Vec, startPoint: Vec, endPoint: Vec): string {
    const measurement = this.measureAngle(vertex, startPoint, endPoint);
    const formattedAngle = this.formatAngle(measurement.angle);

    // Use schema-safe planner measurements for the two rays.
    this.createLinearDimension(vertex, startPoint);
    this.createLinearDimension(vertex, endPoint);

    // Add label with schema-valid text props.
    if (this.options.showLabels) {
      const labelShape = {
        id: createShapeId(),
        type: "text" as const,
        x: vertex.x + 20,
        y: vertex.y - 20,
        rotation: 0,
        opacity: 1,
        isLocked: false,
        props: {
          color: "black",
          size: "s",
          font: "draw",
          textAlign: "start",
          w: 16,
          richText: toRichText(formattedAngle),
          scale: 1,
          autoSize: true,
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.editor.createShape(labelShape as any);
    }

    return formattedAngle;
  }

  // Generate points for arc visualization
  private generateArcPoints(center: Vec, start: Vec, end: Vec, numPoints: number): Vec[] {
    const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
    const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
    const radius = Math.min(center.dist(start), center.dist(end)) * 0.3;

    const points: Vec[] = [];
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle + (endAngle - startAngle) * t;
      points.push(new Vec(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle)
      ));
    }

    return points;
  }

  // Measure area of polygon
  measureArea(points: Vec[]): AreaMeasurement {
    if (points.length < 3) {
      return { points, area: 0, perimeter: 0 };
    }

    // Shoelace formula for area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    // Calculate perimeter
    let perimeter = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      perimeter += points[i].dist(points[j]);
    }

    return { points, area, perimeter };
  }

  // Create area dimension
  createAreaDimension(points: Vec[]): string {
    const measurement = this.measureArea(points);
    const formattedArea = this.formatArea(measurement.area);

    if (points.length < 3) return formattedArea;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const zoneShape = {
      id: createShapeId(),
      type: "planner-zone" as const,
      x: minX,
      y: minY,
      rotation: 0,
      opacity: 0.35,
      isLocked: false,
      props: {
        points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
        zoneType: "focus",
        areaSqm: Math.max(0, measurement.area / 1_000_000),
        capacity: 0,
        currentOccupancy: 0,
        widthMm: Math.max(1, Math.round(maxX - minX)),
        heightMm: Math.max(1, Math.round(maxY - minY)),
        areaPerPerson: 5,
        maxCapacity: 10,
        showBoundary: true,
        showFill: true,
        showCapacity: false,
        showOccupancy: false,
        fillPattern: "solid",
        zoneColor: "var(--color-accent)",
        fillColor: "var(--color-accent-soft)",
        label: this.options.showLabels ? formattedArea : "Area",
        showLabel: this.options.showLabels,
        color: "var(--color-accent)",
        strokeColor: "var(--color-accent)",
        strokeWidth: this.options.lineWidth,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.editor.createShape(zoneShape as any);

    return formattedArea;
  }

  // Calculate centroid of polygon
  private calculateCentroid(points: Vec[]): Vec {
    let cx = 0, cy = 0;
    const area = this.measureArea(points).area;

    if (area === 0) {
      // Fallback to average of points
      for (const point of points) {
        cx += point.x;
        cy += point.y;
      }
      return new Vec(cx / points.length, cy / points.length);
    }

    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      const factor = points[i].x * points[j].y - points[j].x * points[i].y;
      cx += (points[i].x + points[j].x) * factor;
      cy += (points[i].y + points[j].y) * factor;
    }

    const area6 = area * 6;
    return new Vec(cx / area6, cy / area6);
  }

  // Measure distance between shapes
  measureDistanceBetweenShapes(shape1Id: string, shape2Id: string): number {
    const shape1 = this.editor.getShape(shape1Id as TLShapeId);
    const shape2 = this.editor.getShape(shape2Id as TLShapeId);

    if (!shape1 || !shape2) return 0;

    // Simple bounding box distance calculation
    const box1 = new Box(shape1.x, shape1.y, 100, 100); // Approximate size
    const box2 = new Box(shape2.x, shape2.y, 100, 100); // Approximate size

    const center1 = new Vec(box1.x + box1.width / 2, box1.y + box1.height / 2);
    const center2 = new Vec(box2.x + box2.width / 2, box2.y + box2.height / 2);

    return center1.dist(center2);
  }

  // Format distance based on current unit
  formatDistance(pixels: number): string {
    let value = pixels;

    switch (this.options.unit) {
      case "mm":
        value = pixels * 0.1; // Assuming 1 unit = 0.1mm
        break;
      case "cm":
        value = pixels * 0.01;
        break;
      case "m":
        value = pixels * 0.00001;
        break;
      case "in":
        value = pixels * 0.00393701;
        break;
      case "ft":
        value = pixels * 0.000328084;
        break;
    }

    return `${value.toFixed(this.options.precision)}${this.options.unit}`;
  }

  // Format angle
  formatAngle(degrees: number): string {
    return `${degrees.toFixed(this.options.precision)}deg`;
  }

  // Format area
  formatArea(pixels: number): string {
    let value = pixels;

    switch (this.options.unit) {
      case "mm":
        value = pixels * 0.01; // mm^2
        break;
      case "cm":
        value = pixels * 0.0001; // cm^2
        break;
      case "m":
        value = pixels * 0.00000001; // m^2
        break;
      case "in":
        value = pixels * 0.0000155; // in^2
        break;
      case "ft":
        value = pixels * 0.0000001076; // ft^2
        break;
    }

    return `${value.toFixed(this.options.precision)}${this.options.unit}^2`;
  }

  // Measure room dimensions from walls
  measureRoomFromWalls(wallIds: string[]): { width: string; length: string; area: string } {
    const walls = wallIds
      .map(id => this.editor.getShape(id as TLShapeId))
      .filter((w): w is PlannerWallTLShape => w !== undefined && w.type === "planner-wall");

    if (walls.length === 0) {
      return { width: "0", length: "0", area: "0" };
    }

    // Calculate bounding box of walls
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const wall of walls) {
      minX = Math.min(minX, wall.props.startX, wall.props.endX);
      minY = Math.min(minY, wall.props.startY, wall.props.endY);
      maxX = Math.max(maxX, wall.props.startX, wall.props.endX);
      maxY = Math.max(maxY, wall.props.startY, wall.props.endY);
    }

    const width = maxX - minX;
    const length = maxY - minY;
    const area = width * length;

    return {
      width: this.formatDistance(width),
      length: this.formatDistance(length),
      area: this.formatArea(area),
    };
  }

  // Set measurement options
  setOptions(options: Partial<MeasurementOptions>) {
    this.options = { ...this.options, ...options };
  }

  // Get current options
  getOptions(): MeasurementOptions {
    return { ...this.options };
  }

  // Clear all measurements
  clearMeasurements() {
    const allShapes = this.editor.getCurrentPageShapes();

    for (const shape of allShapes) {
      if (shape.type === "planner-measurement") {
        this.editor.deleteShape(shape.id);
        continue;
      }

      if (shape.type === "planner-zone") {
        const zoneShape = shape as PlannerZoneTLShape;
        const label = zoneShape.props.label ?? "";
        if (typeof label === "string" && (label.includes("^2") || label.includes("ft") || label.includes("cm") || label.includes("mm"))) {
          this.editor.deleteShape(shape.id);
        }
      }
    }
  }

  // Create measurement between two shapes
  createMeasurementBetweenShapes(shape1Id: string, shape2Id: string): string {
    const shape1 = this.editor.getShape(shape1Id as TLShapeId);
    const shape2 = this.editor.getShape(shape2Id as TLShapeId);

    if (!shape1 || !shape2) return "0";

    const center1 = new Vec(shape1.x, shape1.y);
    const center2 = new Vec(shape2.x, shape2.y);

    return this.createLinearDimension(center1, center2);
  }
}
