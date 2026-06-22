import { describe, expect, it } from "vitest";

import {
  buildAdminPlansListQuery,
  buildPlannerCanvasHref,
} from "@/features/planner/admin/plannerAdminLinks";

describe("planner admin links", () => {
  it("builds canvas hrefs with encoded plan ids", () => {
    expect(buildPlannerCanvasHref("abc-123")).toBe("/planner/canvas?id=abc-123");
    expect(buildPlannerCanvasHref(" plan/with spaces ")).toBe(
      "/planner/canvas?id=plan%2Fwith%20spaces",
    );
    expect(buildPlannerCanvasHref("")).toBe("/planner/canvas");
  });

  it("builds admin plan list queries from filters", () => {
    expect(buildAdminPlansListQuery({})).toBe(
      "/api/admin/plans?limit=50&sortBy=updated_at&sortOrder=desc",
    );
    expect(
      buildAdminPlansListQuery({
        status: "draft",
        search: "acme",
        sortBy: "created_at",
        sortOrder: "asc",
        page: 2,
        limit: 25,
      }),
    ).toBe(
      "/api/admin/plans?limit=25&page=2&sortBy=created_at&sortOrder=asc&status=draft&search=acme",
    );
  });
});
