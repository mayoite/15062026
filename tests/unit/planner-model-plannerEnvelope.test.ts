import { createPlannerDocument } from "@/features/planner/model/plannerDocument";
import {
  buildPlannerEnvelopeMetadata,
  createPlannerTransferEnvelope,
  normalizePlannerTransferSource,
  validatePlannerTransferEnvelope,
} from "@/features/planner/model/plannerEnvelope";

describe("planner transfer envelope model", () => {
  const document = createPlannerDocument({
    title: "North Bay",
    projectName: "HQ Refresh",
    clientName: "Acme",
    preparedBy: "Planner Bot",
    itemCount: 4,
    status: "active",
    unitSystem: "metric",
  });

  it("builds a planner-scoped save/import/export envelope", () => {
    const envelope = createPlannerTransferEnvelope({
      planner: "oando",
      source: "export",
      documentId: "planner-doc-1",
      metadata: buildPlannerEnvelopeMetadata(document),
      document,
    });

    expect(envelope).toMatchObject({
      type: "cad-suite-planner-transfer-envelope",
      version: 1,
      planner: "oando",
      source: "export",
      documentId: "planner-doc-1",
      metadata: {
        title: "North Bay",
        projectName: "HQ Refresh",
        clientName: "Acme",
        preparedBy: "Planner Bot",
        status: "active",
        unitSystem: "metric",
        itemCount: 4,
      },
      document: expect.objectContaining({
        title: "North Bay",
        projectName: "HQ Refresh",
      }),
    });
  });

  it("rejects invalid planner identities and normalizes bad transfer sources", () => {
    expect(() =>
      validatePlannerTransferEnvelope({
        type: "cad-suite-planner-transfer-envelope",
        version: 1,
        planner: "invalid",
        source: "save",
        documentId: "planner-doc-1",
        metadata: buildPlannerEnvelopeMetadata(document),
        document,
      }),
    ).toThrow();

    expect(normalizePlannerTransferSource("share")).toBe("save");
    expect(normalizePlannerTransferSource("import")).toBe("import");
  });
});

