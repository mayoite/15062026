import {
  buildPlannerPlacementMetadata,
  createPlannerPlacementEnvelope,
  validatePlannerPlacementEnvelope,
} from "@/features/planner/model/plannerPlacement";

describe("planner placement model", () => {
  const product = {
    id: "desk-001",
    name: "Desk 1200",
    category: "desks",
    widthMm: 1200,
    depthMm: 600,
    heightMm: 750,
    meshType: "box",
    productSlug: "desk-1200",
    plannerSourceSlug: "desk-1200-source",
  } as const;

  it("captures frozen catalog placement metadata for a planner item", () => {
    const item = buildPlannerPlacementMetadata("oando", {
      ...product,
      position: { xMm: 1200, yMm: 900 },
      rotationDeg: 45,
      zIndex: 3,
      locked: true,
      metadata: { catalogFamily: "workstations" },
    });

    expect(item).toMatchObject({
      planner: "oando",
      catalogProductId: "desk-001",
      catalogSlug: "desk-1200",
      plannerSourceSlug: "desk-1200-source",
      catalogCategory: "desks",
      name: "Desk 1200",
      shape: "box",
      position: { xMm: 1200, yMm: 900 },
      dimensions: { widthMm: 1200, depthMm: 600, heightMm: 750 },
      rotationDeg: 45,
      zIndex: 3,
      locked: true,
    });
  });

  it("wraps placement metadata in a planner-scoped envelope", () => {
    const item = buildPlannerPlacementMetadata("buddy", {
      ...product,
      position: { xMm: 0, yMm: 0 },
    });
    const envelope = createPlannerPlacementEnvelope("buddy", item);

    expect(envelope).toMatchObject({
      type: "cad-suite-planner-placement",
      version: 1,
      planner: "buddy",
      item: expect.objectContaining({
        planner: "buddy",
        catalogProductId: "desk-001",
      }),
    });

    expect(validatePlannerPlacementEnvelope(envelope)).toEqual(envelope);
  });
});

