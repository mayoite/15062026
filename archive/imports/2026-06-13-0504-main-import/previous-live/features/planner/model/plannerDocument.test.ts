import {
  createPlannerDocument,
  normalizePlannerDocument,
  parsePlannerDocumentImport,
  validatePlannerDocumentImport,
} from "./plannerDocument";
import {
  buildPlannerEnvelopeMetadata,
  createPlannerTransferEnvelope,
} from "./plannerEnvelope";
import { planRowToDocument } from "@/features/planner/store/plannerPersistence";

describe("planner document model", () => {
  it("creates documents with the current title-based contract", () => {
    const document = createPlannerDocument({
      title: "North Bay",
      projectName: "HQ Refresh",
      clientName: "Acme",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      seatTarget: 12,
      sceneJson: { nodes: [] },
    });

    expect(document).toMatchObject({
      schemaVersion: 1,
      title: "North Bay",
      projectName: "HQ Refresh",
      clientName: "Acme",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      seatTarget: 12,
      unitSystem: "metric",
      sceneJson: { nodes: [] },
      itemCount: 0,
      status: "draft",
    });
  });

  it("normalizes legacy name-shaped imports into the current title field", () => {
    const document = normalizePlannerDocument({
      name: "Imported Legacy Plan",
      room_width_mm: 6000,
      room_depth_mm: 8000,
      scene_json: { shapes: [] },
      unit_system: "imperial",
    });

    expect(document).toMatchObject({
      title: "Imported Legacy Plan",
      roomWidthMm: 6000,
      roomDepthMm: 8000,
      unitSystem: "imperial",
      sceneJson: { shapes: [] },
    });
  });

  it("round-trips through a drizzle plan row via the persistence helper", () => {
    const document = createPlannerDocument({
      title: "Executive Floor",
      projectName: "HQ Refresh",
      clientName: "Contoso",
      preparedBy: "Planner Bot",
      roomWidthMm: 8000,
      roomDepthMm: 6000,
      seatTarget: 14,
      unitSystem: "imperial",
      sceneJson: { shapes: [{ id: "shape-1" }] },
      itemCount: 6,
      status: "active",
    });

    // The `plans` table stores the full document in `payload`; metadata
    // columns are merged back on read.
    const restored = planRowToDocument({
      id: "550e8400-e29b-41d4-a716-446655440001",
      userId: "550e8400-e29b-41d4-a716-446655440000",
      name: document.title,
      engine: "oando",
      payload: document as unknown as Record<string, unknown>,
      thumbnailUrl: document.thumbnailUrl ?? null,
      status: document.status,
      createdAt: new Date("2026-04-07T00:00:00.000Z"),
      updatedAt: new Date("2026-04-07T00:00:00.000Z"),
    });

    expect(restored).toMatchObject({
      title: "Executive Floor",
      projectName: "HQ Refresh",
      clientName: "Contoso",
      preparedBy: "Planner Bot",
      roomWidthMm: 8000,
      roomDepthMm: 6000,
      seatTarget: 14,
      unitSystem: "imperial",
      sceneJson: { shapes: [{ id: "shape-1" }] },
      itemCount: 6,
      status: "active",
    });
  });

  it("parses canonical import envelopes and falls back to a valid default document", () => {
    const parsed = parsePlannerDocumentImport({
      type: "planner-document",
      document: createPlannerDocument({ title: "Imported Plan" }),
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.document?.title).toBe("Imported Plan");

    const fallback = validatePlannerDocumentImport({ bad: true });
    expect(fallback.valid).toBe(true);
    expect(fallback.errors).toEqual([]);
  });

  it("parses planner transfer envelopes into canonical documents", () => {
    const document = createPlannerDocument({
      title: "Transfer Plan",
      projectName: "HQ Refresh",
      clientName: "Acme",
      preparedBy: "Planner Bot",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      itemCount: 2,
      status: "active",
    });

    const envelope = createPlannerTransferEnvelope({
      planner: "oando",
      source: "export",
      documentId: "planner-doc-1",
      metadata: buildPlannerEnvelopeMetadata(document),
      document,
    });

    const parsed = parsePlannerDocumentImport(envelope);

    expect(parsed.ok).toBe(true);
    expect(parsed.document).toMatchObject({
      title: "Transfer Plan",
      projectName: "HQ Refresh",
      clientName: "Acme",
      preparedBy: "Planner Bot",
      roomWidthMm: 7200,
      roomDepthMm: 5400,
      itemCount: 2,
      status: "active",
    });
  });
});
