/**
 * Zone Overlay Utilities for OOFPL Planner
 *
 * Utility functions for creating and managing zone overlays
 * (e.g., work zones, meeting zones, circulation zones) with
 * different colors, labels, and transparency levels.
 */

import type { Editor, TLShape, TLShapeId } from "@tldraw/editor";
import { Box, Vec, createShapeId } from "@tldraw/editor";
import type { PlannerZoneTLShape } from "../shapes/tldrawShapeTypes";

export type ZoneType = "work" | "meeting" | "circulation" | "storage" | "utility" | "custom";

export interface ZoneConfig {
  type: ZoneType;
  name: string;
  color: string;
  fillColor: string;
  opacity: number;
  pattern: "solid" | "hatched" | "dotted";
}

export interface ZoneOverlay {
  id: string;
  config: ZoneConfig;
  points: Vec[];
  area: number;
  label: string;
}

export class ZoneOverlayUtils {
  // Predefined zone configurations
  private static readonly ZONE_CONFIGS: Record<ZoneType, ZoneConfig> = {
    work: {
      type: "work",
      name: "Work Zone",
      color: "var(--color-success)",
      fillColor: "var(--surface-panel)",
      opacity: 0.3,
      pattern: "solid",
    },
    meeting: {
      type: "meeting",
      name: "Meeting Zone",
      color: "var(--border-soft)",
      fillColor: "var(--surface-panel)",
      opacity: 0.3,
      pattern: "solid",
    },
    circulation: {
      type: "circulation",
      name: "Circulation Zone",
      color: "var(--color-warning)",
      fillColor: "var(--surface-panel)",
      opacity: 0.2,
      pattern: "hatched",
    },
    storage: {
      type: "storage",
      name: "Storage Zone",
      color: "var(--border-soft)",
      fillColor: "var(--surface-panel)",
      opacity: 0.4,
      pattern: "solid",
    },
    utility: {
      type: "utility",
      name: "Utility Zone",
      color: "var(--color-danger)",
      fillColor: "var(--surface-panel)",
      opacity: 0.3,
      pattern: "hatched",
    },
    custom: {
      type: "custom",
      name: "Custom Zone",
      color: "var(--border-soft)",
      fillColor: "var(--surface-panel)",
      opacity: 0.3,
      pattern: "solid",
    },
  };

  private currentZone: ZoneOverlay | null = null;
  private isDrawing = false;

  constructor(private editor: Editor) {}

  // Get all available zone configurations
  getZoneConfigs(): ZoneConfig[] {
    return Object.values(ZoneOverlayUtils.ZONE_CONFIGS);
  }

  // Get zone configuration by type
  getZoneConfig(type: ZoneType): ZoneConfig {
    return ZoneOverlayUtils.ZONE_CONFIGS[type] || ZoneOverlayUtils.ZONE_CONFIGS.custom;
  }

  // Start drawing a zone
  startZoneDrawing(type: ZoneType, startPoint: Vec, label?: string): ZoneOverlay {
    const config = this.getZoneConfig(type);

    this.currentZone = {
      id: createShapeId(),
      config,
      points: [startPoint],
      area: 0,
      label: label || config.name,
    };

    this.isDrawing = true;
    return this.currentZone;
  }

  // Add point to current zone
  addZonePoint(point: Vec): ZoneOverlay | null {
    if (!this.currentZone || !this.isDrawing) return null;

    this.currentZone.points.push(point);
    this.currentZone.area = this.calculateArea(this.currentZone.points);

    return this.currentZone;
  }

  // Complete zone drawing
  finishZoneDrawing(): ZoneOverlay | null {
    if (!this.currentZone || !this.isDrawing) return null;
    if (this.currentZone.points.length < 3) {
      this.cancelZoneDrawing();
      return null;
    }

    this.createZoneOverlay(this.currentZone);

    const result = this.currentZone;
    this.currentZone = null;
    this.isDrawing = false;

    return result;
  }

  // Cancel zone drawing
  cancelZoneDrawing() {
    this.currentZone = null;
    this.isDrawing = false;
  }

