/**
 * Shape Registration and Validation System for OOFPL Planner
 *
 * Central system for registering custom shapes with tldraw, validating
 * shapes against their schemas, and managing shape lifecycle.
 */

import type { Editor, TLShape, TLShapePartial, TLShapeId } from "@tldraw/editor";
import { millimetersToCanvasUnits } from "@/features/planner/lib/calibrationScale";
import {
  getValidationErrors,
  safeValidateDoorShape,
  safeValidateFurnitureShape,
  safeValidateRoomShape,
  safeValidateWallShape,
  safeValidateWindowShape
} from "../shapes/shapeValidation";

export interface ShapeRegistration {
  type: string;
  validator: (shape: unknown) => { valid: boolean; errors: string[] };
  defaultProps: Record<string, unknown>;
  customRenderer?: (shape: TLShape, editor: Editor) => void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShapeStatistics {
  totalShapes: number;
  shapesByType: Map<string, number>;
  validShapes: number;
  invalidShapes: number;
  validationErrors: Map<string, string[]>;
}

export class ShapeRegistrationSystem {
  private normalizeForValidation(shapeLike: unknown): unknown {
    if (!shapeLike || typeof shapeLike !== "object") return shapeLike;
    if (!("props" in shapeLike)) return shapeLike;
    const withProps = shapeLike as { props?: unknown };
    if (!withProps.props || typeof withProps.props !== "object") {
      return shapeLike;
    }

    const { props, ...rest } = shapeLike as Record<string, unknown> & { props: Record<string, unknown> };
    return {
      ...rest,
      ...props,
    };
  }
  private registeredShapes: Map<string, ShapeRegistration> = new Map();
  private validationCache: Map<string, ValidationResult> = new Map();

  constructor(private editor: Editor) {
    this.initializeDefaultShapes();
  }

  // Initialize default shape registrations
  private initializeDefaultShapes() {
    // Register wall shape
    this.registerShape({
      type: "planner-wall",
      validator: (shape) => {
        const normalized = this.normalizeForValidation(shape);
        const result = safeValidateWallShape(normalized);
        return result
          ? { valid: true, errors: [] }
          : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
      },
      defaultProps: {
        thickness: millimetersToCanvasUnits(100),
        lengthMm: 1000,
        material: "drywall",
        isLoadBearing: false,
        isExterior: false,
        showDimensions: true,
      },
    });

    // Register room shape
    this.registerShape({
      type: "planner-room",
      validator: (shape) => {
        const normalized = this.normalizeForValidation(shape);
        const result = safeValidateRoomShape(normalized);
        return result
          ? { valid: true, errors: [] }
          : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
      },
      defaultProps: {
        roomType: "office",
        floorMaterial: "carpet",
        areaSqm: 0,
        showArea: true,
      },
    });

    // Register furniture shape
    this.registerShape({
      type: "planner-furniture",
      validator: (shape) => {
        const normalized = this.normalizeForValidation(shape);
        const result = safeValidateFurnitureShape(normalized);
        return result
          ? { valid: true, errors: [] }
          : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
      },
      defaultProps: {
        furnitureCategory: "workstation",
        furnitureType: "desk",
        widthMm: 1200,
        heightMm: 750,
        showLabel: true,
      },
    });

    // Register door shape
    this.registerShape({
      type: "planner-door",
      validator: (shape) => {
        const normalized = this.normalizeForValidation(shape);
        const result = safeValidateDoorShape(normalized);
        return result
          ? { valid: true, errors: [] }
          : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
      },
      defaultProps: {
        doorType: "single",
        swingDirection: "right",
        widthMm: 900,
        showSwingArc: true,
      },
    });

    // Register window shape
    this.registerShape({
      type: "planner-window",
      validator: (shape) => {
        const normalized = this.normalizeForValidation(shape);
        const result = safeValidateWindowShape(normalized);
        return result
          ? { valid: true, errors: [] }
          : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
      },
      defaultProps: {
        windowType: "single",
        widthMm: 1200,
        heightMm: 1000,
        showGlass: true,
      },
    });
  }

  // Register a custom shape
  registerShape(registration: ShapeRegistration): void {
    this.registeredShapes.set(registration.type, registration);
    this.clearValidationCache();
  }

  // Unregister a shape
  unregisterShape(type: string): void {
    this.registeredShapes.delete(type);
    this.clearValidationCache();
  }

  // Check if a shape type is registered
  isShapeRegistered(type: string): boolean {
    return this.registeredShapes.has(type);
  }

  // Get registration for a shape type
  getRegistration(type: string): ShapeRegistration | undefined {
    return this.registeredShapes.get(type);
  }

  // Get all registered shape types
  getRegisteredShapeTypes(): string[] {
    return Array.from(this.registeredShapes.keys());
  }

