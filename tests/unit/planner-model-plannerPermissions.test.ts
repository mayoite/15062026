import {
  PLANNER_GUEST_BLOCKED_ACTIONS,
  getPlannerActionPermissions,
  plannerActionIsBlocked,
} from "@/features/planner/model/plannerPermissions";

describe("planner permission model", () => {
  it("blocks mutation and transfer actions for guest contexts", () => {
    expect(PLANNER_GUEST_BLOCKED_ACTIONS).toEqual([
      "persist",
      "import",
      "export",
      "publish",
      "share",
    ]);
    expect(getPlannerActionPermissions("oando", "guest")).toMatchObject({
      allowedActions: ["view", "select"],
      blockedActions: PLANNER_GUEST_BLOCKED_ACTIONS,
    });
    expect(plannerActionIsBlocked("buddy", "guest", "export")).toBe(true);
    expect(plannerActionIsBlocked("oofpl", "guest", "persist")).toBe(true);
  });

  it("allows the full planner action set for authenticated and admin contexts", () => {
    expect(getPlannerActionPermissions("oando", "authenticated")).toMatchObject({
      blockedActions: [],
    });
    expect(getPlannerActionPermissions("buddy", "admin")).toMatchObject({
      blockedActions: [],
    });
  });
});

