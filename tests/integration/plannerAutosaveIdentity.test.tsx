import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  GUEST_PROJECT_ID,
  MEMBER_PROJECT_ID,
} from "@/features/planner/persistence/persistence";
import { getPlannerProjectId } from "@/features/planner/hooks/usePlannerAutosave";

const getOptionalPlannerUser = vi.fn();

vi.mock("@/lib/auth/plannerSession", () => ({
  getOptionalPlannerUser,
}));

vi.mock("@/features/planner/ui/PlannerWorkspaceRoute", () => ({
  PlannerWorkspaceRoute: ({
    guestMode = false,
    planId,
  }: {
    guestMode?: boolean;
    planId?: string;
  }) => (
    <div
      data-testid="planner-workspace-route"
      data-guest-mode={guestMode ? "true" : "false"}
      data-plan-id={planId ?? ""}
    />
  ),
}));

/**
 * Autosave identity contract:
 *   - Guest work always lives in the local guest slot until it is claimed,
 *     so a guest session never adopts a plan-scoped key.
 *   - A signed-in member opening `/planner/canvas?id=<plan>` gets a key scoped
 *     to that plan, so distinct cloud plans cannot overwrite each other.
 *   - A member with no plan id keeps the single legacy member slot.
 */
describe("getPlannerProjectId", () => {
  it("scopes the member key per plan id", () => {
    expect(getPlannerProjectId(false, "A")).toBe(`${MEMBER_PROJECT_ID}:A`);
    expect(getPlannerProjectId(false, "B")).toBe(`${MEMBER_PROJECT_ID}:B`);
    expect(getPlannerProjectId(false, "A")).not.toBe(getPlannerProjectId(false, "B"));
  });

  it("trims the plan id and falls back to the legacy member slot when blank", () => {
    expect(getPlannerProjectId(false, "  A  ")).toBe(`${MEMBER_PROJECT_ID}:A`);
    expect(getPlannerProjectId(false)).toBe(MEMBER_PROJECT_ID);
    expect(getPlannerProjectId(false, "")).toBe(MEMBER_PROJECT_ID);
    expect(getPlannerProjectId(false, "   ")).toBe(MEMBER_PROJECT_ID);
  });

  it("always keeps guest work in the local guest slot, ignoring any plan id", () => {
    expect(getPlannerProjectId(true)).toBe(GUEST_PROJECT_ID);
    expect(getPlannerProjectId(true, "A")).toBe(GUEST_PROJECT_ID);
    expect(getPlannerProjectId(true, "  shared-plan  ")).toBe(GUEST_PROJECT_ID);
  });
});

describe("/planner/canvas route", () => {
  async function renderCanvas(searchParams: Record<string, string | string[] | undefined>) {
    const { default: PlannerCanvasRoute } = await import(
      "@/app/planner/(workspace)/canvas/page"
    );
    const page = await PlannerCanvasRoute({ searchParams: Promise.resolve(searchParams) });
    render(page);
    return screen.getByTestId("planner-workspace-route");
  }

  it("passes the query plan id into member workspace mode", async () => {
    getOptionalPlannerUser.mockResolvedValue({ id: "member-1" });

    const route = await renderCanvas({ id: "plan-A" });

    expect(route.getAttribute("data-guest-mode")).toBe("false");
    expect(route.getAttribute("data-plan-id")).toBe("plan-A");
  });

  it("normalizes an array-valued plan id to its first entry", async () => {
    getOptionalPlannerUser.mockResolvedValue({ id: "member-1" });

    const route = await renderCanvas({ id: ["plan-A", "plan-B"] });

    expect(route.getAttribute("data-plan-id")).toBe("plan-A");
  });

  it("falls back to the legacy member key when no plan id is provided", async () => {
    getOptionalPlannerUser.mockResolvedValue({ id: "member-2" });

    const route = await renderCanvas({});

    expect(route.getAttribute("data-guest-mode")).toBe("false");
    expect(route.getAttribute("data-plan-id")).toBe("");
  });

  it("renders guest mode when there is no planner session", async () => {
    getOptionalPlannerUser.mockResolvedValue(null);

    const route = await renderCanvas({ id: "plan-A" });

    expect(route.getAttribute("data-guest-mode")).toBe("true");
    const guestMode = route.getAttribute("data-guest-mode") === "true";
    const planId = route.getAttribute("data-plan-id") || undefined;
    expect(getPlannerProjectId(guestMode, planId)).toBe(GUEST_PROJECT_ID);
  });
});
