import {
  getPlannerIdentityConfig,
  getPlannerWorkflowStages,
  listPlannerIdentityConfigs,
} from "@/features/planner/model/plannerIdentity";

describe("planner identity model", () => {
  it("declares Oando as the canonical /planner route with tldraw and 3D stages", () => {
    const oando = getPlannerIdentityConfig("oando");

    expect(oando).toMatchObject({
      id: "oando",
      displayName: "Workspace Planner",
      route: {
        canonical: "/planner/canvas",
        guest: "/planner/guest",
        compatibility: ["/oando-planner/canvas", "/oando-planner/guest", "/oando-planner/shared"],
        status: "canonical",
      },
    });
    expect(getPlannerWorkflowStages("oando")).toEqual([
      { id: "intake", label: "Sketch / intake", engine: "tldraw" },
      { id: "refine", label: "Refine / edit", engine: "tldraw" },
      { id: "preview", label: "Preview / export", engine: "three3d" },
    ]);
  });

  it("declares Buddy as a compatibility identity that resolves into /planner", () => {
    const buddy = getPlannerIdentityConfig("buddy");

    expect(buddy).toMatchObject({
      id: "buddy",
      displayName: "Workspace Planner",
      route: {
        canonical: "/planner/canvas",
        guest: "/planner/guest",
        compatibility: ["/buddy-planner/editor", "/buddy-planner/guest", "/buddy-planner/[...slug]"],
        status: "compatibility",
      },
    });
    expect(getPlannerWorkflowStages("buddy")).toEqual([
      { id: "refine", label: "Edit / place", engine: "tldraw" },
      { id: "preview", label: "Preview / export", engine: "three3d" },
    ]);
  });

  it("keeps OOFPL unresolved instead of inventing a route", () => {
    const oofpl = getPlannerIdentityConfig("oofpl");

    expect(oofpl).toMatchObject({
      id: "oofpl",
      displayName: "OOFPL Planner",
      route: {
        canonical: null,
        guest: null,
        status: "unresolved",
      },
    });
    expect(listPlannerIdentityConfigs()).toHaveLength(3);
  });
});
