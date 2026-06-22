import { beforeEach, describe, expect, it } from "vitest";

import {
  GUEST_PROJECT_ID,
  MEMBER_PROJECT_ID,
  clearGuestPlanClaimed,
  isGuestPlanClaimed,
  markGuestPlanClaimed,
  migrateGuestProjectToMember,
  shouldMigrateGuestPlan,
  type BuddyProject,
} from "@/features/planner/persistence/persistence";

const guestSnapshot = JSON.stringify({ version: 1, store: { schema: {} } });

function makeProject(id: string, snapshot?: string): BuddyProject {
  return {
    id,
    name: id,
    createdAt: 1,
    updatedAt: 2,
    snapshot: snapshot ?? "",
  };
}

describe("shouldMigrateGuestPlan", () => {
  it("returns false when already claimed", () => {
    expect(
      shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, guestSnapshot), undefined, true),
    ).toBe(false);
  });

  it("returns false when guest has no snapshot", () => {
    expect(shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID), undefined, false)).toBe(false);
  });

  it("returns false when member already has a snapshot", () => {
    expect(
      shouldMigrateGuestPlan(
        makeProject(GUEST_PROJECT_ID, guestSnapshot),
        makeProject(MEMBER_PROJECT_ID, guestSnapshot),
        false,
      ),
    ).toBe(false);
  });

  it("returns true when guest has data and member slot is empty", () => {
    expect(
      shouldMigrateGuestPlan(makeProject(GUEST_PROJECT_ID, guestSnapshot), undefined, false),
    ).toBe(true);
  });
});

describe("migrateGuestProjectToMember", () => {
  beforeEach(() => {
    clearGuestPlanClaimed();
  });

  it("marks claimed without copying when member already has data", async () => {
    const saved: BuddyProject[] = [];
    const result = await migrateGuestProjectToMember({
      loadProject: async (id) => {
        if (id === GUEST_PROJECT_ID) return makeProject(GUEST_PROJECT_ID, guestSnapshot);
        if (id === MEMBER_PROJECT_ID) return makeProject(MEMBER_PROJECT_ID, guestSnapshot);
        return undefined;
      },
      saveProject: async (project) => {
        saved.push(project);
      },
    });

    expect(result).toBe("skipped");
    expect(saved).toHaveLength(0);
    expect(isGuestPlanClaimed()).toBe(true);
  });

  it("copies guest snapshot into member slot on first member visit", async () => {
    const saved: BuddyProject[] = [];
    const result = await migrateGuestProjectToMember({
      loadProject: async (id) => {
        if (id === GUEST_PROJECT_ID) {
          return {
            id: GUEST_PROJECT_ID,
            name: "Guest layout",
            createdAt: 10,
            updatedAt: 20,
            snapshot: guestSnapshot,
          };
        }
        return undefined;
      },
      saveProject: async (project) => {
        saved.push(project);
      },
    });

    expect(result).toBe("migrated");
    expect(saved).toEqual([
      expect.objectContaining({
        id: MEMBER_PROJECT_ID,
        snapshot: guestSnapshot,
        name: "Guest layout",
      }),
    ]);
    expect(isGuestPlanClaimed()).toBe(true);
  });

  it("returns no-guest-data when guest slot is empty", async () => {
    const result = await migrateGuestProjectToMember({
      loadProject: async () => undefined,
      saveProject: async () => {},
    });

    expect(result).toBe("no-guest-data");
    expect(isGuestPlanClaimed()).toBe(false);
  });

  it("is idempotent after claim flag is set", async () => {
    markGuestPlanClaimed();
    let saveCalls = 0;
    const result = await migrateGuestProjectToMember({
      loadProject: async (id) => {
        if (id === GUEST_PROJECT_ID) return makeProject(GUEST_PROJECT_ID, guestSnapshot);
        return undefined;
      },
      saveProject: async () => {
        saveCalls += 1;
      },
    });

    expect(result).toBe("skipped");
    expect(saveCalls).toBe(0);
  });
});

