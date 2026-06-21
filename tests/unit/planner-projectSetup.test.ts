/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  applyProjectSetup,
  isProjectSetupCompleteInStorage,
  markProjectSetupCompleteInStorage,
  metadataToDocumentFields,
  PLANNER_INDIAN_CITIES,
  PLANNER_PRIMARY_PURPOSE_OPTIONS,
  projectSetupStorageKey,
  resolveGridMmPerUnit,
  type PlannerProjectMetadata,
} from "@/features/planner/onboarding/projectSetup";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMetadata(overrides: Partial<PlannerProjectMetadata> = {}): PlannerProjectMetadata {
  return {
    projectName: "Test Office",
    city: "Patna",
    floorAreaSqFt: 1000,
    primaryPurpose: "workstations",
    seatTarget: 50,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// P2-03  Grid threshold — exact boundary
// ---------------------------------------------------------------------------

describe("resolveGridMmPerUnit — area boundary", () => {
  it("returns 500 at exactly 5000 sq ft (not >=, uses >)", () => {
    expect(resolveGridMmPerUnit(5000)).toBe(500);
  });

  it("returns 1000 at 5001 sq ft", () => {
    expect(resolveGridMmPerUnit(5001)).toBe(1000);
  });

  it("returns 500 for 99 sq ft (below minimum, grid still calculated)", () => {
    expect(resolveGridMmPerUnit(99)).toBe(500);
  });

  it("returns 500 for 100 sq ft", () => {
    expect(resolveGridMmPerUnit(100)).toBe(500);
  });

  it("returns 1000 for very large floor 999999 sq ft", () => {
    expect(resolveGridMmPerUnit(999999)).toBe(1000);
  });

  it("returns 500 for decimal 150.5 sq ft", () => {
    expect(resolveGridMmPerUnit(150.5)).toBe(500);
  });

  it("returns 500 for negative area (treated as small)", () => {
    expect(resolveGridMmPerUnit(-1)).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// P2-04  metadataToDocumentFields — seat target and room size
// ---------------------------------------------------------------------------

describe("metadataToDocumentFields — seat and room fields", () => {
  it("stores seatTarget as-is", () => {
    expect(metadataToDocumentFields(makeMetadata({ seatTarget: 1 })).seatTarget).toBe(1);
    expect(metadataToDocumentFields(makeMetadata({ seatTarget: 10000 })).seatTarget).toBe(10000);
  });

  it("room dimensions are at least 3000 mm each", () => {
    const fields = metadataToDocumentFields(makeMetadata({ floorAreaSqFt: 100 }));
    expect(fields.roomWidthMm).toBeGreaterThanOrEqual(3000);
    expect(fields.roomDepthMm).toBeGreaterThanOrEqual(3000);
  });

  it("maps city to clientName", () => {
    const fields = metadataToDocumentFields(makeMetadata({ city: "Mumbai" }));
    expect(fields.clientName).toBe("Mumbai");
  });

  it("larger floor produces larger room dimensions", () => {
    const small = metadataToDocumentFields(makeMetadata({ floorAreaSqFt: 500 }));
    const large = metadataToDocumentFields(makeMetadata({ floorAreaSqFt: 10000 }));
    expect(large.roomWidthMm).toBeGreaterThan(small.roomWidthMm);
  });
});

// ---------------------------------------------------------------------------
// P2-05  Purpose options and cities — completeness
// ---------------------------------------------------------------------------

describe("purpose options and city list", () => {
  it("exposes exactly 4 purpose options", () => {
    expect(PLANNER_PRIMARY_PURPOSE_OPTIONS).toHaveLength(4);
  });

  it("every purpose option has value, label, and description", () => {
    for (const option of PLANNER_PRIMARY_PURPOSE_OPTIONS) {
      expect(option.value).toBeTruthy();
      expect(option.label).toBeTruthy();
      expect(option.description).toBeTruthy();
    }
  });

  it("city list is non-empty and includes major metros", () => {
    expect(PLANNER_INDIAN_CITIES.length).toBeGreaterThan(10);
    expect(PLANNER_INDIAN_CITIES).toContain("Mumbai");
    expect(PLANNER_INDIAN_CITIES).toContain("Delhi");
    expect(PLANNER_INDIAN_CITIES).toContain("Bengaluru");
  });
});

// ---------------------------------------------------------------------------
// P2-06  applyProjectSetup — store mutations
// ---------------------------------------------------------------------------

describe("applyProjectSetup — store mutations", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState((state) => ({
      ...state,
      projectMetadata: null,
      unitSystem: "metric",
      layerVisible: {
        walls: true,
        rooms: true,
        zones: true,
        furniture: true,
        measurements: true,
      },
    }));
  });

  it("sets projectMetadata in workspaceStore", () => {
    const metadata = makeMetadata({ floorAreaSqFt: 1000, primaryPurpose: "workstations" });
    applyProjectSetup(metadata);
    const stored = usePlannerWorkspaceStore.getState().projectMetadata;
    expect(stored?.projectName).toBe("Test Office");
    expect(stored?.completedAt).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// P2-07  Storage failure — QuotaExceededError
// ---------------------------------------------------------------------------

describe("markProjectSetupCompleteInStorage — quota failure", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("throws DOMException QuotaExceededError when storage is full", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const err = new DOMException("QuotaExceededError", "QuotaExceededError");
      throw err;
    });

    expect(() => markProjectSetupCompleteInStorage(true, undefined)).toThrow(DOMException);
  });

  it("does not throw when storage succeeds", () => {
    expect(() => markProjectSetupCompleteInStorage(true, "test-plan")).not.toThrow();
    localStorage.removeItem(projectSetupStorageKey(true, "test-plan"));
  });
});

// ---------------------------------------------------------------------------
// P2-08  Stale flag — isProjectSetupCompleteInStorage
// ---------------------------------------------------------------------------

describe("isProjectSetupCompleteInStorage — flag states", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("returns false when no flag is set", () => {
    expect(isProjectSetupCompleteInStorage(true, undefined)).toBe(false);
  });

  it('returns true when flag is "true"', () => {
    markProjectSetupCompleteInStorage(true, undefined);
    expect(isProjectSetupCompleteInStorage(true, undefined)).toBe(true);
  });

  it("returns false for member scope when only guest scope is set", () => {
    markProjectSetupCompleteInStorage(true, undefined); // guest
    expect(isProjectSetupCompleteInStorage(false, undefined)).toBe(false); // member
  });

  it("returns false for a different planId", () => {
    markProjectSetupCompleteInStorage(false, "plan-a");
    expect(isProjectSetupCompleteInStorage(false, "plan-b")).toBe(false);
  });

  it("key format is stable: oando-project-setup-complete-{scope}-{planId}", () => {
    const guestKey = projectSetupStorageKey(true, undefined);
    const memberKey = projectSetupStorageKey(false, "my-plan");
    expect(guestKey).toMatch(/^oando-project-setup-complete-guest-/);
    expect(memberKey).toMatch(/^oando-project-setup-complete-member-/);
    expect(memberKey).toContain("my-plan");
  });
});
