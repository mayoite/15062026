import { afterEach, describe, expect, it } from "vitest";

import { runPlannerComplianceCheck } from "@/features/planner/lib/compliance";
import { resetFabricRuntimeState, seedFabricRuntime } from "../integration/planner-fabric-mockRuntime";

describe("planner compliance", () => {
  afterEach(() => {
    resetFabricRuntimeState();
  });

  it("ignores non-furniture objects and empty drafts", () => {
    seedFabricRuntime({
      objects: [
        { name: "WALL:1", left: 0, top: 0, width: 100, height: 4 },
        { name: "GENERIC:desk-2", left: 0, top: 0, width: 100, height: 80 },
      ],
    });

    expect(runPlannerComplianceCheck(null, [])).toEqual([]);
  });

  it("reports overlapping workstations as critical warnings", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:desk-1", left: 0, top: 0, width: 100, height: 80 },
        { name: "GENERIC:desk-2", left: 50, top: 20, width: 100, height: 80 },
      ],
    });

    expect(runPlannerComplianceCheck(null, [])).toEqual([
      "CRITICAL: GENERIC:desk-1 overlaps GENERIC:desk-2",
    ]);
  });

  it("reports tight ADA clearances between separated modules", () => {
    seedFabricRuntime({
      objects: [
        { name: "GENERIC:desk-1", left: 0, top: 0, width: 100, height: 80 },
        { name: "GENERIC:desk-2", left: 105, top: 0, width: 100, height: 80 },
      ],
    });

    expect(runPlannerComplianceCheck(null, [])).toEqual([
      "COMPLIANCE WARNING: 1 module boundary clearances are under the strict 900mm ADA minimum.",
    ]);
  });
});

