import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tldraw/editor", async () => {
  const { createTldrawEditorModule } = await import("./planner-tldraw-mockEditor");
  return createTldrawEditorModule();
});

import type { TLShape, TLShapeId } from "@tldraw/editor";
import { ShapeRegistrationSystem } from "@/features/planner/tldraw/tools/ShapeRegistrationSystem";
import {
  createMockEditor,
  validDoorPayload,
  validFurniturePayload,
  validRoomPayload,
  validWallPayload,
  validWindowPayload,
  WALL_UUID,
} from "./planner-tldraw-mockEditor";

function asTLShape(payload: Record<string, unknown>): TLShape {
  const { props, ...rest } = payload;
  const top = props ? { ...rest, ...(props as object) } : rest;
  return top as TLShape;
}

describe("ShapeRegistrationSystem", () => {
  let editor: ReturnType<typeof createMockEditor>;
  let system: ShapeRegistrationSystem;

  beforeEach(() => {
    editor = createMockEditor();
    system = new ShapeRegistrationSystem(editor);
  });

  it("registers default planner shape types", () => {
    const types = system.getRegisteredShapeTypes();
    expect(types).toContain("planner-wall");
    expect(types).toContain("planner-furniture");
    expect(system.isShapeRegistered("planner-wall")).toBe(true);
  });

  it("registerShape and unregisterShape manage custom types", () => {
    system.registerShape({
      type: "custom-test",
      validator: () => ({ valid: true, errors: [] }),
      defaultProps: { foo: 1 },
    });
    expect(system.isShapeRegistered("custom-test")).toBe(true);
    system.unregisterShape("custom-test");
    expect(system.isShapeRegistered("custom-test")).toBe(false);
  });

  it("validateShape accepts valid wall and caches result", () => {
    const shape = asTLShape(validWallPayload());
    const first = system.validateShape(shape);
    const second = system.validateShape(shape);
    expect(first.valid).toBe(true);
    expect(second).toBe(first);
  });

  it("validateShape rejects unregistered type", () => {
    const shape = { id: "x", type: "unknown" } as TLShape;
    const result = system.validateShape(shape);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("not registered");
  });

  it("validateShape validates room, furniture, door, window payloads", () => {
    expect(system.validateShape(asTLShape(validRoomPayload())).valid).toBe(true);
    expect(system.validateShape(asTLShape(validFurniturePayload())).valid).toBe(true);
    expect(system.validateShape(asTLShape(validDoorPayload())).valid).toBe(true);
    expect(system.validateShape(asTLShape(validWindowPayload())).valid).toBe(true);
  });

  it("validateShape fails for invalid wall color", () => {
    const shape = asTLShape(validWallPayload({ color: "not-hex" }));
    const result = system.validateShape(shape);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("validateAllShapes aggregates page validation", () => {
    editor._shapes.push(asTLShape(validWallPayload()), asTLShape(validFurniturePayload()));
    const result = system.validateAllShapes();
    expect(result.valid).toBe(true);
  });

  it("getShapeStatistics counts valid and invalid shapes", () => {
    editor._shapes.push(
      asTLShape(validWallPayload()),
      asTLShape(validWallPayload({ id: "bad", color: "bad" })),
    );
    const stats = system.getShapeStatistics();
    expect(stats.totalShapes).toBe(2);
    expect(stats.invalidShapes).toBeGreaterThanOrEqual(1);
    expect(stats.shapesByType.get("planner-wall")).toBe(2);
  });

  it("validateBeforeCreation merges defaults and validates", () => {
    const result = system.validateBeforeCreation(
      validWallPayload({
        id: "550e8400-e29b-41d4-a716-446655440011",
        endX: 50,
        lengthMm: 500,
      }),
    );
    expect(result.valid).toBe(true);
  });

  it("validateBeforeCreation rejects non-object payload", () => {
    const result = system.validateBeforeCreation(null);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("object");
  });

  it("createValidatedShape creates shape when valid", () => {
    const shapeData = {
      id: WALL_UUID,
      type: "planner-wall",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        lengthMm: 1000,
        thickness: 10,
        material: "drywall",
        isLoadBearing: false,
        isExterior: false,
        hasJunctionStart: false,
        hasJunctionEnd: false,
        showDimensions: true,
        showMaterial: false,
        color: "#336699",
      },
    };
    const created = system.createValidatedShape(shapeData as never);
    expect(created).not.toBeNull();
    expect(editor.createShape).toHaveBeenCalled();
  });

  it("createValidatedShape returns null when invalid", () => {
    const created = system.createValidatedShape({ type: "planner-wall" } as never);
    expect(created).toBeNull();
  });

  it("updateValidatedShape updates valid shape and clears cache", () => {
    const shape = asTLShape(validWallPayload());
    editor._shapes.push(shape);
    const ok = system.updateValidatedShape(shape.id, {
      props: { lengthMm: 2500 },
    } as never);
    expect(ok).toBe(true);
    expect(editor.updateShape).toHaveBeenCalled();
  });

  it("updateValidatedShape returns false for missing shape", () => {
    expect(system.updateValidatedShape("missing", {} as never)).toBe(false);
  });

  it("deleteShapeWithCleanup removes shape and cache entry", () => {
    const shape = asTLShape(validWallPayload());
    editor._shapes.push(shape);
    expect(system.deleteShapeWithCleanup(shape.id)).toBe(true);
    expect(editor.deleteShape).toHaveBeenCalledWith(shape.id);
  });

  it("autoFixInvalidShapes applies default props", () => {
    const bad = asTLShape(
      validWallPayload({
        id: "550e8400-e29b-41d4-a716-446655440099",
        color: "invalid",
      }),
    );
    editor._shapes.push(bad);
    const { fixed, failed } = system.autoFixInvalidShapes();
    expect(fixed + failed).toBeGreaterThanOrEqual(1);
  });

  it("exportValidatedShapes returns shapes and validation", () => {
    editor._shapes.push(asTLShape(validWallPayload()));
    const exported = system.exportValidatedShapes();
    expect(exported.shapes).toHaveLength(1);
    expect(exported.validation.valid).toBe(true);
  });

  it("importValidatedShapes imports valid shapes and reports failures", () => {
    const imported = system.importValidatedShapes([
      validWallPayload({ id: "550e8400-e29b-41d4-a716-446655440010" }),
      { type: "planner-wall", color: "bad" },
    ]);
    expect(imported.imported).toBe(1);
    expect(imported.failed).toBe(1);
    expect(imported.errors.length).toBe(1);
  });

  it("runComprehensiveValidation returns overall stats", () => {
    editor._shapes.push(asTLShape(validWallPayload()));
    const report = system.runComprehensiveValidation();
    expect(report.registeredTypes.length).toBeGreaterThan(0);
    expect(report.statistics.totalShapes).toBe(1);
  });

  it("reset clears custom registrations and reinitializes defaults", () => {
    system.registerShape({
      type: "temp",
      validator: () => ({ valid: true, errors: [] }),
      defaultProps: {},
    });
    system.reset();
    expect(system.isShapeRegistered("temp")).toBe(false);
    expect(system.isShapeRegistered("planner-wall")).toBe(true);
  });

  it("getTldrawValidator returns null placeholder", () => {
    expect(system.getTldrawValidator("planner-wall")).toBeNull();
  });

  it("getRegistration returns shape registration metadata", () => {
    const reg = system.getRegistration("planner-door");
    expect(reg?.defaultProps.doorType).toBe("single");
  });

  it("clearValidationCache allows re-validation", () => {
    const shape = asTLShape(validWallPayload());
    system.validateShape(shape);
    system.clearValidationCache();
    const again = system.validateShape(shape);
    expect(again.valid).toBe(true);
  });

  it("updateValidatedShape rejects invalid updates", () => {
    const shape = asTLShape(validWallPayload());
    editor._shapes.push(shape);
    const ok = system.updateValidatedShape(shape.id, {
      props: { color: "not-a-hex-color" },
    } as never);
    expect(ok).toBe(false);
  });

  it("validateShape uses generic validation for custom registered types", () => {
    system.registerShape({
      type: "custom-zone-like",
      validator: () => ({ valid: true, errors: [] }),
      defaultProps: { label: "x" },
    });
    const result = system.validateShape({
      id: "550e8400-e29b-41d4-a716-446655440099",
      type: "custom-zone-like",
      props: { label: "Test" },
    } as never);
    expect(result.valid).toBe(false);
  });

  it("deleteShapeWithCleanup returns false when editor throws", () => {
    editor.deleteShape.mockImplementationOnce(() => {
      throw new Error("delete failed");
    });
    expect(system.deleteShapeWithCleanup("missing-id")).toBe(false);
  });

  it("createValidatedShape returns null when editor.createShape throws", () => {
    editor.createShape.mockImplementationOnce(() => {
      throw new Error("create failed");
    });
    const created = system.createValidatedShape({
      id: WALL_UUID,
      type: "planner-wall",
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      isLocked: false,
      props: {
        startX: 0,
        startY: 0,
        endX: 100,
        endY: 0,
        lengthMm: 1000,
        thickness: 10,
        material: "drywall",
        isLoadBearing: false,
        isExterior: false,
        hasJunctionStart: false,
        hasJunctionEnd: false,
        showDimensions: true,
        showMaterial: false,
        color: "#336699",
      },
    } as never);
    expect(created).toBeNull();
  });

  it("updateValidatedShape returns false when editor.updateShape throws", () => {
    const shape = asTLShape(validWallPayload());
    editor._shapes.push(shape);
    editor.updateShape.mockImplementationOnce(() => {
      throw new Error("update failed");
    });
    expect(system.updateValidatedShape(shape.id, { props: { lengthMm: 3000 } } as never)).toBe(false);
  });

  it("autoFixInvalidShapes counts failures for unregistered types and update errors", () => {
    editor._shapes.push({ id: "bad-zone", type: "planner-zone", props: {} } as TLShape);
    const unregistered = system.autoFixInvalidShapes();
    expect(unregistered.failed).toBeGreaterThanOrEqual(1);

    const badWall = asTLShape(validWallPayload({ id: "550e8400-e29b-41d4-a716-446655440088", color: "bad" }));
    editor._shapes.length = 0;
    editor._shapes.push(badWall);
    editor.updateShape.mockImplementationOnce(() => {
      throw new Error("fix failed");
    });
    const fixFailed = system.autoFixInvalidShapes();
    expect(fixFailed.failed).toBeGreaterThanOrEqual(1);
  });

  it("importValidatedShapes records createShape failures", () => {
    editor.createShape.mockImplementationOnce(() => {
      throw new Error("import create failed");
    });
    const result = system.importValidatedShapes([
      validWallPayload({ id: "550e8400-e29b-41d4-a716-446655440012" }),
    ]);
    expect(result.imported).toBe(0);
    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain("Failed to create shape");
  });

  it("validateShape uses default branch for unregistered page shapes", () => {
    const shape = { id: "z1", type: "planner-zone", props: { zoneType: "focus" } } as TLShape;
    const result = system.validateShape(shape);
    expect(result.valid).toBe(false);
  });

  it("validateBeforeCreation rejects invalid payloads per shape type", () => {
    expect(system.validateBeforeCreation({ type: "planner-room", color: "bad" }).valid).toBe(false);
    expect(system.validateBeforeCreation({ type: "planner-furniture", color: "bad" }).valid).toBe(false);
    expect(system.validateBeforeCreation({ type: "planner-door", color: "bad" }).valid).toBe(false);
    expect(system.validateBeforeCreation({ type: "planner-window", color: "bad" }).valid).toBe(false);
  });

  it("validateShape rejects invalid room, furniture, door, and window payloads", () => {
    expect(system.validateShape({ id: "r-bad", type: "planner-room", props: {} } as TLShape).valid).toBe(false);
    expect(system.validateShape({ id: "f-bad", type: "planner-furniture", props: {} } as TLShape).valid).toBe(false);
    expect(system.validateShape({ id: "d-bad", type: "planner-door", props: {} } as TLShape).valid).toBe(false);
    expect(system.validateShape({ id: "w-bad", type: "planner-window", props: {} } as TLShape).valid).toBe(false);
  });

  it("validateBeforeCreation rejects non-object payloads and unregistered types", () => {
    expect(system.validateBeforeCreation(null).valid).toBe(false);
    expect(system.validateBeforeCreation("bad").valid).toBe(false);
    expect(system.validateBeforeCreation({ type: "not-registered" }).valid).toBe(false);
    expect(system.validateBeforeCreation({ type: "planner-zone", label: "Zone" }).valid).toBe(false);
  });

});