  private toPlannerZoneType(type: ZoneType): "quiet" | "collaborative" | "focus" | "social" | "custom" {
    switch (type) {
      case "work":
        return "focus";
      case "meeting":
        return "collaborative";
      case "circulation":
        return "social";
      case "storage":
      case "utility":
      case "custom":
      default:
        return "custom";
    }
  }

  private toFillPattern(pattern: ZoneConfig["pattern"]): "solid" | "hatch" | "dots" | "crosshatch" {
    switch (pattern) {
      case "hatched":
        return "hatch";
      case "dotted":
        return "dots";
      case "solid":
      default:
        return "solid";
    }
  }

  // Create zone overlay shape
  private createZoneOverlay(zone: ZoneOverlay) {
    const points = zone.points;
    if (points.length < 3) return;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    const zoneShape = {
      id: zone.id,
      type: "planner-zone" as const,
      x: minX,
      y: minY,
      rotation: 0,
      opacity: zone.config.opacity,
      isLocked: false,
      props: {
        points: points.map((p) => ({ x: p.x - minX, y: p.y - minY })),
        zoneType: this.toPlannerZoneType(zone.config.type),
        areaSqm: this.calculateArea(points) / 1_000_000,
        capacity: 0,
        currentOccupancy: 0,
        widthMm: Math.max(1, Math.round((maxX - minX) * 10)),
        heightMm: Math.max(1, Math.round((maxY - minY) * 10)),
        areaPerPerson: 5,
        maxCapacity: 10,
        showBoundary: true,
        showFill: true,
        showCapacity: false,
        showOccupancy: false,
        fillPattern: this.toFillPattern(zone.config.pattern),
        zoneColor: zone.config.color,
        fillColor: zone.config.fillColor,
        label: zone.label,
        showLabel: true,
        color: zone.config.color,
        strokeColor: zone.config.color,
        strokeWidth: 2,
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.editor.createShape(zoneShape as any);
  }

  // Calculate area of polygon
  private calculateArea(points: Vec[]): number {
    if (points.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }

    return Math.abs(area) / 2;
  }

  // Calculate centroid of polygon
  private calculateCentroid(points: Vec[]): Vec {
    let cx = 0, cy = 0;
    const area = this.calculateArea(points);

    if (area === 0) {
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

  // Create rectangular zone
  createRectangularZone(type: ZoneType, box: Box, label?: string): ZoneOverlay {
    const config = this.getZoneConfig(type);
    const points = [
      new Vec(box.x, box.y),
      new Vec(box.x + box.width, box.y),
      new Vec(box.x + box.width, box.y + box.height),
      new Vec(box.x, box.y + box.height),
    ];

    const zone: ZoneOverlay = {
      id: createShapeId(),
      config,
      points,
      area: box.width * box.height,
      label: label || config.name,
    };

    this.createZoneOverlay(zone);
    return zone;
  }

  // Create circular zone
  createCircularZone(type: ZoneType, center: Vec, radius: number, label?: string): ZoneOverlay {
    const config = this.getZoneConfig(type);
    const points: Vec[] = [];
    const numPoints = 32;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push(new Vec(
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle)
      ));
    }

    const zone: ZoneOverlay = {
      id: createShapeId(),
      config,
      points,
      area: Math.PI * radius * radius,
      label: label || config.name,
    };

    this.createZoneOverlay(zone);
    return zone;
  }

  // Get all zone overlays on canvas
  getZoneOverlays(): TLShape[] {
    const allShapes = this.editor.getCurrentPageShapes();
    return allShapes.filter((shape) => shape.type === "planner-zone");
  }

  // Get zones by type
  getZonesByType(type: ZoneType): TLShape[] {
    const allZones = this.getZoneOverlays();
    const mapped = this.toPlannerZoneType(type);
    return allZones.filter((shape) => {
      if (shape.type !== "planner-zone") return false;
      const zoneShape = shape as PlannerZoneTLShape;
      return zoneShape.props.zoneType === mapped;
    });
  }

  // Update zone properties
  updateZone(zoneId: string, updates: Partial<ZoneConfig>): void {
    const shape = this.editor.getShape(zoneId as TLShapeId);
    if (!shape || shape.type !== "planner-zone") return;

    const zoneShape = shape as PlannerZoneTLShape;
    this.editor.updateShape({
      id: zoneId as TLShapeId,
      type: "planner-zone",
      props: {
        zoneColor: updates.color ?? zoneShape.props.zoneColor,
        fillColor: updates.fillColor ?? zoneShape.props.fillColor,
        fillPattern: updates.pattern ? this.toFillPattern(updates.pattern) : zoneShape.props.fillPattern,
        color: updates.color ?? zoneShape.props.color,
        strokeColor: updates.color ?? zoneShape.props.strokeColor,
      },
      opacity: updates.opacity ?? zoneShape.opacity,
    });
  }

  // Update zone label
  updateZoneLabel(zoneId: string, newLabel: string): void {
    const shape = this.editor.getShape(zoneId as TLShapeId);
    if (!shape || shape.type !== "planner-zone") return;

    this.editor.updateShape({
      id: zoneId as TLShapeId,
      type: "planner-zone",
      props: {
        label: newLabel,
        showLabel: true,
      },
    });
  }

  // Delete zone
  deleteZone(zoneId: string): void {
    this.editor.deleteShape(zoneId as TLShapeId);
  }

  // Clear all zones
  clearAllZones(): void {
    const zones = this.getZoneOverlays();
    for (const zone of zones) {
      this.editor.deleteShape(zone.id);
    }
  }

  // Calculate total area by zone type
  calculateAreaByType(): Map<ZoneType, number> {
    const areas = new Map<ZoneType, number>();
    const zones = this.getZoneOverlays();

    for (const zone of zones) {
      if (zone.type !== "planner-zone") continue;
      const zoneShape = zone as PlannerZoneTLShape;
      const zoneType = zoneShape.props.zoneType || "custom";
      const type: ZoneType =
        zoneType === "focus"
          ? "work"
          : zoneType === "collaborative"
            ? "meeting"
            : zoneType === "social"
              ? "circulation"
              : "custom";
      const currentArea = areas.get(type) || 0;

      const points = zoneShape.props.points || [];
      let area = 0;
      if (points.length >= 3) {
        for (let i = 0; i < points.length; i++) {
          const j = (i + 1) % points.length;
          area += points[i].x * points[j].y;
          area -= points[j].x * points[i].y;
        }
        area = Math.abs(area) / 2;
      }

      areas.set(type, currentArea + area);
    }

    return areas;
  }

  // Create zone from selection
  createZoneFromSelection(type: ZoneType, label?: string): ZoneOverlay | null {
    const selectionIds = this.editor.getSelectedShapeIds();
    if (selectionIds.length === 0) return null;

    // Get bounding box of selection
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const id of selectionIds) {
      const shape = this.editor.getShape(id);
      if (shape) {
        minX = Math.min(minX, shape.x);
        minY = Math.min(minY, shape.y);
        maxX = Math.max(maxX, shape.x + 100); // Approximate width
        maxY = Math.max(maxY, shape.y + 100); // Approximate height
      }
    }

    const box = new Box(minX, minY, maxX - minX, maxY - minY);
    return this.createRectangularZone(type, box, label);
  }

  // Check if currently drawing a zone
  isCurrentlyDrawing(): boolean {
    return this.isDrawing && this.currentZone !== null;
  }

  // Get current zone being drawn
  getCurrentZone(): ZoneOverlay | null {
    return this.currentZone;
  }

  // Set zone opacity
  setZoneOpacity(zoneId: string, opacity: number): void {
    const shape = this.editor.getShape(zoneId as TLShapeId);
    if (!shape) return;

    this.editor.updateShape({
      id: zoneId as TLShapeId,
      type: shape.type,
      opacity,
    });
  }

  // Set zone color
  setZoneColor(zoneId: string, color: string, fillColor?: string): void {
    const shape = this.editor.getShape(zoneId as TLShapeId);
    if (!shape || shape.type !== "planner-zone") return;

    this.editor.updateShape({
      id: zoneId as TLShapeId,
      type: "planner-zone",
      props: {
        zoneColor: color,
        fillColor: fillColor || color,
        color,
        strokeColor: color,
      },
    });
  }
}
