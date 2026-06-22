import { describe, expect, it } from "vitest";

import {
  createPlannerDocument,
  parsePlannerDocumentImport,
  plannerDocumentToSaveRow,
  plannerSaveRowToDocument,
  validatePlannerDocumentImport,
} from "@/features/planner/model/plannerDocument";

describe("planner document model", () => {
  it("creates a normalized document with defaults", () => {
    const document = createPlannerDocument({
      name: "  North Bay  ",
      projectName: "  ",
      clientName: " Acme ",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      seatTarget: 12,
      sceneJson: { nodes: [] },
    });

    expect(document).toMatchObject({
      schemaVersion: 1,
      name: "North Bay",
      projectName: null,
      clientName: "Acme",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      seatTarget: 12,
      unitSystem: "metric",
      sceneJson: { nodes: [] },
      itemCount: 0,
      thumbnailUrl: null,
    });
  });

  it("round-trips through planner save rows", () => {
    const document = createPlannerDocument({
      name: "Executive Floor",
      projectName: "HQ Refresh",
      clientName: "Contoso",
      preparedBy: "Planner Bot",
      roomWidthMm: 8000,
      roomDepthMm: 6000,
      seatTarget: 14,
      unitSystem: "imperial",
      sceneJson: { shapes: [{ id: "shape-1" }] },
      itemCount: 6,
    });

    const row = plannerDocumentToSaveRow(document, {
      userId: "550e8400-e29b-41d4-a716-446655440000",
    });

    const restored = plannerSaveRowToDocument({
      ...row,
      created_at: "2026-04-07T00:00:00.000Z",
      updated_at: "2026-04-07T00:00:00.000Z",
    });

    expect(restored).toMatchObject({
      name: "Executive Floor",
      projectName: "HQ Refresh",
      clientName: "Contoso",
      preparedBy: "Planner Bot",
      roomWidthMm: 8000,
      roomDepthMm: 6000,
      seatTarget: 14,
      unitSystem: "imperial",
      sceneJson: { shapes: [{ id: "shape-1" }] },
      itemCount: 6,
    });
  });

  it("maps enquiry envelope and CRM sync metadata into planner save rows when provided", () => {
    const document = createPlannerDocument({
      id: "550e8400-e29b-41d4-a716-446655440099",
      name: "CRM Ready Plan",
      sceneJson: { shapes: [] },
    });

    const row = plannerDocumentToSaveRow(document, {
      userId: "550e8400-e29b-41d4-a716-446655440000",
      enquiryPayload: {
        type: "planner-enquiry",
        schemaVersion: 1,
        generatedAt: "2026-04-08T10:00:00.000Z",
        payload: {
          enquiryId: "ENQ-001",
          items: [{ sku: "desk-1", qty: 2 }],
        },
      },
      crmSyncStatus: "failed",
      crmSyncedAt: "2026-04-08T10:05:00.000Z",
      crmSyncError: "CRM rate limit",
    });

    expect(row).toMatchObject({
      enquiry_payload: {
        type: "planner-enquiry",
        schemaVersion: 1,
        generatedAt: "2026-04-08T10:00:00.000Z",
        payload: {
          enquiryId: "ENQ-001",
          items: [{ sku: "desk-1", qty: 2 }],
        },
      },
      crm_sync_status: "failed",
      crm_synced_at: "2026-04-08T10:05:00.000Z",
      crm_sync_error: "CRM rate limit",
    });
  });

  it("parses canonical import envelopes and validates bad JSON", () => {
    const parsed = parsePlannerDocumentImport({
      type: "planner-document",
      schemaVersion: 1,
      document: createPlannerDocument({ name: "Imported Plan" }),
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.document?.name).toBe("Imported Plan");

    const invalid = validatePlannerDocumentImport({ bad: true });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it("normalizes planner save rows when restoring from persisted data", () => {
    const restored = plannerSaveRowToDocument({
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Saved Imperial Import",
      project_name: null,
      client_name: null,
      prepared_by: null,
      room_width_mm: 20,
      room_depth_mm: 15,
      seat_target: 10,
      unit_system: "metric",
      item_count: 1,
      thumbnail_url: null,
      created_at: "2026-04-07T00:00:00.000Z",
      updated_at: "2026-04-07T00:00:00.000Z",
      scene_json: {
        type: "cad-suite-planner-scene",
        version: 1,
        measurement: {
          canonicalUnit: "ft",
          displayUnit: "ft-in",
          sourceUnit: "ft",
        },
        room: {
          widthMm: 20,
          depthMm: 15,
          wallHeightMm: 10,
          wallThicknessMm: 1,
          floorThicknessMm: 1,
          originMm: { xMm: 2, yMm: 3 },
        },
        items: [
          {
            id: "item-1",
            name: "Bench",
            category: "seating",
            centerMm: { xMm: 6, yMm: 4 },
            sizeMm: { widthMm: 5, depthMm: 2, heightMm: 3 },
            rotationDeg: 0,
          },
        ],
        fabricSnapshot: {},
      },
    });

    expect(restored).toMatchObject({
      unitSystem: "imperial",
      roomWidthMm: 6096,
      roomDepthMm: 4572,
    });
  });

  it("keeps old save rows backward-compatible by defaulting CRM metadata", () => {
    const restored = plannerSaveRowToDocument({
      id: "550e8400-e29b-41d4-a716-446655440000",
      user_id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Legacy Saved Plan",
      project_name: null,
      client_name: null,
      prepared_by: null,
      room_width_mm: 6000,
      room_depth_mm: 8000,
      seat_target: 10,
      unit_system: "metric",
      scene_json: {},
      item_count: 0,
      thumbnail_url: null,
      created_at: "2026-04-07T00:00:00.000Z",
      updated_at: "2026-04-07T00:00:00.000Z",
    });

    expect(restored).toMatchObject({
      name: "Legacy Saved Plan",
      roomWidthMm: 6000,
      roomDepthMm: 8000,
    });
  });

  it("normalizes imported geometry into canonical millimeters and keeps measurement metadata", () => {
    const parsed = parsePlannerDocumentImport({
      schemaVersion: 1,
      name: "Imperial Import",
      unitSystem: "metric",
      roomWidthMm: 20,
      roomDepthMm: 15,
      measurement: {
        displayUnit: "ft-in",
        sourceUnit: "ft",
      },
      sceneJson: {
        type: "cad-suite-planner-scene",
        version: 1,
        measurement: {
          canonicalUnit: "ft",
          displayUnit: "ft-in",
          sourceUnit: "ft",
        },
        room: {
          widthMm: 20,
          depthMm: 15,
          wallHeightMm: 10,
          wallThicknessMm: 1,
          floorThicknessMm: 1,
          originMm: { xMm: 2, yMm: 3 },
        },
        items: [
          {
            id: "item-1",
            name: "Bench",
            category: "seating",
            centerMm: { xMm: 6, yMm: 4 },
            sizeMm: { widthMm: 5, depthMm: 2, heightMm: 3 },
            rotationDeg: 0,
          },
        ],
        fabricSnapshot: {},
      },
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.document).toMatchObject({
      name: "Imperial Import",
      unitSystem: "imperial",
      roomWidthMm: 6096,
      roomDepthMm: 4572,
    });

    const scene = parsed.document?.sceneJson as {
      measurement: { canonicalUnit: string; displayUnit: string; sourceUnit?: string };
      room: { widthMm: number; depthMm: number; originMm: { xMm: number; yMm: number } };
      items: Array<{ centerMm: { xMm: number; yMm: number }; sizeMm: { widthMm: number; depthMm: number; heightMm: number } }>;
    };

    expect(scene.measurement).toEqual({
      canonicalUnit: "mm",
      displayUnit: "ft-in",
      sourceUnit: "ft",
    });
    expect(scene.room.widthMm).toBe(6096);
    expect(scene.room.depthMm).toBe(4572);
    expect(scene.room.originMm).toEqual({ xMm: 610, yMm: 914 });
    expect(scene.items[0]?.centerMm).toEqual({ xMm: 1829, yMm: 1219 });
    expect(scene.items[0]?.sizeMm).toEqual({ widthMm: 1524, depthMm: 610, heightMm: 914 });
  });
});

