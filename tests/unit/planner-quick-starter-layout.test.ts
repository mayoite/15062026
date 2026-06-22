import { describe, expect, it, beforeEach } from "vitest";

import { queueQuickStarterLayout } from "@/features/planner/ai/quickStarterLayout";
import { usePlannerWorkspaceStore } from "@/features/planner/store/workspaceStore";

describe("queueQuickStarterLayout", () => {
  beforeEach(() => {
    usePlannerWorkspaceStore.setState({
      projectMetadata: null,
      pendingBootstrapLayout: null,
    });
  });

  it("queues a grid-packed layout using defaults when metadata is missing", () => {
    queueQuickStarterLayout();
    const layout = usePlannerWorkspaceStore.getState().pendingBootstrapLayout;
    expect(layout).not.toBeNull();
    expect(layout?.room.widthMm).toBeGreaterThan(0);
    expect(layout?.walls.length).toBeGreaterThan(0);
    expect(layout?.furniture.length).toBeGreaterThan(0);
  });

  it("uses project metadata when available", () => {
    usePlannerWorkspaceStore.setState({
      projectMetadata: {
        projectName: "HQ",
        city: "Mumbai",
        floorAreaSqFt: 3000,
        primaryPurpose: "workstations",
        seatTarget: 24,
        completedAt: new Date().toISOString(),
      },
    });

    queueQuickStarterLayout();
    const layout = usePlannerWorkspaceStore.getState().pendingBootstrapLayout;
    expect(layout?.summary).toMatch(/24|seat/i);
    expect(layout?.furniture.length).toBeGreaterThan(0);
  });
});
