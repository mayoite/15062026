import { describe, expect, it } from "vitest";

import { apiPath } from "@/lib/api/browserApi";

describe("apiPath", () => {
  it("adds trailing slash to API paths", () => {
    expect(apiPath("/api/plans")).toBe("/api/plans/");
    expect(apiPath("/api/plans/")).toBe("/api/plans/");
  });

  it("preserves query strings", () => {
    expect(apiPath("/api/admin/plans?limit=50")).toBe("/api/admin/plans/?limit=50");
  });

  it("leaves non-API paths unchanged", () => {
    expect(apiPath("/planner/canvas")).toBe("/planner/canvas");
  });
});
