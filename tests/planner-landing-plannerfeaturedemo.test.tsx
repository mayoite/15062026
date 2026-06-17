import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlannerFeatureDemo } from "@/features/planner/landing/plannerfeaturedemo";

describe("PlannerFeatureDemo", () => {
  it("renders without crashing for known slug", () => {
    render(<PlannerFeatureDemo slug="draw" />);
    // basic render check - decorative so no specific text assert beyond no error
    expect(true).toBe(true);
  });

  it("renders for another slug", () => {
    render(<PlannerFeatureDemo slug="place" />);
    expect(true).toBe(true);
  });
});