  // Validate a single shape
  validateShape(shape: TLShape): ValidationResult {
    const shapeType = shape.type as string;

    // Check cache first
    if (this.validationCache.has(shape.id)) {
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.validationCache.get(shape.id)!;
    }

    const registration = this.registeredShapes.get(shapeType);

    if (!registration) {
      const result: ValidationResult = {
        valid: false,
        errors: [`Shape type "${shapeType}" is not registered`],
        warnings: [],
      };
      this.validationCache.set(shape.id, result);
      return result;
    }

    // Use specific validation function based on shape type
    let validation: { valid: boolean; errors: string[] };

    switch (shapeType) {
      case "planner-wall":
        {
          const normalized = this.normalizeForValidation(shape);
          const result = safeValidateWallShape(normalized);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-room":
        {
          const normalized = this.normalizeForValidation(shape);
          const result = safeValidateRoomShape(normalized);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-furniture":
        {
          const normalized = this.normalizeForValidation(shape);
          const result = safeValidateFurnitureShape(normalized);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-door":
        {
          const normalized = this.normalizeForValidation(shape);
          const result = safeValidateDoorShape(normalized);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-window":
        {
          const normalized = this.normalizeForValidation(shape);
          const result = safeValidateWindowShape(normalized);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(normalized).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      default:
        // Use generic validation for unknown types
// eslint-disable-next-line no-case-declarations
        const errors = getValidationErrors(this.normalizeForValidation(shape));
        validation = {
          valid: errors.length === 0,
          errors: errors.map(e => `${e.field}: ${e.message}`),
        };
    }

    const result: ValidationResult = {
      valid: validation.valid,
      errors: validation.errors,
      warnings: [],
    };

    this.validationCache.set(shape.id, result);
    return result;
  }

  // Validate all shapes on the current page
  validateAllShapes(): ValidationResult {
    const allShapes = this.editor.getCurrentPageShapes();
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    let validCount = 0;
    let invalidCount = 0;

    for (const shape of allShapes) {
      const result = this.validateShape(shape);
      if (result.valid) {
// eslint-disable-next-line @typescript-eslint/no-unused-vars
        validCount++;
      } else {
        invalidCount++;
        allErrors.push(...result.errors.map(err => `Shape ${shape.id}: ${err}`));
      }
      allWarnings.push(...result.warnings);
    }

    return {
      valid: invalidCount === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // Get shape statistics
  getShapeStatistics(): ShapeStatistics {
    const allShapes = this.editor.getCurrentPageShapes();
    const shapesByType = new Map<string, number>();
    const validationErrors = new Map<string, string[]>();

    let validShapes = 0;
    let invalidShapes = 0;

    for (const shape of allShapes) {
      const type = shape.type as string;
      shapesByType.set(type, (shapesByType.get(type) || 0) + 1);

      const validation = this.validateShape(shape);
      if (validation.valid) {
        validShapes++;
      } else {
        invalidShapes++;
        validationErrors.set(shape.id, validation.errors);
      }
    }

    return {
      totalShapes: allShapes.length,
      shapesByType,
      validShapes,
      invalidShapes,
      validationErrors,
    };
  }

  // Validate shape before creation
  validateBeforeCreation(shapeData: unknown): ValidationResult {
    if (!shapeData || typeof shapeData !== "object") {
      return {
        valid: false,
        errors: ["Shape payload must be an object"],
        warnings: [],
      };
    }
    const candidate = shapeData as Record<string, unknown>;
    const shapeType = typeof candidate.type === "string" ? candidate.type : "";
    const registration = this.registeredShapes.get(shapeType);

    if (!registration) {
      return {
        valid: false,
        errors: [`Shape type "${shapeType}" is not registered`],
        warnings: [],
      };
    }

    // Merge with default props
    const normalizedInput = this.normalizeForValidation(shapeData);
    const normalizedObject =
      normalizedInput && typeof normalizedInput === "object"
        ? (normalizedInput as Record<string, unknown>)
        : {};
    const fullShape = {
      ...registration.defaultProps,
      ...normalizedObject,
    };

    // Use specific validation function based on shape type
    let validation: { valid: boolean; errors: string[] };

    switch (shapeType) {
      case "planner-wall":
        {
          const result = safeValidateWallShape(fullShape);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(fullShape).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-room":
        {
          const result = safeValidateRoomShape(fullShape);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(fullShape).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-furniture":
        {
          const result = safeValidateFurnitureShape(fullShape);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(fullShape).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-door":
        {
          const result = safeValidateDoorShape(fullShape);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(fullShape).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      case "planner-window":
        {
          const result = safeValidateWindowShape(fullShape);
          validation = result
            ? { valid: true, errors: [] }
            : { valid: false, errors: getValidationErrors(fullShape).map(e => `${e.field}: ${e.message}`) };
        }
        break;
      default:
// eslint-disable-next-line no-case-declarations
        const errors = getValidationErrors(fullShape);
        validation = {
          valid: errors.length === 0,
          errors: errors.map(e => `${e.field}: ${e.message}`),
        };
    }

    return {
      valid: validation.valid,
      errors: validation.errors,
      warnings: [],
    };
  }

  // Create shape with validation
  createValidatedShape(shapeData: TLShapePartial<TLShape>): TLShape | null {
    const validation = this.validateBeforeCreation(shapeData);

    if (!validation.valid) {
      console.error("Shape validation failed:", validation.errors);
      return null;
    }

    try {
      this.editor.createShape(shapeData);
      return shapeData as TLShape;
    } catch (error) {
      console.error("Failed to create shape:", error);
      return null;
    }
  }

  // Update shape with validation
  updateValidatedShape(shapeId: string, updates: Partial<TLShape>): boolean {
    const shape = this.editor.getShape(shapeId as TLShapeId);
    if (!shape) return false;

    const updatedShape = { ...shape, ...updates } as TLShape;
    const validation = this.validateShape(updatedShape);

    if (!validation.valid) {
      console.error("Shape validation failed:", validation.errors);
      return false;
    }

    try {
      this.editor.updateShape(updates as TLShapePartial<TLShape>);
      this.validationCache.delete(shapeId); // Clear cache for this shape
      return true;
    } catch (error) {
      console.error("Failed to update shape:", error);
      return false;
    }
  }

  // Delete shape with cleanup
  deleteShapeWithCleanup(shapeId: string): boolean {
    try {
      this.editor.deleteShape(shapeId as TLShapeId);
      this.validationCache.delete(shapeId);
      return true;
    } catch (error) {
      console.error("Failed to delete shape:", error);
      return false;
    }
  }

  // Clear validation cache
  clearValidationCache(): void {
    this.validationCache.clear();
  }

  // Fix invalid shapes automatically
  autoFixInvalidShapes(): { fixed: number; failed: number } {
    const allShapes = this.editor.getCurrentPageShapes();
    let fixed = 0;
    let failed = 0;

    for (const shape of allShapes) {
      const validation = this.validateShape(shape);

      if (!validation.valid) {
        const registration = this.registeredShapes.get(shape.type as string);

        if (registration) {
          // Try to fix by applying default props
          const fixedShape = {
            ...shape,
            ...registration.defaultProps,
          };

          try {
            this.editor.updateShape(fixedShape as TLShapePartial<TLShape>);
            this.validationCache.delete(shape.id);
            fixed++;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            failed++;
          }
        } else {
          failed++;
        }
      }
    }

    return { fixed, failed };
  }

  // Export shapes with validation
  exportValidatedShapes(): { shapes: TLShape[]; validation: ValidationResult } {
    const allShapes = this.editor.getCurrentPageShapes();
    const validation = this.validateAllShapes();

    return {
      shapes: allShapes,
      validation,
    };
  }

  // Import shapes with validation
  importValidatedShapes(shapes: unknown[]): { imported: number; failed: number; errors: string[] } {
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const shapeData of shapes) {
      const shapeObj = (shapeData && typeof shapeData === "object")
        ? (shapeData as Record<string, unknown>)
        : null;
      const shapeId = typeof shapeObj?.id === "string" ? shapeObj.id : "unknown";
      const validation = this.validateBeforeCreation(shapeData);

      if (validation.valid) {
        try {
          this.editor.createShape(shapeData as TLShapePartial<TLShape>);
          imported++;
        } catch (error) {
          failed++;
          errors.push(`Failed to create shape ${shapeId}: ${error}`);
        }
      } else {
        failed++;
        errors.push(`Invalid shape ${shapeId}: ${validation.errors.join(", ")}`);
      }
    }

    return { imported, failed, errors };
  }

  // Get shape validator from tldraw registry
// eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTldrawValidator(type: string) {
    // This would integrate with tldraw's validation system when needed
    return null;
  }

  // Run comprehensive validation
  runComprehensiveValidation(): {
    overall: ValidationResult;
    statistics: ShapeStatistics;
    registeredTypes: string[];
  } {
    const overall = this.validateAllShapes();
    const statistics = this.getShapeStatistics();
    const registeredTypes = this.getRegisteredShapeTypes();

    return {
      overall,
      statistics,
      registeredTypes,
    };
  }

  // Reset the registration system
  reset(): void {
    this.registeredShapes.clear();
    this.validationCache.clear();
    this.initializeDefaultShapes();
  }
}
